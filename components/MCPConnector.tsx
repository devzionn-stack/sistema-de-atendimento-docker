
import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, Plus, Server, CheckCircle, XCircle, Activity, 
  Terminal, Play, RefreshCw, Zap, Settings, Shield, Link2, 
  Database, Store, FileSpreadsheet, Globe, Wrench, FileText
} from 'lucide-react';
import { ApiService } from '../services/apiService';
import { MCPServerData, MCPLog } from '../types';

interface MCPConnectorProps {
  onAddClick: () => void;
}

const MCPConnector: React.FC<MCPConnectorProps> = ({ onAddClick }) => {
  const [servers, setServers] = useState<MCPServerData[]>([]);
  const [logs, setLogs] = useState<MCPLog[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchServers();

    // Simulating Real-time Logs via WebSocket
    const unsubscribe = ApiService.subscribe((event) => {
      if (event.type === 'MCP_NEW_SERVER') {
        setServers(prev => {
            const exists = prev.find(s => s.id === event.data.id);
            if (exists) return prev;
            return [event.data, ...prev];
        });
        addLog('System', `New MCP Server detected: ${event.data.name}`, 'info');
      }
      if (event.type === 'MCP_TOOL_CALL') {
        addLog(event.data.server, `Calling tool: ${event.data.tool}`, 'info');
      }
    });

    addLog('System', 'MCP Gateway initialized. Listening for tool calls...', 'info');

    return unsubscribe;
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchServers = async () => {
    setIsLoading(true);
    try {
        const data = await ApiService.getMCPServers();
        setServers(data);
    } catch (e) {
        addLog('System', 'Failed to fetch initial server list', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const addLog = (server: string, action: string, status: 'info'|'success'|'error') => {
    const newLog: MCPLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      server,
      action,
      status
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    addLog('System', `Pinging server ID: ${id}...`, 'info');
    setTimeout(() => {
      setServers(prev => prev.map(s => 
        s.id === id ? { ...s, status: 'online', latency: Math.floor(Math.random() * 50) + 5, lastPing: 'Just now' } : s
      ));
      setTestingId(null);
      addLog('System', `Server ID: ${id} responded successfully.`, 'success');
    }, 1500);
  };

  const handleSyncNow = async (connectorId: string) => {
    setIsSyncing(connectorId);
    try {
        await ApiService.syncMCPConnector(connectorId);
        addLog('System', `Sync Triggered for ${connectorId}`, 'info');
    } catch (e) {
        addLog('System', `Sync Failed for ${connectorId}`, 'error');
    } finally {
        setIsSyncing(null);
    }
  };

  const handleViewLogs = async (connectorId: string) => {
      alert(`Visualizando logs completos para conector ${connectorId}. (Ver terminal abaixo)`);
      // In a real app, this might fetch historical logs and display in a modal
      const fetchedLogs = await ApiService.getMCPLogs(connectorId);
      fetchedLogs.forEach((l: any) => addLog('History', l.message, l.level));
  };

  const getServerIcon = (name: string) => {
    if (name.toLowerCase().includes('postgre') || name.toLowerCase().includes('sql')) return <Database size={20} />;
    if (name.toLowerCase().includes('drive') || name.toLowerCase().includes('google')) return <Globe size={20} />;
    if (name.toLowerCase().includes('shopify') || name.toLowerCase().includes('store')) return <Store size={20} />;
    return <Server size={20} />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Glassmorphism */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-indigo-900 to-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute -right-20 -top-20 opacity-10">
          <Network size={300} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md border border-indigo-400/30">
                <Link2 size={24} className="text-indigo-300" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300">Protocol v1.0</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Model Context Protocol</h1>
            <p className="text-indigo-200/70 font-medium max-w-xl text-sm leading-relaxed">
              Gerencie a camada de ferramentas do LangGraph. Conecte APIs externas para dar "superpoderes" ao agente.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">Status Global</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-bold text-sm">Operacional</span>
              </div>
            </div>
            <button 
              onClick={onAddClick}
              className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus size={16} /> Adicionar Servidor
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Servidores */}
      {isLoading ? (
        <div className="flex justify-center p-20">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map(server => (
          <div key={server.id} className="group relative bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`p-4 rounded-2xl ${
                server.status === 'online' || server.status === 'connected' ? 'bg-indigo-50 text-indigo-600' : 
                server.status === 'error' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
              }`}>
                {getServerIcon(server.name)}
              </div>
              <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                server.status === 'online' || server.status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                server.status === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {(server.status === 'online' || server.status === 'connected') && <CheckCircle size={12} />}
                {server.status === 'error' && <XCircle size={12} />}
                {server.status === 'syncing' && <RefreshCw size={12} className="animate-spin" />}
                {server.status}
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-1 relative z-10">{server.name}</h3>
            <p className="text-xs font-mono text-slate-400 mb-6 truncate relative z-10">{server.url}</p>

            <div className="space-y-3 mb-8 relative z-10">
              <div className="flex justify-between items-center text-xs">
                 <span className="text-slate-400 font-bold">Latência</span>
                 <span className={`font-mono font-bold ${server.latency > 200 ? 'text-amber-500' : 'text-emerald-500'}`}>{server.latency}ms</span>
              </div>
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${server.latency > 200 ? 'bg-amber-400' : 'bg-emerald-400'}`} 
                  style={{ width: `${Math.min(100, (1000/server.latency)*10)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-6 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Wrench size={12} /> Ferramentas Disponíveis
              </h4>
              <div className="flex flex-wrap gap-2">
                {server.tools.map((tool, idx) => (
                  <span key={idx} className={`text-[10px] px-2 py-1 rounded-lg border ${tool.isActive ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-100 border-transparent text-slate-400 line-through'}`}>
                    {tool.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
              <button 
                onClick={() => handleTestConnection(server.id)}
                disabled={testingId === server.id}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70"
              >
                {testingId === server.id ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                {testingId === server.id ? 'Pinging...' : 'Testar Conexão'}
              </button>
              <button 
                onClick={() => handleSyncNow(server.id)}
                disabled={isSyncing === server.id}
                className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Sincronizar"
              >
                <RefreshCw size={18} className={isSyncing === server.id ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={() => handleViewLogs(server.id)}
                className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Logs"
              >
                <FileText size={18} />
              </button>
            </div>

            {/* Decorative Background Icon */}
            <Server size={180} className="absolute -right-8 -bottom-8 text-slate-50 group-hover:text-indigo-50/50 transition-colors duration-500 rotate-12 pointer-events-none" />
          </div>
        ))}
      </div>
      )}

      {/* Terminal de Logs Real-time */}
      <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[400px]">
        <div className="bg-slate-950 p-4 px-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <Terminal size={16} className="text-slate-400" />
            <span className="text-xs font-mono text-slate-400 font-bold">mcp-gateway-logs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-emerald-500 uppercase">Live Stream</span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
              <Activity size={32} />
              <p>Aguardando eventos do barramento MCP...</p>
            </div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors group">
              <span className="text-slate-500 min-w-[80px] select-none">{log.timestamp}</span>
              <span className={`font-bold min-w-[150px] ${
                log.server === 'System' ? 'text-indigo-400' : 'text-emerald-400'
              }`}>
                [{log.server}]
              </span>
              <span className={`flex-1 ${
                log.status === 'error' ? 'text-red-400' : 
                log.status === 'success' ? 'text-emerald-300' : 'text-slate-300'
              }`}>
                {log.action}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-500 border border-slate-700 px-2 rounded">
                ID: {log.id}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
    </div>
  );
};

export default MCPConnector;
