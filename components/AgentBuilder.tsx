
import React, { useState, useEffect } from 'react';
import { Specialist, Skill } from '../types';
import { ApiService } from '../services/apiService';
import { 
  Users2, Sparkles, Box, UtensilsCrossed, QrCode, MapPin, 
  Book, Headphones, ShieldCheck, Save, RefreshCw, Bot,
  Settings2, ToggleRight, ToggleLeft, Plus, Trash2, Cpu
} from 'lucide-react';

interface AgentBuilderProps {
  onCreateClick: () => void;
}

const AgentBuilder: React.FC<AgentBuilderProps> = ({ onCreateClick }) => {
  const [agents, setAgents] = useState<Specialist[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentsData, skillsData] = await Promise.all([
        ApiService.getSpecialists(),
        ApiService.getSkills()
      ]);
      setAgents(agentsData);
      setSkills(skillsData);
      if (agentsData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentsData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const handleDelete = async () => {
    if (!selectedAgentId) return;
    if (confirm("Tem certeza que deseja excluir este especialista?")) {
        await ApiService.deleteSpecialist(selectedAgentId);
        const remaining = agents.filter(a => a.id !== selectedAgentId);
        setAgents(remaining);
        setSelectedAgentId(remaining[0]?.id || null);
    }
  };

  const handleUpdateAgent = (field: keyof Specialist, value: any) => {
    if (!selectedAgentId) return;
    setAgents(prev => prev.map(a => 
      a.id === selectedAgentId ? { ...a, [field]: value } : a
    ));
  };

  const toggleSkill = (skillId: string) => {
    if (!selectedAgent) return;
    const currentSkills = selectedAgent.skills || [];
    const newSkills = currentSkills.includes(skillId)
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId];
    handleUpdateAgent('skills', newSkills);
  };

  const handleSave = async () => {
    if (!selectedAgent) return;
    setIsSaving(true);
    try {
        await ApiService.updateSpecialist(selectedAgent.id, selectedAgent);
    } finally {
        setTimeout(() => setIsSaving(false), 800);
    }
  };

  const getSkillIcon = (iconName: string) => {
    const icons: any = { UtensilsCrossed, Box, QrCode, MapPin, Sparkles, Book, Headphones };
    const Icon = icons[iconName] || Box;
    return <Icon size={18} />;
  };

  if (isLoading) return <div className="flex h-full items-center justify-center"><RefreshCw className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Sidebar: Lista de Agentes */}
      <div className="w-80 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <Users2 size={20} className="text-indigo-600" />
            Squad de IA
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Gerencie os especialistas do seu time.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border ${
                selectedAgentId === agent.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${agent.color}`}>
                <Bot size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{agent.name}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[140px]">{agent.role}</div>
              </div>
              {selectedAgentId === agent.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              )}
            </button>
          ))}
          
          <button 
            onClick={onCreateClick}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Novo Especialista
          </button>
        </div>
      </div>

      {/* Main Builder Area */}
      {selectedAgent ? (
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Header de Configuração */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4 w-full">
              <div className={`p-4 rounded-2xl text-white shadow-xl ${selectedAgent.color}`}>
                 <Bot size={32} />
              </div>
              <div className="flex-1 mr-8">
                <input 
                  value={selectedAgent.name}
                  onChange={(e) => handleUpdateAgent('name', e.target.value)}
                  className="text-3xl font-black text-slate-900 bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-200 transition-all placeholder:text-slate-300 w-full"
                />
                <input 
                  value={selectedAgent.role}
                  onChange={(e) => handleUpdateAgent('role', e.target.value)}
                  className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-transparent outline-none mt-1 w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                 <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                 <button onClick={() => handleUpdateAgent('status', selectedAgent.status === 'active' ? 'inactive' : 'active')}>
                    {selectedAgent.status === 'active' ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-slate-400" />}
                 </button>
               </div>
               <button 
                 onClick={handleDelete}
                 className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                 title="Excluir Agente"
               >
                 <Trash2 size={16} />
               </button>
               <button 
                onClick={handleSave}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl"
               >
                 {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                 {isSaving ? 'Salvando...' : 'Salvar Alterações'}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={12} className="text-indigo-500" /> Prompt de Personalidade (System)
               </label>
               <textarea 
                 value={selectedAgent.system_prompt}
                 onChange={(e) => handleUpdateAgent('system_prompt', e.target.value)}
                 className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
               />
             </div>
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                     <Settings2 size={12} /> Criatividade (Temperatura)
                   </label>
                   <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={selectedAgent.temperature}
                      onChange={(e) => handleUpdateAgent('temperature', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-indigo-600"
                   />
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                     <span>Preciso (0.0)</span>
                     <span className="text-indigo-600 bg-indigo-50 px-2 rounded">{selectedAgent.temperature}</span>
                     <span>Criativo (1.0)</span>
                   </div>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                   <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <ShieldCheck size={16} />
                      <span className="text-xs font-black uppercase">Guardrails Ativos</span>
                   </div>
                   <p className="text-[10px] text-amber-700 font-medium">
                     Regras de segurança globais se aplicam a este agente.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Seletor de Skills/Tools */}
        <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Box size={20} className="text-indigo-600" />
                Skills & Integrações
              </h3>
              <p className="text-xs text-slate-500 font-medium">Selecione quais ferramentas este agente pode acessar.</p>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {selectedAgent.skills?.length || 0} Skills Habilitadas
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
             {skills.map(skill => {
               const isActive = (selectedAgent.skills || []).includes(skill.id);
               return (
                 <button 
                   key={skill.id}
                   onClick={() => toggleSkill(skill.id)}
                   className={`p-5 rounded-3xl border text-left transition-all group relative overflow-hidden ${
                     isActive 
                       ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-200' 
                       : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-200'
                   }`}
                 >
                   <div className="flex justify-between items-start mb-3 relative z-10">
                     <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white shadow-sm text-indigo-600'}`}>
                        {getSkillIcon(skill.icon)}
                     </div>
                     {isActive && <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_white]"></div>}
                   </div>
                   <div className="relative z-10">
                     <h4 className={`font-bold text-sm mb-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>{skill.name}</h4>
                     <p className={`text-[10px] font-medium ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{skill.description}</p>
                   </div>
                   <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      isActive ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-200 text-slate-400'
                   }`}>
                      {skill.type}
                   </div>
                 </button>
               );
             })}
          </div>
        </div>

      </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
           <Cpu size={64} className="mb-4 opacity-20" />
           <p className="font-black uppercase tracking-widest text-sm">Selecione ou Crie um Especialista</p>
           <button 
            onClick={onCreateClick}
            className="mt-4 text-indigo-600 font-bold hover:underline"
           >
             Criar Primeiro Agente
           </button>
        </div>
      )}
    </div>
  );
};

export default AgentBuilder;
