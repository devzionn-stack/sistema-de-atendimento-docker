
import React, { useState, useEffect } from 'react';
import { MOCK_MCP_CONNECTORS } from '../constants';
import { MCPConnector } from '../types';
import { Link2, Plus, Database, FileSpreadsheet, Store, RefreshCw, Trash2, Zap, Globe, ShieldCheck, Settings } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface MCPHubProps {
  onAddClick: () => void;
}

const MCPHub: React.FC<MCPHubProps> = ({ onAddClick }) => {
  const [connectors, setConnectors] = useState<MCPConnector[]>(MOCK_MCP_CONNECTORS);

  useEffect(() => {
    const unsubscribe = ApiService.subscribe((event) => {
      if (event.type === 'MCP_NEW_SERVER') {
        const newServer = event.data;
        setConnectors(prev => {
          if (prev.find(c => c.id === newServer.id)) return prev;
          return [newServer, ...prev];
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('Tem certeza que deseja remover este servidor MCP?')) return;
    try {
      await ApiService.deleteMCPServer(serverId);
      setConnectors(prev => prev.filter(s => s.id !== serverId));
    } catch (error) {
      console.error('Erro ao deletar servidor:', error);
      alert('Falha ao remover servidor.');
    }
  };

  const handleEditServer = (serverId: string) => {
      alert(`Editando servidor ${serverId} (Mock Form)`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'postgres': return <Database size={24} />;
      case 'google_sheets': return <FileSpreadsheet size={24} />;
      case 'shopify': return <Store size={24} />;
      default: return <Globe size={24} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl border border-white/20">
                 <Link2 size={24} className="text-indigo-300" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Model Context Protocol</span>
             </div>
             <h2 className="text-4xl font-black mb-4 tracking-tight">Cérebro Distribuído (MCP)</h2>
             <p className="text-indigo-200 text-sm leading-relaxed font-medium">
               Conecte a inteligência da Bella Napoli a sistemas legados, planilhas ou ERPs. 
               Cada servidor MCP adiciona novas "ferramentas" que o Gemini pode usar para executar ações complexas.
             </p>
          </div>
          <button 
            onClick={onAddClick}
            className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Adicionar Servidor MCP
          </button>
        </div>
        <Zap size={300} className="absolute -right-20 -bottom-20 opacity-5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-400 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${c.status === 'connected' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-500'}`}>
                {getTypeIcon(c.type)}
              </div>
              <div className="flex gap-2 relative z-10">
                <button 
                    onClick={() => handleEditServer(c.id)}
                    className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                    <Settings size={16} />
                </button>
                <button 
                    onClick={() => handleDeleteServer(c.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="font-black text-slate-900 text-lg mb-1">{c.name}</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type: {c.type}</span>
              {c.url && <span className="text-[10px] text-indigo-400 font-mono truncate max-w-[150px]">{c.url}</span>}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${c.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${c.status === 'connected' ? 'text-emerald-600' : 'text-red-500'}`}>
                   {c.status}
                 </span>
              </div>
              <span className="text-[10px] font-bold text-slate-300">{c.lastSync}</span>
            </div>

            <ShieldCheck size={120} className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform" />
          </div>
        ))}
        
        <button 
          onClick={onAddClick}
          className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-200 hover:bg-indigo-50/20 hover:text-indigo-400 transition-all group"
        >
          <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform" />
          <span className="font-black uppercase tracking-widest text-xs">Novo Conector</span>
        </button>
      </div>
    </div>
  );
};

export default MCPHub;
