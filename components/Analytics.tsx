
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/apiService';
import { Loader2, MessageCircle, Users, Clock, ThumbsUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    activeUsers: 0,
    avgResponseTime: 0,
    satisfactionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
        const data = await ApiService.getAnalytics();
        setMetrics(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
      return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  const chartData = [
      { name: 'Seg', val: metrics.totalConversations * 0.1 },
      { name: 'Ter', val: metrics.totalConversations * 0.2 },
      { name: 'Qua', val: metrics.totalConversations * 0.15 },
      { name: 'Qui', val: metrics.totalConversations * 0.25 },
      { name: 'Sex', val: metrics.totalConversations * 0.3 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Conversas</p>
              <h3 className="text-3xl font-black text-slate-800">{metrics.totalConversations}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <MessageCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usuários Ativos</p>
              <h3 className="text-3xl font-black text-slate-800">{metrics.activeUsers}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tempo Médio (s)</p>
              <h3 className="text-3xl font-black text-slate-800">{metrics.avgResponseTime}s</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Satisfação (0-10)</p>
              <h3 className="text-3xl font-black text-slate-800">{metrics.satisfactionRate}</h3>
            </div>
            <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                <ThumbsUp size={24} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-6 text-slate-800">Evolução de Conversas (Semanal)</h3>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="val" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={60} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
