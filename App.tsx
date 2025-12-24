import React, { useState } from 'react';
import FlashAppGen from './components/FlashAppGen';
import SmartChat from './components/SmartChat';
import VisionEye from './components/VisionEye';
import { AppMode } from './types';
import { Smartphone, MessageSquare, Eye, LayoutGrid } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.FLASH_APP);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-cyber-900 text-slate-100 overflow-hidden">
      {/* Sidebar / Mobile Bottom Nav */}
      <nav className="z-50 md:w-20 lg:w-64 bg-cyber-800/50 backdrop-blur-md border-t md:border-t-0 md:border-r border-cyber-700 flex md:flex-col justify-around md:justify-start items-center md:items-stretch py-2 md:py-6 order-2 md:order-1 shrink-0 h-16 md:h-auto w-full fixed bottom-0 md:static">
        
        <div className="hidden md:flex items-center gap-3 px-6 mb-8 text-cyber-cyan">
          <LayoutGrid className="w-8 h-8" />
          <span className="text-xl font-bold tracking-wider lg:block hidden">GAME GEN</span>
        </div>

        <button
          onClick={() => setActiveTab(AppMode.FLASH_APP)}
          className={`flex flex-col md:flex-row items-center gap-3 px-4 py-3 mx-2 md:mx-4 rounded-xl transition-all ${
            activeTab === AppMode.FLASH_APP
              ? 'bg-gradient-to-r from-cyber-cyan/20 to-cyber-cyan/5 text-cyber-cyan'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Smartphone className="w-6 h-6" />
          <span className="text-xs md:text-sm lg:text-base font-medium lg:block md:hidden">閃應用</span>
        </button>

        <button
          onClick={() => setActiveTab(AppMode.CHAT)}
          className={`flex flex-col md:flex-row items-center gap-3 px-4 py-3 mx-2 md:mx-4 rounded-xl transition-all ${
            activeTab === AppMode.CHAT
              ? 'bg-gradient-to-r from-cyber-purple/20 to-cyber-purple/5 text-cyber-purple'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="text-xs md:text-sm lg:text-base font-medium lg:block md:hidden">遊戲對話</span>
        </button>

        <button
          onClick={() => setActiveTab(AppMode.EYE)}
          className={`flex flex-col md:flex-row items-center gap-3 px-4 py-3 mx-2 md:mx-4 rounded-xl transition-all ${
            activeTab === AppMode.EYE
              ? 'bg-gradient-to-r from-pink-500/20 to-pink-500/5 text-pink-500'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Eye className="w-6 h-6" />
          <span className="text-xs md:text-sm lg:text-base font-medium lg:block md:hidden">遊戲之眼</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 order-1 md:order-2 h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyber-800 via-cyber-900 to-black">
        {activeTab === AppMode.FLASH_APP && <FlashAppGen />}
        {activeTab === AppMode.CHAT && <SmartChat />}
        {activeTab === AppMode.EYE && <VisionEye />}
      </main>
    </div>
  );
};

export default App;