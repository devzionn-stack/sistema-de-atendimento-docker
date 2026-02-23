
import React, { useState } from 'react';
import { ApiService } from '../services/apiService';
import { Sparkles, ArrowLeft, Database, Code, RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';

interface DatabaseGeneratorProps {
  onCancel: () => void;
}

const DatabaseGenerator: React.FC<DatabaseGeneratorProps> = ({ onCancel }) => {
  const [description, setDescription] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsGenerating(true);
    setStatus('idle');
    try {
      const response = await ApiService.generateTableWithAI(description);
      setGeneratedSchema(response.schema || "-- Erro: Schema vazio retornado.");
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    alert("Migração aplicada com sucesso! (Simulação)");
    onCancel();
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onCancel}
              className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Sparkles className="text-indigo-600" />
                DB Architect AI
              </h2>
              <p className="text-xs text-slate-500 font-medium">Descreva sua necessidade de dados e a IA criará a estrutura SQL otimizada.</p>
            </div>
          </div>
        </div>

        <div className="p-12 space-y-10">
          
          {/* Input Area */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} className="text-indigo-500" /> Descrição da Tabela
            </label>
            <div className="relative">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Crie uma tabela para armazenar avaliações de clientes, com nota de 1 a 5, comentário, data e ID do pedido..."
                className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none font-medium text-slate-700"
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !description}
                className="absolute bottom-4 right-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {isGenerating ? 'Gerando...' : 'Gerar Schema'}
              </button>
            </div>
          </div>

          {/* Output Area */}
          {(generatedSchema || isGenerating) && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Code size={14} className="text-emerald-500" /> SQL Gerado
                </label>
                {status === 'success' && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle size={12} /> Válido para PostgreSQL 15+
                  </span>
                )}
                {status === 'error' && (
                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1">
                    <AlertTriangle size={12} /> Falha na geração
                  </span>
                )}
              </div>
              
              <div className="bg-slate-900 rounded-[2rem] p-8 relative overflow-hidden group">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500 space-y-4">
                    <RefreshCw className="animate-spin text-indigo-500" size={32} />
                    <p className="text-xs font-mono">Analisando requisitos e tipos de dados...</p>
                  </div>
                ) : (
                  <>
                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {generatedSchema}
                    </pre>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedSchema)}
                        className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20"
                        title="Copiar"
                      >
                        <Code size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {!isGenerating && status === 'success' && (
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={onCancel}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={handleApply}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Play size={16} /> Executar Migração
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DatabaseGenerator;
