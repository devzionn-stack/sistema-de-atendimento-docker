
import React, { useState } from 'react';
import { MOCK_LLM_PROVIDERS } from '../constants';
import { LLMConfig } from '../types';
import { Cpu, ShieldCheck, Key, Globe, Plus, Save, RefreshCw, AlertCircle, Mic, X } from 'lucide-react';
import { ApiService } from '../services/apiService';

const LLMManager: React.FC = () => {
  const [providers, setProviders] = useState<LLMConfig[]>(MOCK_LLM_PROVIDERS);
  const [isSaving, setIsSaving] = useState(false);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<LLMConfig>>({});

  const toggleActive = (provider: string) => {
    setProviders(prev => prev.map(p => ({
      ...p,
      isActive: p.provider === provider
    })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const activeProvider = providers.find(p => p.isActive);
    if (activeProvider) {
      await ApiService.saveLLMConfig(activeProvider);
    }
    setIsSaving(false);
  };

  const handleToggleTranscribe = async (value: boolean) => {
    setAutoTranscribe(value);
    const activeProvider = providers.find(p => p.isActive);
    if (activeProvider) {
        // Assuming auto_transcribe is part of config or handled separately
        // For now, just saving the config again, maybe backend handles it
        await ApiService.saveLLMConfig({ ...activeProvider });
    }
  };

  const handleAddLLM = async () => {
      if(!newProvider.provider || !newProvider.model || !newProvider.apiKey) return;
      const config: LLMConfig = {
          provider: newProvider.provider as any,
          model: newProvider.model,
          apiKey: newProvider.apiKey,
          isActive: false
      };
      setProviders([...providers, config]);
      setShowAddForm(false);
      setNewProvider({});
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de LLM & Agente</h2>
          <p className="text-slate-500 text-sm">Configure os motores de inteligência que alimentam o LangGraph.</p>
        </div>
        <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Novo Provider
        </button>
      </div>

      {showAddForm && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-indigo-100 mb-6 animate-in slide-in-from-top-2">
              <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-slate-700">Novo Provedor</h3>
                  <button onClick={() => setShowAddForm(false)}><X size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input placeholder="Provider (ex: Anthropic)" className="p-3 rounded-xl border" onChange={e => setNewProvider({...newProvider, provider: e.target.value as any})} />
                  <input placeholder="Model ID" className="p-3 rounded-xl border" onChange={e => setNewProvider({...newProvider, model: e.target.value})} />
                  <input placeholder="API Key" type="password" className="p-3 rounded-xl border" onChange={e => setNewProvider({...newProvider, apiKey: e.target.value})} />
              </div>
              <button onClick={handleAddLLM} className="w-full bg-emerald-500 text-white p-3 rounded-xl font-bold">Salvar Configuração</button>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {providers.map(p => (
            <div 
              key={p.provider} 
              className={`bg-white p-6 rounded-3xl border transition-all ${
                p.isActive ? 'border-indigo-600 shadow-xl shadow-indigo-50/50' : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${p.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 capitalize">{p.provider}</h3>
                    <p className="text-xs text-slate-400 font-mono">{p.model}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleActive(p.provider)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    p.isActive 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {p.isActive ? 'Ativo' : 'Selecionar'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key size={12} /> API Token
                  </label>
                  <input 
                    type="password" 
                    value={p.apiKey} 
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none" 
                    readOnly 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheck size={24} className="text-emerald-400" />
                Segurança & Latência
              </h3>
              <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                Todos os tokens são criptografados em repouso. O motor ativo define o tempo médio de resposta para o cliente final.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="block text-xs font-bold text-indigo-300 uppercase mb-1">Custo Est.</span>
                  <span className="text-lg font-bold">~$0.02 / 1k</span>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="block text-xs font-bold text-indigo-300 uppercase mb-1">Latência</span>
                  <span className="text-lg font-bold">~0.8s</span>
                </div>
              </div>
            </div>
            <Globe size={180} className="absolute -right-16 -bottom-16 text-white/5 rotate-12" />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertCircle size={18} className="text-amber-500" />
               Configurações Globais
             </h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                   <div className="flex flex-col">
                      <span className="text-sm text-slate-600 font-bold">Cache de Contexto</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Histórico Recente</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                   <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Mic size={14} className="text-indigo-600" />
                        <span className="text-sm text-slate-600 font-bold">Transcrição Multimodal</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Gemini-3-Flash Engine</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoTranscribe}
                      onChange={() => handleToggleTranscribe(!autoTranscribe)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSaving ? 'Aplicando...' : 'Salvar Alterações'}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMManager;
