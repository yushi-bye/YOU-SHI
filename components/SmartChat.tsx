

import React, { useState, useRef, useEffect } from 'react';
import { chatWithData, generateSpeech, generateIllustration } from '../services/geminiService';
import { ChatMessage, ChartConfig } from '../types';
import { Send, User, Bot, BarChart2, Volume2, StopCircle, Loader2, Image as ImageIcon, Download, Mic, MicOff, Waves } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SmartChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '你好！我是遊戲對話 AI。我可以：\n1. 分析數據並製作圖表\n2. 朗讀故事或英文 (TTS)\n3. 接收語音輸入 (點擊麥克風按鈕)\n4. 生成抽象概念插圖\n\n試試看：「比較 Q1 到 Q4 營收」或點擊麥克風說說話。',
      timestamp: Date.now(),
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSend = async (audioData?: { data: string, mimeType: string }) => {
    if ((!input.trim() && !audioData) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input || (audioData ? "[語音訊息]" : ""),
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const { text, chart } = await chatWithData(userMsg.text, history, audioData);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: Date.now(),
        type: chart ? 'chart' : 'text',
        data: chart
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          handleSend({ data: base64Data, mimeType: audioBlob.type });
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      alert("無法存取麥克風，請檢查權限設定。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `生成圖片：${input}`,
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const base64Image = await generateIllustration(userMsg.text);
      
      if (base64Image) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: `這是為您生成的「${input}」插圖：`,
          timestamp: Date.now(),
          type: 'image',
          image: base64Image
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "抱歉，無法生成圖片，請稍後再試。",
          timestamp: Date.now(),
          type: 'text'
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (error) {
       console.error("Image gen failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (playingMessageId === msgId) {
      stopAudio();
      return;
    }
    stopAudio();
    setAudioLoadingId(msgId);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error("No audio generated");

      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setPlayingMessageId(null);
      sourceRef.current = source;
      source.start(0);
      setPlayingMessageId(msgId);
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const renderChart = (data: ChartConfig) => {
    return (
      <div className="w-full h-64 md:h-80 bg-cyber-800 rounded-xl p-4 mt-4 border border-cyber-700">
        <h3 className="text-center text-cyber-cyan font-bold mb-4">{data.title}</h3>
        <ResponsiveContainer width="100%" height="100%">
          {data.type === 'line' ? (
            <LineChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={data.xAxisKey} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#ec4899' }}
              />
              <Legend />
              <Line type="monotone" dataKey={data.dataKey} stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          ) : data.type === 'pie' ? (
            <PieChart>
              <Pie
                data={data.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey={data.dataKey}
                nameKey={data.xAxisKey}
              >
                {data.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={data.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={data.xAxisKey} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              <Legend />
              <Bar dataKey={data.dataKey} fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-2 md:p-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-pink to-cyber-purple">
          遊戲對話 (Game Chat)
        </h1>
        <p className="text-gray-400 text-sm">全模態 AI：文字、語音、圖表與插圖。</p>
      </header>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-cyber-purple' : 'bg-cyber-cyan'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`relative group px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-cyber-purple/20 border border-cyber-purple/50 text-white rounded-tr-sm'
                    : 'bg-cyber-800 border border-cyber-700 text-gray-100 rounded-tl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                   {msg.text}
                </div>
                
                {msg.type === 'image' && msg.image && (
                  <div className="mt-3 relative group/image">
                    <img 
                      src={`data:image/png;base64,${msg.image}`} 
                      alt="Generated" 
                      className="rounded-lg shadow-lg border border-cyber-700 max-h-64 md:max-h-80 w-auto object-cover"
                    />
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `data:image/png;base64,${msg.image}`;
                        link.download = `image-${msg.id}.png`;
                        link.click();
                      }}
                      className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                )}

                {msg.role === 'model' && (
                  <button
                    onClick={() => handleSpeak(msg.text, msg.id)}
                    className={`absolute -bottom-8 left-0 p-1.5 rounded-full transition-all flex items-center gap-1 ${
                      playingMessageId === msg.id 
                        ? 'text-cyber-cyan bg-cyber-cyan/10' 
                        : 'text-gray-500 hover:text-cyber-cyan opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {audioLoadingId === msg.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : playingMessageId === msg.id ? (
                      <>
                        <StopCircle size={16} />
                        <span className="text-xs font-mono">Playing...</span>
                      </>
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                )}
              </div>
              
              {msg.type === 'chart' && msg.data && (
                <div className="w-full mt-2 animate-pulse-slow transition-all duration-1000">
                  <div className="flex items-center gap-2 text-xs text-cyber-cyan mb-1">
                    <BarChart2 size={12} />
                    <span>資料可視化已生成</span>
                  </div>
                  {/* Fix: reference msg.data instead of undefined data */}
                  {renderChart(msg.data as ChartConfig)}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-cyber-cyan flex items-center justify-center">
               <Bot size={16} />
             </div>
             <div className="bg-cyber-800 border border-cyber-700 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`bg-cyber-800 rounded-xl p-2 border transition-all duration-300 ${isRecording ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cyber-700'} flex gap-2 items-center`}>
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <Waves className="text-red-500 animate-pulse" size={20} />
            <span className="text-red-500 text-sm font-medium animate-pulse">正在錄音中...</span>
          </div>
        ) : (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="輸入訊息或使用語音..."
            className="flex-1 bg-transparent px-4 py-2 text-white focus:outline-none"
            disabled={isLoading}
          />
        )}
        
        {/* Multimodal Inputs */}
        <div className="flex items-center gap-1">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-all ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-cyber-cyan/10 hover:bg-cyber-cyan/30 text-cyber-cyan'
            }`}
            title={isRecording ? "停止錄音" : "語音輸入"}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleGenerateImage}
            disabled={isLoading || !input.trim() || isRecording}
            className="bg-cyber-purple/10 hover:bg-cyber-purple/30 text-cyber-purple p-2 rounded-lg transition-colors disabled:opacity-50"
            title="生成插圖"
          >
            <ImageIcon size={20} />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !isRecording)}
            className="bg-cyber-cyan/20 hover:bg-cyber-cyan/40 text-cyber-cyan p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartChat;
