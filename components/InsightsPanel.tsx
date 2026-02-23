
import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/apiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ChevronRight, TrendingUp, ShoppingBag, Users, Zap, ArrowLeft, Loader2, Sparkles, LayoutGrid, MousePointer2, Download } from 'lucide-react';
import { downloadFile } from '../utils';

interface Breadcrumb {
  id: string;
  label: string;
  scope: string;
}

const InsightsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [viewStack, setViewStack] = useState<Breadcrumb[]>([{ id: 'root', label: 'Overview', scope: 'overview' }]);
  const [data, setData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('realtime');

  const currentView = viewStack[viewStack.length - 1];

  useEffect(() => {
    loadViewData();
  }, [currentView, selectedPeriod]);

  const loadViewData = async () => {
    setLoading(true);
    try {
      const result = await ApiService.fetchDrilldown(currentView.scope, currentView.id);
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const drillDown = (item: any) => {
    if (item.drillable || currentView.scope === 'overview') {
      setViewStack([...viewStack, { 
        id: item.id || item.name, 
        label: item.label || item.name, 
        scope: item.id || 'vendas' 
      }]);
    }
  };

  const goBack = () => {
    if (viewStack.length > 1) {
      setViewStack(viewStack.slice(0, -1));
    }
  };

  const jumpToBreadcrumb = (index: number) => {
    if (index < viewStack.length - 1) {
      setViewStack(viewStack.slice(0, index + 1));
    }
  };

  const handleExportInsight = () => {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `insights_${currentView.scope}.json`, 'application/json');
  };

  const handleGenerateCustomReport = () => {
      alert("Gerando PDF com os dados visuais atuais...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Breadcrumbs */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            {viewStack.length > 1 && (
              <button onClick={goBack} className="p-4 bg-slate-900 text-white rounded-2xl hover:scale-110 transition-transform shadow-xl">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                {viewStack.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <button 
                      onClick={() => jumpToBreadcrumb(i)}
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                        i === viewStack.length - 1 ? 'text-indigo-600 cursor-default' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {b.label}
                    </button>
                    {i < viewStack.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análise de IA Granular</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportInsight} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100"><Download size={18} /></button>
            <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <button 
                    onClick={() => setSelectedPeriod('realtime')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all ${selectedPeriod === 'realtime' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}
                >
                    Real-time
                </button>
                <button 
                    onClick={() => setSelectedPeriod('historical')}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedPeriod === 'historical' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                    Historical
                </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Escavando Dados Profundos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualizer */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <TrendingUp size={24} className="text-indigo-600" /> 
                    {currentView.label === 'Overview' ? 'Projeção de Fluxo' : `Detalhes: ${currentView.label}`}
                  </h3>
                  {viewStack.length > 1 && (
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                      <MousePointer2 size={12} /> Clique nos pontos do gráfico para drill-down aprofundado
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-100">Sincronizado</span>
             </div>
             
             <div className="h-[400px]">
                {currentView.scope === 'overview' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    {data.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => drillDown(item)}
                        className="group p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-left hover:bg-white hover:border-indigo-300 hover:shadow-2xl transition-all relative overflow-hidden"
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block group-hover:text-indigo-600 transition-colors">{item.label}</span>
                        <div className="text-4xl font-black text-slate-900 group-hover:scale-105 transition-transform origin-left">{item.value}</div>
                        {item.drillable && (
                          <div className="absolute right-8 bottom-8 p-3 bg-white text-indigo-600 rounded-2xl shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                            <ChevronRight size={24} />
                          </div>
                        )}
                        <LayoutGrid size={100} className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={data} 
                      onClick={(e) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          const item = e.activePayload[0].payload;
                          if (item.drillable) drillDown(item);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)'}}
                        cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#4f46e5" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }}
                        animationDuration={800}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>

          {/* AI Insights Contextual */}
          <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-600 rounded-2xl">
                       <Sparkles size={20} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Resumo Cognitivo</span>
                 </div>
                 <p className="text-sm font-medium leading-relaxed opacity-90 mb-8 italic">
                   {currentView.scope === 'overview' 
                     ? "A navegação granular indica que o pico de vendas de terça-feira foi impulsionado pela Categoria 'Pizzas Veganas', sugerindo uma oportunidade de campanha regional."
                     : `Analisando ${currentView.label}: O volume de interações nesta camada sugere uma alta taxa de retenção de clientes recorrentes.`}
                 </p>
                 <button 
                    onClick={handleGenerateCustomReport}
                    className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-colors"
                 >
                    Gerar Relatório PDF
                 </button>
               </div>
               <Zap size={200} className="absolute -right-20 -top-20 opacity-5 rotate-45" />
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Users size={18} className="text-indigo-600" /> Audiência Segmentada
               </h3>
               <div className="space-y-4">
                 {[
                   { label: 'Recorrência', value: '78%', color: '#4f46e5' },
                   { label: 'Conversão', value: '12%', color: '#10b981' },
                   { label: 'Abandono', value: '4%', color: '#ef4444' }
                 ].map(stat => (
                   <div key={stat.label}>
                     <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                       <span>{stat.label}</span>
                       <span style={{color: stat.color}}>{stat.value}</span>
                     </div>
                     <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                       <div className="h-full rounded-full animate-in slide-in-from-left duration-1000" style={{width: stat.value, backgroundColor: stat.color}}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPanel;
