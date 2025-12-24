import React, { useRef, useState, useCallback, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import { Camera, RefreshCw, Zap, FileText, Search, Sparkles, Code, Check, X, AlertCircle, PlayCircle } from 'lucide-react';

type VisionMode = 'object' | 'document' | 'diff' | 'story' | 'code';

const VisionEye: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isConfirmingCapture, setIsConfirmingCapture] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mode, setMode] = useState<VisionMode>('object');
  const [pendingMode, setPendingMode] = useState<VisionMode | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        setIsConfirmingCapture(true);
      }
    }
  }, []);

  const handleProceedAnalysis = async () => {
    if (!capturedImage) return;
    const base64 = capturedImage.split(',')[1];
    setIsConfirmingCapture(false);
    handleAnalyze(base64, mode);
  };

  const handleAnalyze = async (base64: string, currentMode: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    
    let prompt = "Describe what you see in this image.";
    if (currentMode === 'document') {
      prompt = "Read this document. Summarize the key financial figures or main arguments. Format structured data clearly.";
    } else if (currentMode === 'diff') {
      prompt = "Analyze this scene closely. Identify any anomalies, unique details, or hidden patterns.";
    } else if (currentMode === 'story') {
      prompt = "Write a creative, engaging short story inspired by this image. Use vivid language and create a mood that matches the visual.";
    } else if (currentMode === 'code') {
      prompt = "Act as a frontend engineer. This image is a UI sketch or screenshot. Generate the HTML and Tailwind CSS code to replicate this interface. Return only the code.";
    } else {
        prompt = "Identify the main object in this frame and explain its function.";
    }

    try {
      const result = await analyzeImage(base64, prompt);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Failed to analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setIsConfirmingCapture(false);
  };

  const attemptModeChange = (newMode: VisionMode) => {
    if (newMode === mode) return;
    // If analysis is visible or a capture is being confirmed, ask first
    if (analysis || isConfirmingCapture) {
      setPendingMode(newMode);
    } else {
      setMode(newMode);
    }
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
      reset();
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full relative">
      <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-cyber-cyan">
             遊戲之眼 (Game Eye)
           </h1>
           <p className="text-gray-400 text-sm">基於相機的視覺辨識與創作</p>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2 mb-4 bg-cyber-800 p-2 rounded-xl w-full md:w-fit self-center border border-cyber-700 justify-center z-10">
        <button
          onClick={() => attemptModeChange('object')}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${mode === 'object' ? 'bg-cyber-cyan text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Search size={16} /> 物件辨識
        </button>
        <button
          onClick={() => attemptModeChange('document')}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${mode === 'document' ? 'bg-cyber-cyan text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <FileText size={16} /> 文件解讀
        </button>
        <button
          onClick={() => attemptModeChange('diff')}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${mode === 'diff' ? 'bg-cyber-cyan text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Zap size={16} /> 複雜分析
        </button>
        <div className="w-px bg-cyber-700 mx-1 hidden md:block"></div>
        <button
          onClick={() => attemptModeChange('story')}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${mode === 'story' ? 'bg-cyber-purple text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Sparkles size={16} /> 故事創作
        </button>
        <button
          onClick={() => attemptModeChange('code')}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${mode === 'code' ? 'bg-cyber-purple text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Code size={16} /> UI 轉代碼
        </button>
      </div>

      {/* Mode Change Confirmation Overlay */}
      {pendingMode && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-cyber-800 border border-cyber-700 rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <div className="flex items-center gap-3 text-yellow-400 mb-4">
              <AlertCircle size={24} />
              <h4 className="font-bold">切換模式？</h4>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              切換到「{pendingMode === 'object' ? '物件辨識' : pendingMode === 'document' ? '文件解讀' : pendingMode === 'diff' ? '複雜分析' : pendingMode === 'story' ? '故事創作' : 'UI 轉代碼'}」模式將會清除目前的畫面與分析結果。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingMode(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-cyber-700 text-white hover:bg-cyber-600 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={confirmModeChange}
                className="flex-1 px-4 py-2 rounded-xl bg-cyber-cyan text-black font-bold hover:bg-cyan-400 transition-colors"
              >
                確定切換
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-cyber-700 flex flex-col items-center justify-center group">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
               <div className="w-full flex justify-between">
                 <div className={`border-t-4 border-l-4 w-16 h-16 rounded-tl-xl transition-colors ${mode === 'story' || mode === 'code' ? 'border-cyber-purple' : 'border-cyber-cyan/50'}`}></div>
                 <div className={`border-t-4 border-r-4 w-16 h-16 rounded-tr-xl transition-colors ${mode === 'story' || mode === 'code' ? 'border-cyber-purple' : 'border-cyber-cyan/50'}`}></div>
               </div>
               <div className="w-full flex justify-between">
                 <div className={`border-b-4 border-l-4 w-16 h-16 rounded-bl-xl transition-colors ${mode === 'story' || mode === 'code' ? 'border-cyber-purple' : 'border-cyber-cyan/50'}`}></div>
                 <div className={`border-b-4 border-r-4 w-16 h-16 rounded-br-xl transition-colors ${mode === 'story' || mode === 'code' ? 'border-cyber-purple' : 'border-cyber-cyan/50'}`}></div>
               </div>
            </div>
            
            <div className="absolute bottom-8 z-10 flex flex-col items-center gap-4">
              <p className="text-white/60 text-xs font-mono bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">點擊按鈕拍攝照片</p>
              <button
                onClick={capture}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 hover:scale-105 ${mode === 'story' || mode === 'code' ? 'border-cyber-purple bg-cyber-purple/20' : 'border-white bg-white/20'}`}
              >
                <div className={`w-16 h-16 rounded-full ${mode === 'story' || mode === 'code' ? 'bg-cyber-purple' : 'bg-white'}`}></div>
              </button>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full flex flex-col">
            <div className={`relative ${analysis ? 'h-1/2' : 'h-full'} w-full bg-black transition-all duration-500`}>
               <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
               
               {/* Pre-Analysis Confirmation UI */}
               {isConfirmingCapture && (
                 <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-cyber-900/90 border border-cyber-700 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full">
                       <div className="w-16 h-16 rounded-full bg-cyber-cyan/20 flex items-center justify-center text-cyber-cyan border border-cyber-cyan/50 animate-pulse">
                         <Camera size={32} />
                       </div>
                       <div className="text-center">
                         <h3 className="text-xl font-bold text-white mb-2">確認拍攝？</h3>
                         <p className="text-gray-400 text-sm">點擊下方按鈕開始 AI 進行「{mode === 'object' ? '物件辨識' : mode === 'document' ? '文件解讀' : mode === 'diff' ? '複雜分析' : mode === 'story' ? '故事創作' : 'UI 轉代碼'}」。</p>
                       </div>
                       <div className="flex gap-4 w-full">
                         <button 
                           onClick={reset}
                           className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-cyber-700 text-white hover:bg-cyber-600 transition-all font-bold"
                         >
                           <RefreshCw size={18} /> 重拍
                         </button>
                         <button 
                           onClick={handleProceedAnalysis}
                           className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-cyber-cyan text-black hover:bg-cyan-400 transition-all font-bold shadow-lg shadow-cyber-cyan/20"
                         >
                           <PlayCircle size={18} /> 開始分析
                         </button>
                       </div>
                    </div>
                 </div>
               )}

               {!isConfirmingCapture && !isAnalyzing && (
                 <button 
                   onClick={reset}
                   className="absolute top-4 right-4 bg-cyber-800/80 backdrop-blur p-2 rounded-full text-white hover:bg-cyber-700 transition-colors z-10"
                   title="重新拍攝"
                 >
                   <RefreshCw size={20} />
                 </button>
               )}
            </div>
            
            {(isAnalyzing || analysis) && (
              <div className="h-1/2 bg-cyber-900 p-6 overflow-y-auto border-t border-cyber-700 relative flex flex-col animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-2 mb-4">
                  {mode === 'story' || mode === 'code' ? (
                      <Sparkles size={20} className="text-cyber-purple" />
                  ) : (
                      <Zap size={20} className="text-cyber-cyan" />
                  )}
                  <h3 className={`text-xl font-bold ${mode === 'story' || mode === 'code' ? 'text-cyber-purple' : 'text-cyber-cyan'}`}>
                    {mode === 'story' ? 'AI 故事創作' : mode === 'code' ? '生成的代碼' : 'AI 分析結果'}
                  </h3>
                </div>
                
                {isAnalyzing ? (
                  <div className="space-y-4 animate-pulse flex-1">
                    <div className="h-4 bg-cyber-800 rounded w-3/4"></div>
                    <div className="h-4 bg-cyber-800 rounded w-full"></div>
                    <div className="h-4 bg-cyber-800 rounded w-5/6"></div>
                    <div className="flex items-center justify-center gap-3 mt-8">
                       <Loader2 className="w-5 h-5 animate-spin text-cyber-cyan" />
                       <p className="text-sm text-gray-500 font-medium">
                         {mode === 'code' ? '正在轉化為程式碼...' : mode === 'story' ? '正在編織故事細節...' : '正在深度分析影像內容...'}
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {mode === 'code' ? (
                      <div className="relative group/code">
                        <pre className="bg-black/50 p-4 rounded-xl text-xs md:text-sm font-mono text-green-400 overflow-x-auto border border-cyber-700">
                          {analysis}
                        </pre>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(analysis || '');
                            alert('代碼已複製！');
                          }}
                          className="absolute top-2 right-2 p-2 bg-cyber-800 rounded-lg text-cyber-cyan opacity-0 group-hover/code:opacity-100 transition-opacity"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {analysis}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

// Simple internal loader to avoid dependency on Lucide if missing but it is imported
const Loader2 = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <RefreshCw className={className} size={size} />
);

export default VisionEye;