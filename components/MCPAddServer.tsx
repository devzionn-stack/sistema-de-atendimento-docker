
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Globe, Database, ShieldCheck, Zap, RefreshCw, CheckCircle2, AlertCircle, Link2, Loader2 } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface MCPAddServerProps {
  onBack: () => void;
}

const MCPAddServer: React.FC<MCPAddServerProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({ name: '', url: '', type: 'custom_mcp' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'queued' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Listener para resultados assíncronos via WebSocket (Kafka Consumer -> API -> WS -> Client)
  useEffect(() => {
    if (!isConnecting) return;

    const unsubscribe = ApiService.subscribe((event) => {
      // Escuta eventos de resultado de conexão específicos para este servidor
      if (event.type === 'MCP_CONNECTION_RESULT' && event.data.name === formData.name) {
        if (event.data.status === 'success') {
          setStatus('success');
          setTimeout(() => {
            onBack();
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage(event.data.error || 'Falha desconhecida no handshake MCP.');
        }
        setIsConnecting(false);
      }
    });

    return unsubscribe;
  }, [isConnecting, formData.name, onBack]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setStatus('queued');
    setErrorMessage('');

    try {
      // O backend agora apenas enfileira no Kafka e retorna "processing"
      const result = await ApiService.connectMCP(formData.name, formData.url);
      
      if (result.status === 'processing') {
        // Agora aguardamos o WebSocket effect acima
        console.log("MCP Request Queued via Kafka...");
      } else {
        // Fallback para comportamento síncrono legado
        if (result.status === 'connected') {
          setStatus('success');
          setIsConnecting(false);
          setTimeout(onBack, 1500);
        } else {
           throw new Error("Resposta inesperada da API");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage("Erro ao comunicar com API Gateway.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Adicionar Servidor MCP</h2>
              <p className="text-xs text-slate-500 font-medium">Configure um novo endpoint Model Context Protocol (Async Mode).</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Protocol v1.0
            </span>
          </div>
        </div>

        <div className="p-12">
          <form onSubmit={handleConnect} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-indigo-500" /> Nome da Conexão
              </label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: ERP_Estoque_Central" 
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                disabled={isConnecting}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={14} className="text-indigo-500" /> Tipo de Recurso
              </label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                disabled={isConnecting}
              >
                <option value="custom_mcp">Custom MCP Server (JSON-RPC)</option>
                <option value="postgres">PostgreSQL Connector</option>
                <option value="google_sheets">Google Sheets Adapter</option>
                <option value="shopify">Shopify Storefront</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Link2 size={14} className="text-indigo-500" /> Endpoint do Servidor (URL)
              </label>
              <div className="relative">
                <input 
                  required
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  placeholder="https://mcp-server.suaempresa.com/rpc" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  disabled={isConnecting}
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Zap size={18} className="text-indigo-300" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 pt-8">
              {status === 'queued' && (
                <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
                  <Loader2 size={24} className="text-blue-500 animate-spin" />
                  <div>
                    <p className="text-blue-700 font-bold text-sm">Solicitação Enfileirada (Kafka)</p>
                    <p className="text-xs text-blue-500">Aguardando processamento do worker...</p>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <p className="text-emerald-700 font-bold text-sm">Conexão estabelecida! O cluster de IA Bella Napoli agora possui novas ferramentas.</p>
                </div>
              )}
              {status === 'error' && (
                <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
                  <AlertCircle size={24} className="text-red-500" />
                  <div>
                     <p className="text-red-700 font-bold text-sm">Erro ao conectar.</p>
                     <p className="text-xs text-red-500">{errorMessage || 'Verifique se o servidor MCP está online e suporta introspecção.'}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={onBack}
                  disabled={isConnecting}
                  className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Voltar ao Hub
                </button>
                <button 
                  type="submit"
                  disabled={isConnecting}
                  className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isConnecting ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                  {isConnecting ? 'Sincronizando...' : 'Conectar e Sincronizar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MCPAddServer;
