
import React from 'react';
import { NAV_GROUPS, NAV_ITEMS_MAP } from '../constants';
import { AppTab } from '../types';
import { BrainCircuit, Settings, ChevronRight } from 'lucide-react';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar - Enhanced for better UX/Grouping */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 transition-all duration-300">
        <div className="p-8 flex items-center gap-4 text-white">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
            <BrainCircuit size={28} />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight block leading-none">LangGraph</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Manager Pro</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-8 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-2">
              <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {group.label}
              </h4>
              {group.items.map((itemId) => {
                const item = NAV_ITEMS_MAP[itemId];
                const isActive = activeTab === itemId;
                return (
                  <button
                    key={itemId}
                    onClick={() => setActiveTab(itemId as AppTab)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1' 
                        : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {item.icon}
                      </div>
                      <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        {item.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight size={14} className="opacity-50" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-6">
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status do Cluster</div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="text-xs font-bold text-slate-200">
              LangGraph Worker: <span className="text-emerald-400">Online</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">v2.4.0 • Bra-South-1</div>
          </div>
        </div>
      </aside>

      {/* Main Content - Improved Fluidity */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b bg-white/80 backdrop-blur-xl flex items-center justify-between px-10 sticky top-0 z-10 transition-all">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 capitalize animate-in slide-in-from-left-2 duration-300">
              {NAV_ITEMS_MAP[activeTab]?.label}
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Painel de Controle</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-3 hover:space-x-0 transition-all duration-300">
              <img src="https://picsum.photos/32/32?1" className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="avatar" />
              <img src="https://picsum.photos/32/32?2" className="w-10 h-10 rounded-full border-4 border-white shadow-sm" alt="avatar" />
              <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                +4
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <button 
              onClick={() => setActiveTab(AppTab.LLM_CONFIG)}
              className="bg-slate-50 p-3 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group relative"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2 border-2 border-white"></div>
              <Settings size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
          {children}
        </div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2); 
        }
      `}</style>
    </div>
  );
};

export default Layout;
