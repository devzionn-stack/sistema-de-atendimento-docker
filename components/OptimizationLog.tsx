
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/apiService';
import { AgentLesson } from '../types';
import { Brain, Sparkles, MessageSquare, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

const OptimizationLog: React.FC = () => {
  const [lessons, setLessons] = useState<AgentLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const data = await ApiService.getOptimizationLessons();
      setLessons(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                     <Brain size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Reinforcement Learning</span>
               </div>
               <h2 className="text-3xl font-black mb-2 tracking-tight">Evolução Cognitiva</h2>
               <p className="text-emerald-100 text-sm font-medium leading-relaxed max-w-xl">
                  Registro de correções humanas que foram convertidas em regras permanentes para o comportamento do Agente.
               </p>
            </div>
            <button 
              onClick={loadLessons} 
              className="bg-white text-emerald-800 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Atualizar
            </button>
         </div>
         <Sparkles size={250} className="absolute -right-10 -bottom-20 opacity-10 rotate-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 gap-6">
         {lessons.map(lesson => (
            <div key={lesson.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-200 transition-all">
               <div className="flex flex-col lg:flex-row gap-8 items-start">
                  
                  {/* Causa */}
                  <div className="flex-1 space-y-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} /> Gatilho (Erro)
                     </span>
                     <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100 italic">
                        "{lesson.trigger_message}"
                     </div>
                     <p className="text-xs text-slate-500 pl-2 border-l-2 border-slate-200">
                        Correção Humana: <span className="font-bold">{lesson.correction}</span>
                     </p>
                  </div>

                  {/* Seta */}
                  <div className="hidden lg:flex items-center justify-center h-full pt-8">
                     <ArrowRight size={24} className="text-slate-300" />
                  </div>

                  {/* Consequência (Aprendizado) */}
                  <div className="flex-1 space-y-3">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} /> Regra Aprendida (System Prompt)
                     </span>
                     <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl font-mono text-xs font-bold border border-emerald-100 shadow-sm">
                        {lesson.learned_rule}
                     </div>
                     <p className="text-[10px] text-slate-400 text-right">
                        Aprendido em: {new Date(lesson.timestamp).toLocaleString()}
                     </p>
                  </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

export default OptimizationLog;
