
import React, { useState } from 'react';
import { ApiService } from '../services/apiService';
import { Specialist } from '../types';
import { Bot, User, Sparkles, Settings2, Save, X, RefreshCw, Palette } from 'lucide-react';

interface AgentCreatorProps {
  onCancel: () => void;
}

const AgentCreator: React.FC<AgentCreatorProps> = ({ onCancel }) => {
  const [formData, setFormData] = useState<Partial<Specialist>>({
    name: '',
    role: '',
    description: '',
    system_prompt: 'Você é um assistente útil e prestativo da Bella Napoli.',
    temperature: 0.7,
    status: 'active',
    color: 'bg-indigo-600',
    skills: []
  });
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    'bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-rose-600', 
    'bg-amber-600', 'bg-purple-600', 'bg-slate-800', 'bg-teal-600'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await ApiService.createSpecialist(formData);
      onCancel();
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      alert('Falha ao criar especialista.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <form onSubmit={handleSubmit} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-3xl text-white shadow-lg transition-colors ${formData.color}`}>
              <Bot size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novo Especialista</h2>
              <p className="text-xs text-slate-500 font-medium">Defina a personalidade e as regras de um novo membro do squad de IA.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-12 space-y-10">
          
          {/* Identidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-indigo-500" /> Identidade
              </label>
              <input 
                required
                placeholder="Nome (Ex: Sofia)"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
              <input 
                required
                placeholder="Função (Ex: Especialista em Vinhos)"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={14} className="text-pink-500" /> Cor do Avatar
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({...formData, color: c})}
                    className={`h-12 rounded-xl transition-all ${c} ${formData.color === c ? 'ring-4 ring-offset-2 ring-indigo-200 scale-105' : 'opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prompt de Sistema */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" /> System Prompt (Personalidade & Regras)
            </label>
            <textarea 
              required
              value={formData.system_prompt}
              onChange={e => setFormData({...formData, system_prompt: e.target.value})}
              className="w-full h-40 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none leading-relaxed"
              placeholder="Descreva como o agente deve se comportar, o que ele sabe fazer e suas limitações..."
            />
          </div>

          {/* Configurações Técnicas */}
          <div className="space-y-6">
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Settings2 size={12} /> Criatividade (Temperatura)
                </label>
                <input 
                   type="range" min="0" max="1" step="0.1" 
                   value={formData.temperature}
                   onChange={(e) => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                   className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3">
                  <span>Robótico (0.0)</span>
                  <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{formData.temperature}</span>
                  <span>Imaginativo (1.0)</span>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {isSaving ? 'Criar Especialista' : 'Finalizar Criação'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default AgentCreator;
