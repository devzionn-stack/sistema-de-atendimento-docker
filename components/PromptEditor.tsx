
import React, { useState } from 'react';
import { Save, RefreshCw, Eye, MessageSquareCode, ShieldCheck, History, Sparkles, Wand2, Info } from 'lucide-react';
import { ApiService } from '../services/apiService';

const PromptEditor: React.FC = () => {
  const [prompt, setPrompt] = useState(`Você é o assistente virtual da Pizzaria Bella Napoli. 
Seu objetivo é ser amigável, ágil e prestativo.
- Use emojis moderadamente.
- Sempre ofereça o cardápio se o usuário parecer indeciso.
- Informe que a entrega leva entre 40 a 60 minutos.

{context_knowledge_rag}
{user_conversation_history}`);

  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [selectedLLM, setSelectedLLM] = useState('Gemini 3 Flash (Recomendado)');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Logic for saving to backend
    }, 1000);
  };

  const handleRefineWithGemini = async () => {
    setIsRefining(true);
    try {
        const refined = await ApiService.refinePromptWithAI(prompt);
        setPrompt(refined);
    } catch (error) {
        console.error('Erro ao refinar prompt:', error);
        alert("Erro ao refinar com IA.");
    } finally {
        setIsRefining(false);
    }
  };

  const handleOpenSimulator = () => {
      alert("Simulador de Chat iniciado em modo Overlay (Mock).");
  };

  const handleSelectLLM = (llmName: string) => {
      setSelectedLLM(llmName);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm"><MessageSquareCode size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Orquestrador de Prompt de Sistema</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Produção • v4.2.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Editor LangGraph
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'} flex items-center gap-2`}
              >
                <History size={14} /> Histórico
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                   <Sparkles size={16} />
                </div>
                <span className="text-xs font-bold text-slate-600">Dica: Use {"{variables}"} para injeção dinâmica de dados.</span>
              </div>
              <button 
                onClick={handleRefineWithGemini}
                disabled={isRefining}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-100 disabled:opacity-50"
              >
                {isRefining ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                {isRefining ? 'Refinando...' : 'Refinar com Gemini'}
              </button>
            </div>
            
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 w-full p-8 bg-slate-900 text-emerald-400 font-mono text-sm rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none leading-relaxed shadow-inner border border-slate-800"
              spellCheck={false}
            />
            
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400">
                 <Info size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">O prompt será compilado antes do envio ao LLM Provider.</span>
               </div>
               <div className="flex gap-3">
                 <button 
                    onClick={handleOpenSimulator}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                 >
                   <Eye size={18} /> Simular Chat
                 </button>
                 <button 
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
                 >
                   {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                   {isSaving ? 'Gravando...' : 'Salvar Alterações'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Parâmetros de Engine
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>Temperatura</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">0.7</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>
            
            <div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>Tokens Máximos</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">1024</span>
              </div>
              <input type="range" min="256" max="4096" step="256" defaultValue="1024" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Motor Principal</h4>
              <div className="space-y-2">
                {['Gemini 3 Flash (Recomendado)', 'Llama 3.1 70b (via Groq)', 'GPT-4o (OpenAI)'].map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSelectLLM(opt)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold border transition-all ${selectedLLM === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
           <h4 className="font-bold text-indigo-900 text-sm mb-2">Deploy Automático</h4>
           <p className="text-[10px] text-indigo-600 leading-relaxed mb-4">As alterações no prompt são propagadas via WebSocket para os workers LangGraph em tempo real.</p>
           <div className="w-full h-1 bg-white rounded-full overflow-hidden">
             <div className="w-full h-full bg-indigo-500 animate-pulse"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
