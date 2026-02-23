
import React, { useState, useRef } from 'react';
import { MOCK_REPORT_SCHEDULES } from '../constants';
import { ReportSchedule } from '../types';
import { FileSpreadsheet, Mail, Calendar, Trash2, Clock, Plus, Sparkles, Download, RefreshCw, CheckCircle, Upload, Filter, X } from 'lucide-react';
import { ApiService } from '../services/apiService';

const ReportsManager: React.FC = () => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(MOCK_REPORT_SCHEDULES);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<{ type: string; period: string }>({ type: '', period: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualExport = () => {
    setIsExporting(true);
    
    const hasFilters = filters.type || filters.period;
    const exportScope = hasFilters 
      ? `com base nos filtros selecionados (${filters.type || 'Todos'} | ${filters.period || 'Todo período'})` 
      : 'contendo todos os dados do sistema';

    setTimeout(() => {
      setIsExporting(false);
      alert(`Relatório gerado com sucesso ${exportScope}! Iniciando download...`);
    }, 2000);
  };

  const clearFilters = () => setFilters({ type: '', period: '' });

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
        alert(`Arquivo "${file.name}" selecionado com sucesso para processamento analítico.`);
      } else {
        alert("Formato de arquivo inválido. Por favor, selecione um arquivo .csv ou .xlsx.");
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // --- New Handlers ---
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja deletar este agendamento?')) return;
    try {
      await ApiService.deleteReport(reportId);
      setSchedules(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      alert('Falha ao deletar agendamento.');
    }
  };

  const handleApplySuggestion = async () => {
    try {
      await ApiService.applyAISuggestion('suggest_nightly');
      alert("Sugestão aplicada! Novo agendamento criado.");
      // Mock adding the suggestion to the list
      setSchedules(prev => [...prev, {
          id: Date.now().toString(),
          type: 'CRM (Noturno)',
          frequency: 'Diário',
          destination: 'marketing@bellanapoli.com',
          nextRun: 'Hoje, 23:00'
      }]);
    } catch (error) {
      console.error('Erro ao aplicar sugestão:', error);
    }
  };

  const handleCreateNewReport = () => {
      const type = prompt("Tipo de relatório (Vendas, CRM, Estoque):");
      if(type) {
          setSchedules(prev => [...prev, {
              id: Date.now().toString(),
              type: type,
              frequency: 'Semanal',
              destination: 'admin@bellanapoli.com',
              nextRun: 'Segunda, 08:00'
          }]);
      }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header e Filtros Rápidos */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestão de Relatórios & Dados</h2>
            <p className="text-slate-500 text-sm">Exporte métricas ou faça upload de planilhas para análise externa.</p>
          </div>
          <div className="flex gap-3">
            {/* Input de arquivo oculto aceitando apenas .csv e .xlsx */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileChange}
            />
            <button 
              onClick={triggerUpload}
              className="bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
            >
              <Upload size={18} /> Upload de Arquivos
            </button>
            <button 
              onClick={handleManualExport}
              disabled={isExporting}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
            >
              {isExporting ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
              {isExporting ? 'Exportando...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros:</span>
          </div>
          
          <select 
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Tipo de Relatório</option>
            <option value="vendas">Vendas & Faturamento</option>
            <option value="sentimento">Análise de Sentimento</option>
            <option value="leads">Leads & CRM</option>
            <option value="estoque">Estoque & Insumos</option>
          </select>

          <select 
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Período</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Últimos 7 dias</option>
            <option value="mes">Últimos 30 dias</option>
            <option value="trimestre">Trimestre</option>
          </select>

          {(filters.type || filters.period) && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              <X size={14} /> Limpar Filtros
            </button>
          )}

          <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            Escopo: {filters.type || filters.period ? 'Personalizado' : 'Todos os Dados'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-800">Agendamentos Ativos</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {schedules.length}</span>
          </div>
          
          {schedules.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 capitalize">
                    Relatório {s.type}
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase border border-emerald-100">{s.frequency}</span>
                  </h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <Mail size={14} className="text-slate-400" /> {s.destination}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                       <Clock size={12} /> Próximo: {s.nextRun}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => handleDeleteReport(s.id)}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                    <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={handleCreateNewReport}
            className="w-full border-2 border-dashed border-slate-200 py-12 rounded-3xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="p-4 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors">
              <Plus size={32} />
            </div>
            Configurar Nova Exportação Programada
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-emerald-400" />
                <h3 className="font-bold">Auto-otimização IA</h3>
              </div>
              <p className="text-sm text-indigo-100 leading-relaxed mb-6">
                "Notamos que 80% dos seus leads são convertidos após as 19h. Recomendamos exportar relatórios diários de CRM às 23h para análise imediata do fluxo noturno."
              </p>
              <button 
                onClick={handleApplySuggestion}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Aplicar Sugestão
              </button>
            </div>
            <Sparkles size={140} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Calendar size={18} className="text-emerald-500" />
               Histórico de Envios
             </h3>
             <div className="space-y-4">
                {[
                  { d: 'Hoje, 08:00', t: 'Relatório Financeiro', s: 'Sucesso' },
                  { d: 'Ontem, 08:00', t: 'Relatório Financeiro', s: 'Sucesso' },
                  { d: '22/05, 09:00', t: 'Leads Semanais', s: 'Sucesso' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-700">{item.t}</span>
                      <span className="text-slate-400">{item.d}</span>
                    </div>
                    <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-1 rounded capitalize">{item.s}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
