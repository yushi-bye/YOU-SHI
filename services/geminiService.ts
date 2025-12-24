
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChartConfig } from "../types";

// Always use named parameter and process.env.API_KEY directly for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FLASH = 'gemini-3-flash-preview';
const MODEL_PRO = 'gemini-3-pro-preview'; // Better for coding/reasoning
const MODEL_VISION = 'gemini-3-flash-preview'; // Good for vision speed
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';
const MODEL_IMAGE = 'gemini-2.5-flash-image';

/**
 * Helper: Generate simple text for the AI Bridge
 */
export const generateText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Text Gen Error:", error);
    throw error;
  }
};

export interface FlashAppConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Generate a "Flash App" (Single file HTML/JS)
 */
export const generateFlashApp = async (prompt: string, config?: FlashAppConfig): Promise<string> => {
  const systemInstruction = `
    You are an expert frontend engineer and creative coder.
    Your goal is to create a "Flash App" based on the user's description.
    The app must be a SINGLE HTML string containing CSS (embedded) and JS (embedded).
    It should be modern, using Tailwind CSS via CDN if needed, and responsive.
    
    Technical Requirements:
    - Use HTML5 Canvas for 2D games/visualizations.
    - For 3D requests, use Three.js via CDN (https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js).
    - **CRITICAL FOR 3D**: Do NOT attempt to load external models (like .gltf, .obj) unless the user provides a specific URL. 
      Instead, you MUST construct the 3D objects (e.g., Pyramids, Dinosaurs, Cars) procedurally using Three.js Primitives (BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry) grouped together.
    - Always include 'OrbitControls' for 3D scenes so the user can rotate/zoom (https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js).
    - Ensure the app is interactive (mouse/touch events) and handles window resizing.
    
    **THEMING (Light/Dark Mode)**:
    - Use Tailwind's class-based dark mode strategy.
    - The <html> tag MUST have class="dark" by default.
    - Define colors for both modes (e.g., bg-white dark:bg-gray-900, text-gray-900 dark:text-white).
    - **CRITICAL**: Include this specific script to handle theme toggling and explicit setting via postMessage:
      \`\`\`javascript
      window.addEventListener('message', (e) => {
        if (e.data.type === 'TOGGLE_THEME') {
          document.documentElement.classList.toggle('dark');
          window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: document.documentElement.classList.contains('dark') } }));
        }
        if (e.data.type === 'SET_THEME') {
          if (e.data.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: document.documentElement.classList.contains('dark') } }));
        }
      });
      \`\`\`

    **PERFORMANCE & QUALITY CONTROL**:
    - Implement a listener for 'SET_QUALITY' to toggle between 'high' (best visuals) and 'low' (best performance).
    - **CRITICAL**: Expose key objects (like window.renderer, window.scene) or implement a logic block to handle this.
      \`\`\`javascript
      window.addEventListener('message', (e) => {
        if (e.data.type === 'SET_QUALITY') {
          const isHigh = e.data.level === 'high';
          
          // Three.js Handler (if applicable)
          if (window.renderer) {
            window.renderer.setPixelRatio(isHigh ? window.devicePixelRatio : 1);
            if (window.renderer.shadowMap) window.renderer.shadowMap.enabled = isHigh;
          }
          
          // Canvas 2D Handler (if applicable)
          const canvas = document.querySelector('canvas');
          if (canvas && !window.renderer) {
             // Re-adjust resolution if you implemented dynamic resizing
          }
          
          // Trigger Custom Callback if defined
          if (typeof setAppQuality === 'function') setAppQuality(e.data.level);
        }
      });
      \`\`\`
    - **For Three.js**: Make sure to assign window.renderer = renderer; after creating the WebGLRenderer.

    **BACKEND AI CAPABILITIES (The "Secret Weapon")**:
    - The generated app is NOT static. It can call the backend AI model for real-time text generation, reasoning, or NPC dialogue.
    - **YOU MUST** implement the following callAI function in the generated code if the user's request involves "smart" features (e.g., RPG generation, Chatbot, AI opponent, dynamic story):
    
    \`\`\`javascript
    async function callAI(prompt) {
      const requestId = Date.now().toString() + Math.random().toString();
      // Send request to parent window
      window.parent.postMessage({ type: 'AI_REQUEST', prompt, requestId }, '*');
      
      return new Promise((resolve) => {
        const handler = (event) => {
          if (event.data.type === 'AI_RESPONSE' && event.data.requestId === requestId) {
            window.removeEventListener('message', handler);
            resolve(event.data.text);
          }
        };
        window.addEventListener('message', handler);
      });
    }
    \`\`\`

    - Example usage in the app:
      const story = await callAI("You are a dungeon master. The player went left. What happens?");
      document.getElementById('story').innerText = story;

    - Do not use markdown backticks (\`\`\`html), just return the raw HTML code.
  `;

  // Determine model and parameters from config or defaults
  const selectedModel = config?.model || MODEL_PRO;
  const requestConfig: any = {
    systemInstruction: systemInstruction,
    temperature: config?.temperature ?? 0.7,
  };

  if (config?.maxOutputTokens) {
    requestConfig.maxOutputTokens = config.maxOutputTokens;
  }

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: prompt,
    config: requestConfig
  });
  
  let code = response.text || '';
  // Cleanup if model adds markdown blocks despite instructions
  code = code.replace(/```html/g, '').replace(/```/g, '');
  
  if (!code.trim()) {
    throw new Error("Empty response from AI model");
  }

  return code;
};

