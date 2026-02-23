
import React, { useState, useEffect } from 'react';
import { MOCK_LEADS } from '../constants';
import { Lead } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Filter, Target, ArrowUpRight, Zap, Eye, X } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { convertToCSV, downloadFile } from '../utils';

const CRMLeads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const unsubscribe = ApiService.subscribe((event) => {
      if (event.type === 'LEAD_UPDATE') {
        setIsUpdating(true);
        setLeads(prev => [event.data, ...prev].slice(0, 10)); // Mantém os 10 mais recentes
        setTimeout(() => setIsUpdating(false), 2000);
      }
    });
    return unsubscribe;
  }, []);

  const handleExportCSV = () => {
    const csv = leads.map(lead => ({
      Nome: lead.userName,
      Telefone: lead.phoneNumber,
      Intencao: lead.lastIntent,
      Potencial: lead.potential,
      Status: lead.status
    }));
    
    const csvContent = convertToCSV(csv);
    downloadFile(csvContent, 'leads.csv', 'text/csv');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pipeline de Conversão</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Leads identificados via IA em tempo real.</p>
        </div>
        <div className="flex gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isUpdating ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse' : 'bg-white text-slate-400 border-slate-200'}`}>
            <Zap size={14} /> {isUpdating ? 'Lead Injected' : 'Stream Ativo'}
          </div>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
          >
            <Download size={16} /> Exportar BI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                  <th className="px-8 py-6">Cliente</th>
                  <th className="px-8 py-6">Intenção IA</th>
                  <th className="px-8 py-6">Potencial</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead, idx) => (
                  <tr key={lead.id} className={`hover:bg-slate-50/80 transition-all group ${idx === 0 && isUpdating ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shadow-inner">
                          {lead.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{lead.userName}</div>
                          <div className="text-[10px] font-bold text-slate-400 tracking-widest">{lead.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-600 italic">"{lead.lastIntent}"</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
                        lead.potential === 'high' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {lead.potential}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.status}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <Target className="mb-6 opacity-30" size={48} />
            <h3 className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Taxa de Conversão Real</h3>
            <p className="text-5xl font-black tracking-tighter mb-4">24.8%</p>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold">
              <span className="bg-white/20 px-2 py-0.5 rounded-lg">+4.2%</span> em relação à semana passada
            </div>
            <Zap size={200} className="absolute -right-10 -top-10 opacity-10 rotate-12" />
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-8">Performance por Canal</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{n: 'WPP', v: 45}, {n: 'Site', v: 12}, {n: 'Insta', v: 22}]}>
                  <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip cursor={{fill: 'rgba(79, 70, 229, 0.05)'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                  <Bar dataKey="v" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Detalhes do Lead</h3>
                    <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
                        <p className="font-medium text-slate-800">{selectedLead.userName}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Contato</label>
                        <p className="font-medium text-slate-800">{selectedLead.phoneNumber}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Última Interação</label>
                        <p className="font-medium text-slate-800">{selectedLead.lastIntent}</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CRMLeads;
