import React, { useState, useEffect, useRef } from 'react';
import { generateFlashApp, FlashAppConfig } from '../services/geminiService';
import LZString from 'lz-string';
import { Loader2, Play, Smartphone, Trash2, Download, Eye, FileCode, Copy, Check, Box, X, Sparkles, History as HistoryIcon, Clock, BrainCircuit, Calculator, PlayCircle, Zap, Sun, Moon, Maximize, Mic, MicOff, Target, RotateCcw, Gauge, Layers } from 'lucide-react';

const PRESETS = [
  { 
    label: '🧙‍♂️ AI RPG', 
    prompt: '製作一個純文字冒險 RPG 遊戲。介面要是復古終端機風格 (綠色文字黑色背景)。\n功能：\n1. 遊戲開始時，使用 callAI 生成一個隨機的賽博龐克開場劇情。\n2. 玩家輸入行動後，使用 callAI 判斷結果並生成下一段劇情。\n3. 不需要預設劇情，全部由 AI 即時生成。' 
  },
  { 
    label: '🧮 霓虹計算機', 
    prompt: '製作一個具有霓虹燈光效果 (Neon Glow) 的賽博龐克風格計算機。支援加減乘除與括號運算，按鈕要有按下效果，顯示螢幕要有數位字體風格。' 
  },
  { 
    label: '🐍 貪食蛇', 
    prompt: '使用 HTML5 Canvas 製作一個經典的貪食蛇遊戲。背景為深色網格，蛇身為螢光綠，食物為紅色發光點。加入計分板和「遊戲結束」重新開始的功能。' 
  },
  { 
    label: '📊 排序視覺化', 
    prompt: '製作一個互動式排序演算法視覺化工具。顯示一組隨機高度的長條圖，讓使用者可以選擇「氣泡排序」或「快速排序」來觀察排序過程的動畫。' 
  },
  { 
    label: '🌌 3D 太陽系', 
    prompt: '建立一個 3D 太陽系模型，包含發光的太陽 and 幾個繞行的行星（不同顏色 and 大小）。背景是星空，行星要有公轉動畫。使用 Three.js 和 OrbitControls。' 
  }
];

const SCENARIO_CATEGORIES = [
  {
    name: "生活應用",
    icon: <Clock size={16} />,
    items: [
      { label: "🥚 溏心蛋計時器", prompt: "製作一個溏心蛋計時器應用。提供「流心 (6分)」、「半熟 (8分)」、「全熟 (10分)」三種按鈕。畫面中央要有雞蛋動畫。" },
      { label: "🚗 養車成本計算", prompt: "製作一個養車成本計算器。使用者可以輸入油錢、保險、保養費。自動計算每月與年度總支出。" }
    ]
  }
];

interface ShareData {
  p: string;
  h: string;
  c: FlashAppConfig;
  v: number;
}

const FlashAppGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSelectorCopied, setIsSelectorCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [quality, setQuality] = useState<'low' | 'high'>('high');
  
  const [genConfig] = useState<FlashAppConfig>({
    model: 'gemini-3-pro-preview',
    temperature: 0.7,
    maxOutputTokens: 16384
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get('share');
    if (shareCode) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(shareCode);
        if (decompressed) {
          const data: ShareData = JSON.parse(decompressed);
          setPrompt(data.p);
          setGeneratedHtml(data.h);
        }
      } catch (e) { console.error("Failed to load shared app", e); }
    }
  }, []);

  // Sync quality settings with iframe whenever quality or HTML changes
  useEffect(() => {
    if (generatedHtml && iframeRef.current && iframeRef.current.contentWindow) {
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'SET_QUALITY', level: quality }, '*');
        iframeRef.current?.contentWindow?.postMessage({ type: 'SET_THEME', theme: isDarkTheme ? 'dark' : 'light' }, '*');
      }, 500); // Small delay to ensure iframe content is ready
      return () => clearTimeout(timer);
    }
  }, [generatedHtml, quality, isDarkTheme]);

  const handleGenerate = async (manualPrompt?: string) => {
    const finalPrompt = (manualPrompt || prompt).trim();
    if (!finalPrompt || isGenerating) return;
    
    setIsGenerating(true);
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();

    try {
      const html = await generateFlashApp(finalPrompt, genConfig);
      setGeneratedHtml(html);
    } catch (err) {
      console.error(err);
      alert("生成失敗，請稍後再試。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      // Reloading by resetting srcDoc is common for these kinds of sandboxes
      const currentHtml = generatedHtml;
      setGeneratedHtml(null);
      setTimeout(() => setGeneratedHtml(currentHtml), 50);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音辨識。");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const triggers = ['生成', '開始', '製作', '執行', 'generate', 'start', 'go'];
      
      const foundTrigger = triggers.find(t => transcript.toLowerCase().includes(t));
      
      if (foundTrigger) {
        const cleanPart = transcript.replace(new RegExp(foundTrigger, 'gi'), '').trim();
        const fullPrompt = prompt ? `${prompt} ${cleanPart}` : cleanPart;
        
        setPrompt(fullPrompt);
        handleGenerate(fullPrompt);
      } else {
        setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const copyToClipboard = () => {
    if (generatedHtml) {
      navigator.clipboard.writeText(generatedHtml);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flash-app-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySelector = async () => {
    try {
      await navigator.clipboard.writeText('#flash-app-iframe');
      setIsSelectorCopied(true);
      setTimeout(() => setIsSelectorCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy selector', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cyber-900 text-slate-100 p-4 md:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="text-cyber-cyan w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyber-cyan to-blue-500">
            閃應用生成器
          </h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsDarkTheme(!isDarkTheme);
            }} 
            className="p-2 bg-cyber-800 border border-cyber-700 rounded-xl hover:bg-cyber-700 transition-colors"
            title="切換預覽主題"
          >
            {isDarkTheme ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-cyber-cyan" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Sidebar / Input Area */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4 shrink-0 overflow-hidden">
          <div className="bg-cyber-800/50 backdrop-blur-sm border border-cyber-700 rounded-2xl p-4 shadow-xl relative">
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述應用程式內容... (說「生成」來自動開始)"
                className="w-full h-40 bg-cyber-900/80 border border-cyber-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-cyber-cyan focus:outline-none resize-none placeholder:text-slate-500 pr-10"
              />
              <button 
                onClick={toggleSpeechRecognition}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-slate-500 hover:text-cyber-cyan'}`}
                title="語音輸入 (說「生成」來觸發)"
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>

            {isListening && (
              <div className="absolute -top-10 left-4 bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan text-[10px] font-bold px-3 py-1 rounded-full animate-bounce">
                正在聽取中... 說「生成」開始
              </div>
            )}

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-4 py-3.5 bg-cyber-cyan text-black font-bold rounded-xl hover:bg-cyan-400 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <PlayCircle size={20} />}
              {isGenerating ? '正在編寫代碼...' : '立即生成應用'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-cyber-cyan" /> 快速範例
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => setPrompt(p.prompt)} 
                  className="w-full text-left p-3.5 bg-cyber-800/30 hover:bg-cyber-800 border border-cyber-700/50 rounded-xl transition-all hover:border-cyber-cyan/50 text-sm group"
                >
                  <span className="text-slate-200 group-hover:text-white">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 bg-cyber-800/50 backdrop-blur-sm rounded-2xl border border-cyber-700 flex flex-col overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-3 border-b border-cyber-700 bg-cyber-800/80">
            <div className="flex bg-black/40 p-1 rounded-lg">
              <button 
                onClick={() => setIsCodeMode(false)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isCodeMode ? 'bg-cyber-cyan text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                預覽介面
              </button>
              <button 
                onClick={() => setIsCodeMode(true)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isCodeMode ? 'bg-cyber-cyan text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                源碼分析
              </button>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-black/40 rounded-lg p-0.5 mr-1">
                <button 
                  onClick={() => setQuality('low')}
                  className={`p-1.5 rounded-md transition-all ${quality === 'low' ? 'bg-cyber-700 text-cyber-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                  title="低品質 (高效能)"
                >
                  <Gauge size={16} />
                </button>
                <button 
                  onClick={() => setQuality('high')}
                  className={`p-1.5 rounded-md transition-all ${quality === 'high' ? 'bg-cyber-700 text-cyber-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                  title="高品質 (精緻視覺)"
                >
                  <Layers size={16} />
                </button>
              </div>

              <button onClick={handleReload} title="重新載入預覽" className="p-2 hover:bg-cyber-700 rounded-lg transition-colors text-slate-400 hover:text-cyber-cyan">
                <RotateCcw size={18} />
              </button>
              <button onClick={copyToClipboard} title="複製代碼" className="p-2 hover:bg-cyber-700 rounded-lg transition-colors text-slate-400 hover:text-cyber-cyan">
                {isCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
              <button onClick={handleDownload} title="下載 HTML" className="p-2 hover:bg-cyber-700 rounded-lg transition-colors text-slate-400 hover:text-cyber-cyan">
                <Download size={18} />
              </button>
              <button onClick={handleCopySelector} title="複製 iframe 選擇器" className="p-2 hover:bg-cyber-700 rounded-lg transition-colors text-slate-400 hover:text-cyber-cyan">
                {isSelectorCopied ? <Check size={18} className="text-green-400" /> : <Target size={18} />}
              </button>
              <button onClick={() => setIsFullscreen(true)} title="全螢幕預覽" className="p-2 hover:bg-cyber-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Maximize size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-white overflow-hidden relative group">
            {isCodeMode ? (
              <pre className="absolute inset-0 p-6 font-mono text-xs md:text-sm text-cyber-cyan bg-cyber-950 overflow-auto custom-scrollbar">
                {generatedHtml}
              </pre>
            ) : (
              generatedHtml ? (
                <iframe 
                  ref={iframeRef}
                  id="flash-app-iframe"
                  srcDoc={generatedHtml} 
                  className="w-full h-full border-none" 
                  sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-cyber-900/30">
                  <Box size={80} className="opacity-10 mb-6" />
                  <p className="text-lg font-medium">在左側輸入指令開始創作</p>
                  <p className="text-sm opacity-50 italic">嘗試使用語音說「做一個天氣預報應用，生成」</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      
      {isFullscreen && generatedHtml && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="bg-cyber-800 p-2 flex justify-between items-center border-b border-cyber-700">
            <span className="text-xs font-mono text-cyber-cyan ml-4">全螢幕預覽 (品質: {quality === 'high' ? '高' : '低'})</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setQuality(quality === 'high' ? 'low' : 'high')}
                className="px-3 py-1 rounded bg-cyber-700 text-xs font-bold text-cyber-cyan"
              >
                切換品質
              </button>
              <button onClick={() => setIsFullscreen(false)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg"><X size={20} /></button>
            </div>
          </div>
          <iframe 
            srcDoc={generatedHtml} 
            className="flex-1 border-none bg-white" 
            sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" 
            onLoad={() => {
              // Ensure settings are reapplied on full-screen reload
              setTimeout(() => {
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(f => f.contentWindow?.postMessage({ type: 'SET_QUALITY', level: quality }, '*'));
              }, 100);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default FlashAppGen;