/**
 * Chat with structured output capability (Charts) and Multimodal Support
 */
export const chatWithData = async (
  message: string, 
  history: { role: string, parts: any[] }[],
  audioData?: { data: string, mimeType: string }
): Promise<{ text: string, chart?: ChartConfig }> => {

  const systemInstruction = `
    You are an intelligent AI assistant focused on "Information Aesthetics".
    Answer clearly and concisely.
    
    If the user provides audio input, acknowledge its content or tone if relevant.
    
    If the user asks for data visualization, statistics, or comparisons, YOU MUST return a JSON object representing the chart data alongside your explanation.
    
    The output format for a chart request should be a JSON block wrapped in \`\`\`json ... \`\`\`.
    The JSON structure must be:
    {
      "isChart": true,
      "title": "Chart Title",
      "type": "bar" | "line" | "pie",
      "xAxisKey": "name", 
      "dataKey": "value",
      "data": [ {"name": "Label1", "value": 10}, {"name": "Label2", "value": 20} ]
    }
  `;

  try {
    // Provide history directly to ai.chats.create
    const chat = ai.chats.create({
      model: MODEL_PRO,
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      })),
      config: {
        systemInstruction,
      }
    });

    const messageParts: any[] = [{ text: message || "Listen to this audio." }];
    if (audioData) {
      messageParts.push({
        inlineData: {
          mimeType: audioData.mimeType,
          data: audioData.data
        }
      });
    }

    const result = await chat.sendMessage({ message: messageParts });
    const text = result.text || '';
    
    // Extract JSON if present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    let chartConfig: ChartConfig | undefined;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.isChart) {
          chartConfig = parsed;
        }
      } catch (e) {
        console.error("Failed to parse chart JSON", e);
      }
    }

    // Remove the JSON block from the text for cleaner display
    const cleanText = text.replace(/```json\s*[\s\S]*?\s*```/, '').trim();

    return { text: cleanText, chart: chartConfig };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "Sorry, I encountered an error connecting to the AI." };
  }
};

/**
 * Vision Analysis
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt || "Describe this image in detail." }
        ]
      }
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Error analyzing image.";
  }
};

/**
 * Generate Speech from Text
 */
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore, Puck, Charon, Fenrir, Zephyr
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

/**
 * Generate Illustration (Image) from Text
 */
export const generateIllustration = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: {
        parts: [{ text: prompt }]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};
