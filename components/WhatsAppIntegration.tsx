
import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, RefreshCw, QrCode, Activity, ShieldCheck, Zap, 
  Terminal, Server, Database, Cpu, ScanLine, CheckCircle2, 
  WifiOff, Loader2, Key, Copy, Check, Plus, Trash2, ChevronRight, LayoutGrid,
  Sparkles
} from 'lucide-react';
import { ApiService } from '../services/apiService';
import { WppSession, SessionStatus } from '../types';

interface ConnectionLog {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const WhatsAppIntegration: React.FC = () => {
  const [sessions, setSessions] = useState<WppSession[]>([
    {
      id: 'BellaNapoli_Main',
      name: 'BellaNapoli_Main',
      status: 'disconnected',
      qrCode: null,
      apiToken: null,
      latency: 0,
      logs: []
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('BellaNapoli_Main');
  const [newSessionName, setNewSessionName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessingGlobal, setIsProcessingGlobal] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const addLogToSession = (sessionId: string, message: string, type: ConnectionLog['type'] = 'info') => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          logs: [
            ...s.logs,
            { 
              id: Math.random().toString(36).substr(2, 9), 
              time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
              message, 
              type 
            }
          ].slice(-50)
        };
      }
      return s;
    }));
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession.logs]);

  // WebSocket Event Listeners - Central de Inteligência de Conectividade Multi-Sessão
  useEffect(() => {
    const unsubscribe = ApiService.subscribe((event) => {
      const sessionId = event.session_id;
      if (!sessionId) return;

      // 1. Recebimento de Token
      if (event.type === 'WPP_TOKEN_GENERATED') {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, apiToken: event.data.token } : s));
        addLogToSession(sessionId, `Protocolo de autenticação finalizado. Token gerado.`, 'success');
      }

      // 2. Transmissão de QR Code
      if (event.type === 'WPP_QR_CODE') {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, qrCode: event.data.qr, status: 'qr_ready' as SessionStatus } : s));
        addLogToSession(sessionId, event.data.message || "Canal de autenticação visual (QR) aberto.", 'warning');
      }

      // 3. Mudanças de Estado
      if (event.type === 'WPP_STATUS_CHANGE') {
        const newStatus = event.data.status as SessionStatus;
        setSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            let latency = s.latency;
            if (newStatus === 'connected') {
              latency = Math.floor(Math.random() * 40) + 40;
            }
            return { 
              ...s, 
              status: newStatus, 
              latency,
              qrCode: newStatus === 'connected' ? null : s.qrCode 
            };
          }
          return s;
        }));
        
        const logType = 
          newStatus === 'connected' ? 'success' : 
          newStatus === 'error' ? 'error' : 
          newStatus === 'scanning' ? 'warning' : 'info';
          
        addLogToSession(sessionId, event.data.message || `Alteração de estado detectada: ${newStatus}`, logType);
      }
    });

    return unsubscribe;
  }, []);

  const handleStartGateway = async (sessionId: string) => {
    setIsProcessingGlobal(true);
    addLogToSession(sessionId, `Iniciando orquestração da sessão: ${sessionId}`, 'info');
    
    try {
      await ApiService.createWhatsAppInstance(sessionId);
      const res = await ApiService.connectWhatsAppInstance(sessionId);
      if (res.qrcode) {
          // If QR is returned immediately
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, qrCode: res.qrcode.base64, status: 'qr_ready' as SessionStatus } : s));
      }
    } catch (err) {
      addLogToSession(sessionId, "Erro na comunicação com o gateway de inicialização.", "error");
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'error' as SessionStatus } : s));
    } finally {
      setIsProcessingGlobal(false);
    }
  };

  const handleCopyToken = () => {
      if(activeSession.apiToken) {
          navigator.clipboard.writeText(activeSession.apiToken);
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2000);
      }
  };

  const handleRegenerateToken = async () => {
      if(!confirm("Regenerar token invalidará o acesso atual. Continuar?")) return;
      try {
          await ApiService.regenerateWppToken(activeSession.id);
          addLogToSession(activeSession.id, "Solicitação de regeneração de token enviada.", 'warning');
      } catch (e) {
          alert("Erro ao regenerar token.");
      }
  };

  const handleAddSession = () => {
    if (!newSessionName.trim()) return;
    const exists = sessions.find(s => s.id === newSessionName);
    if (exists) {
      alert("Já existe uma sessão com este nome.");
      return;
    }
    const newSession: WppSession = {
      id: newSessionName,
      name: newSessionName,
      status: 'disconnected',
      qrCode: null,
      apiToken: null,
      latency: 0,
      logs: []
    };
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSessionName);
    setNewSessionName('');
    setShowAddModal(false);
  };

  const handleRemoveSession = async (id: string) => {
    if (sessions.length === 1) {
      alert("É necessário manter ao menos uma configuração de sessão.");
      return;
    }
    if (confirm(`Remover sessão '${id}'? Isso desconectará o agente desta linha.`)) {
      try {
          await ApiService.logoutWhatsAppInstance(id);
      } catch (e) {
          console.error("Error logging out", e);
      }
      const remaining = sessions.filter(s => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  const getStatusConfig = (status: SessionStatus) => {
    switch (status) {
      case 'connected': return { label: 'Operacional', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'scanning': return { label: 'Lendo QR...', color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
      case 'qr_ready': return { label: 'Aguardando Link', color: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50' };
      case 'starting': return { label: 'Injetando Driver', color: 'bg-slate-500', text: 'text-slate-600', bg: 'bg-slate-50' };
      case 'error': return { label: 'Falha Crítica', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
      default: return { label: 'Offline', color: 'bg-slate-300', text: 'text-slate-400', bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header Multi-Sessão */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
            <LayoutGrid size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hub de Conectividade</h2>
            <p className="text-sm text-slate-500 font-medium">Gerencie múltiplas instâncias do agente Bella Napoli.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <Plus size={16} /> Nova Sessão WPP
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar de Sessões */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Instâncias Ativas ({sessions.length})</h3>
          <div className="space-y-3">
            {sessions.map(s => {
              const conf = getStatusConfig(s.status);
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  className={`w-full p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group ${
                    activeSessionId === s.id ? 'bg-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${activeSessionId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate max-w-[120px]">{s.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${conf.color}`}></div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${conf.text}`}>{conf.label}</span>
                      </div>
                    </div>
                  </div>
                  {activeSessionId === s.id && (
                    <ChevronRight size={18} className="text-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel de Controle da Sessão Ativa */}
        <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <div className={`p-6 rounded-[2.2rem] transition-all shadow-2xl ${
                    activeSession.status === 'connected' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-200'
                  }`}>
                    {activeSession.status === 'connected' ? <Activity size={32} className="animate-pulse" /> : <Smartphone size={32} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activeSession.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {activeSession.id}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleRegenerateToken}
                        className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Regenerar Token"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button 
                        onClick={() => handleRemoveSession(activeSession.id)}
                        className="p-4 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Detalhes Técnicos */}
                <div className="space-y-8">
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Key size={14} className="text-indigo-500" /> API Token</span>
                         {activeSession.apiToken && (
                             <button onClick={handleCopyToken} className="text-indigo-600 flex items-center gap-1">
                                 {hasCopied ? <Check size={14} /> : <Copy size={14}/>}
                             </button>
                         )}
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 break-all font-mono text-[11px] font-bold text-slate-600 min-h-[50px] flex items-center">
                        {activeSession.apiToken || 'Aguardando autenticação...'}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                           <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Status</span>
                           <span className={`text-[10px] font-black uppercase ${getStatusConfig(activeSession.status).text}`}>
                             {activeSession.status}
                           </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                           <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Latência</span>
                           <span className="text-[10px] font-black text-slate-800">
                             {activeSession.status === 'connected' ? `${activeSession.latency}ms` : 'N/A'}
                           </span>
                        </div>
                      </div>
                   </div>

                   <button 
                    onClick={() => handleStartGateway(activeSession.id)} 
                    disabled={activeSession.status !== 'disconnected' && activeSession.status !== 'error' || isProcessingGlobal}
                    className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {activeSession.status === 'disconnected' || activeSession.status === 'error' ? <><QrCode size={18} /> Iniciar Conexão</> : <><Loader2 size={18} className="animate-spin" /> Processando...</>}
                  </button>
                </div>

                {/* QR Code */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-8 flex flex-col items-center justify-center min-h-[350px] relative">
                   {activeSession.qrCode ? (
                     <div className="text-center animate-in zoom-in-95 duration-500">
                       <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-white inline-block relative">
                          <img src={activeSession.qrCode} className="w-48 h-48" alt="QR" />
                          {activeSession.status === 'scanning' && (
                             <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                <ScanLine size={48} className="text-indigo-600 animate-pulse" />
                             </div>
                          )}
                       </div>
                       <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Escaneie para vincular</p>
                     </div>
                   ) : activeSession.status === 'connected' ? (
                     <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                           <CheckCircle2 size={40} />
                        </div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Driver Conectado</p>
                     </div>
                   ) : (
                     <div className="text-slate-200 text-center">
                        <QrCode size={80} className="mx-auto mb-4 opacity-10" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Aguardando Start</span>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Console de Logs da Sessão Ativa */}
            <div className="bg-slate-950 rounded-[3rem] p-10 h-[350px] flex flex-col border border-white/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <Terminal size={20} className="text-indigo-400" />
                  <h4 className="text-white font-bold">Stream: {activeSession.name}</h4>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Live</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] custom-scrollbar px-2 relative z-10">
                {activeSession.logs.map(log => (
                   <div key={log.id} className="flex gap-3">
                      <span className="text-slate-600">[{log.time}]</span>
                      <span className={`${log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-amber-300' : 'text-indigo-300'}`}>
                        {log.message}
                      </span>
                   </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

          {/* AI Advisor Contextual */}
          <div className="space-y-8">
             <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <Zap size={150} className="absolute -right-10 -top-10 opacity-10 rotate-12" />
                <div className="relative z-10">
                   <Sparkles className="mb-6 text-indigo-200" size={32} />
                   <h3 className="text-lg font-black mb-4">Otimização Multi-Canal</h3>
                   <p className="text-sm text-indigo-100 leading-relaxed mb-8">
                     Gerenciar múltiplas sessões permite distribuir a carga de atendimento. Nossa IA sugere rotacionar sessões com latência superior a 200ms.
                   </p>
                   <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Ver Latência Global</button>
                </div>
             </div>

             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Resumo da Rede</h4>
                <div className="space-y-5">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Sessões Operacionais</span>
                      <span className="font-black text-emerald-600">{sessions.filter(s => s.status === 'connected').length}/{sessions.length}</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(sessions.filter(s => s.status === 'connected').length / sessions.length) * 100}%` }}></div>
                   </div>
                   <div className="pt-4 flex items-center gap-3 text-slate-400 italic text-[11px]">
                      <Server size={14} />
                      Cluster: BRA-SA-EAST-1
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Modal de Adição */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-500">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Adicionar Instância</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Defina um nome único para o novo worker de WhatsApp.</p>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome da Sessão</label>
                    <input 
                      autoFocus
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="Ex: BellaNapoli_Expansao"
                      className="w-full bg-slate-50 border border-slate-100 px-8 py-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700"
                    />
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddSession}
                      className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      Criar Agora
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default WhatsAppIntegration;
