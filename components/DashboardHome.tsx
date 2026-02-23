
import React, { useState, useEffect } from 'react';
import { STAT_CARDS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, Activity, Zap, ArrowRight } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { AppTab } from '../types';

// Mock function to satisfy TypeScript interface if props are not directly passed in routing setup
interface DashboardHomeProps {
    setActiveTab?: (tab: AppTab) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState(STAT_CARDS);
  const [chartData, setChartData] = useState([
    { name: '08:00', msg: 400 }, { name: '10:00', msg: 300 }, { name: '12:00', msg: 600 },
    { name: '14:00', msg: 800 }, { name: '16:00', msg: 500 }, { name: '18:00', msg: 900 }, { name: '20:00', msg: 1000 },
  ]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const unsubscribe = ApiService.subscribe((event) => {
      if (event.type === 'STATS_UPDATE') {
        setIsLive(true);
        setStats(prev => prev.map(card => {
          if (card.label === 'Conversas Ativas') return { ...card, value: event.data.active_users.toString() };
          if (card.label === 'Leads Qualificados') return { ...card, value: event.data.leads.toString() };
          if (card.label === 'Tempo de Resposta') return { ...card, value: event.data.response_time };
          return card;
        }));
        const newTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChartData(prev => [...prev.slice(1), { name: newTime, msg: event.data.active_users * 10 }]);
        setTimeout(() => setIsLive(false), 1500);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isLive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
          <Activity size={12} className={isLive ? 'animate-pulse' : ''} />
          {isLive ? 'Kafka Stream Ingesting' : 'Conectado ao Cluster'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((card, i) => (
          <div key={i} className={`bg-white p-6 rounded-[2rem] border transition-all duration-500 ${isLive ? 'border-indigo-300 shadow-xl' : 'border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">{card.icon}</div>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                {card.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">{card.label}</h3>
            <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Fluxo de Dados Operacionais</h2>
              <p className="text-sm text-slate-500 font-medium">Sincronização bidirecional via WebSocket + Kafka</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="msg" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorMsg)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <Sparkles size={24} className="text-indigo-400" />
                    <h2 className="text-lg font-bold text-white tracking-tight">IA Nudges em Tempo Real</h2>
                </div>
                <div className="space-y-4 flex-1 relative z-10">
                    <div className={`p-5 rounded-2xl border transition-all duration-700 ${isLive ? 'bg-indigo-600 border-indigo-400 scale-105' : 'bg-slate-800 border-slate-700'}`}>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Insight de Venda</p>
                    <p className="text-sm text-white font-medium leading-relaxed">
                        {isLive ? 'Pico detectado! Sugerir borda recheada agora aumenta conversão em 15%.' : 'Aguardando próximo evento do stream...'}
                    </p>
                    </div>
                </div>
                <TrendingUp size={200} className="absolute -right-10 -bottom-10 text-white/5 pointer-events-none" />
            </div>

            {setActiveTab && (
                <div 
                    className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group"
                    onClick={() => setActiveTab(AppTab.OPTIMIZATION_LOG)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Otimizações de IA</h3>
                                <p className="text-xs text-slate-400 font-medium">Ver histórico de aprendizado RLHF</p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
