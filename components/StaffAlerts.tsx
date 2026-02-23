
import React, { useState, useEffect } from 'react';
import { AlertConfig } from '../types';
import { ApiService } from '../services/apiService';
import { 
  Plus, Bell, Smartphone, Zap, Trash2, 
  CheckCircle, RefreshCw, ShieldAlert, Sparkles, 
  AlertCircle, Cpu, ChevronRight, Binary, Target, MessageSquare
} from 'lucide-react';

const StaffAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: '', contact: '', message: '', triggerDesc: '' });
  const [compiledLogic, setCompiledLogic] = useState<any>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    // Carregamento de exemplos iniciais - em produção viria do backend
    setAlerts([
      { id: '1', name: 'Ruptura de Estoque', contactNumber: '+55 11 99999-0000', messageText: 'Atenção: A massa de pizza está acabando!', triggerCondition: '{"entity":"inventory","operator":"<","value":10}', isActive: true },
      { id: '2', name: 'Demora no Atendimento', contactNumber: '+55 11 99999-1111', messageText: 'Cliente aguardando resposta há mais de 5 minutos.', triggerCondition: '{"entity":"wait_time","operator":">","value":300}', isActive: true }
    ]);
  };

  const handleCompileAI = async () => {
    if (!newAlert.triggerDesc.trim()) return;
    setIsCompiling(true);
    setCompiledLogic(null);
    try {
      // O ApiService.compileTrigger consome o ai_trigger_compiler no backend
      const result = await ApiService.compileTrigger(newAlert.triggerDesc);
      setCompiledLogic(result);
    } catch (err) {
      console.error(err);
      window.alert("O cérebro da IA está ocupado. Tente novamente em instantes.");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleTestTrigger = async (alertItem: AlertConfig) => {
    setDispatchingId(alertItem.id);
    try {
      const response = await ApiService.triggerAlert({
        alert_id: alertItem.id,
        phone: alertItem.contactNumber,
        title: alertItem.name,
        message: alertItem.messageText
      });
      
      if (response.status === 'dispatched') {
        window.alert(`✅ Alerta enviado com sucesso via WhatsApp!`);
      }
    } catch (err) {
      window.alert("Falha ao disparar alerta de teste.");
    } finally {
      setDispatchingId(null);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compiledLogic || compiledLogic.entity === 'error') {
        window.alert("Por favor, valide a lógica com a IA antes de salvar.");
        return;
    }
    setIsSaving(true);
    try {
      const alertData: AlertConfig = {
        id: Date.now().toString(),
        name: newAlert.name,
        contactNumber: newAlert.contact,
        messageText: newAlert.message,
        // O campo triggerCondition é preenchido com o JSON resultante da compilação IA
        triggerCondition: JSON.stringify({
          entity: compiledLogic.entity,
          operator: compiledLogic.operator,
          value: compiledLogic.value,
          human_friendly: compiledLogic.human_friendly_logic
        }),
        isActive: true
      };
      
      setAlerts([alertData, ...alerts]);
      setShowForm(false);
      setNewAlert({ name: '', contact: '', message: '', triggerDesc: '' });
      setCompiledLogic(null);
    } finally {
      setIsSaving(false);
    }
  };

  const removeAlert = (id: string) => {
    if (confirm("Deseja desativar e remover este monitoramento?")) {
      setAlerts(alerts.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-100">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Monitor de Crises</h2>
            <p className="text-slate-500 text-sm font-medium">Gatilhos operacionais inteligentes via Gemini AI.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setCompiledLogic(null);
          }}
          className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-xl ${
            showForm ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {showForm ? <Trash2 size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancelar' : 'Configurar Alerta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateAlert} className="bg-white p-12 rounded-[3.5rem] border-2 border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Smartphone size={14} className="text-indigo-500" /> WhatsApp da Equipe
              </label>
              <input 
                required
                value={newAlert.contact}
                onChange={e => setNewAlert({...newAlert, contact: e.target.value})}
                placeholder="+55 11 99999-0000" 
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bell size={14} className="text-indigo-500" /> Nome do Alerta
              </label>
              <input 
                required
                value={newAlert.name}
                onChange={e => setNewAlert({...newAlert, name: e.target.value})}
                placeholder="Ex: Alerta de Falta de Insumo" 
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Descrição do Gatilho (IA)
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                    <input 
                        required
                        value={newAlert.triggerDesc}
                        onChange={e => {
                            setNewAlert({...newAlert, triggerDesc: e.target.value});
                            if (compiledLogic) setCompiledLogic(null);
                        }}
                        placeholder="Ex: 'Me avise se o estoque de mussarela for menor que 10kg'" 
                        className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-[2rem] pl-8 pr-32 py-6 text-sm focus:ring-8 focus:ring-indigo-500/5 outline-none font-black text-indigo-900 placeholder:text-indigo-300"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase bg-white px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-2 shadow-sm">
                          <Cpu size={12} /> Gemini Brain
                        </span>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={handleCompileAI}
                    disabled={isCompiling || !newAlert.triggerDesc}
                    className="bg-indigo-600 text-white px-10 rounded-3xl flex items-center gap-3 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100"
                >
                    {isCompiling ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">Compilar Gatilho</span>
                </button>
              </div>

              {compiledLogic && compiledLogic.entity !== 'error' && (
                <div className="mt-6 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-start gap-6 animate-in fade-in slide-in-from-left-6">
                    <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100"><CheckCircle size={28} /></div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Lógica Consolidada</h5>
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold border border-emerald-200">
                            {compiledLogic.entity}.{compiledLogic.operator}
                          </span>
                        </div>
                        <p className="text-emerald-700 font-bold text-sm leading-relaxed mb-4">
                          {compiledLogic.explanation}
                        </p>
                        <div className="flex items-center gap-3">
                           <div className="px-4 py-2 bg-white rounded-xl border border-emerald-200 text-emerald-600 font-black text-[10px] uppercase shadow-sm">
                             Condição: {compiledLogic.human_friendly_logic}
                           </div>
                           <div className="px-4 py-2 bg-white rounded-xl border border-emerald-200 text-emerald-600 font-black text-[10px] uppercase shadow-sm">
                             Referência: {compiledLogic.value}
                           </div>
                        </div>
                    </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensagem de Notificação</label>
              <textarea 
                required
                value={newAlert.message}
                onChange={e => setNewAlert({...newAlert, message: e.target.value})}
                placeholder="Ex: Atenção! O estoque de queijo atingiu nível crítico."
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-sm outline-none font-medium h-32 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!compiledLogic || isSaving}
            className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-800 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {isSaving ? 'Gravando Configurações...' : 'Ativar Monitoramento em Tempo Real'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-[1.8rem] transition-all shadow-lg ${alert.isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Binary size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{alert.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Smartphone size={12} className="text-indigo-400" /> {alert.contactNumber}
                    </span>
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {JSON.parse(alert.triggerCondition).entity}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => handleTestTrigger(alert)}
                  disabled={dispatchingId === alert.id}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm flex items-center gap-2 group/test"
                >
                  {dispatchingId === alert.id ? <RefreshCw className="animate-spin" size={16} /> : <Target size={16} className="group-hover/test:scale-125 transition-transform" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">Testar</span>
                </button>
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 mb-6 relative z-10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-400" /> Mensagem do WhatsApp
              </p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-200 pl-4">
                "{alert.messageText}"
              </p>
            </div>

            <div className="flex items-center justify-between relative z-10 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-2xl text-white shadow-xl">
                <Cpu size={14} className="text-indigo-400" />
                <span className="text-[9px] font-bold font-mono tracking-tighter opacity-80 overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                  ID: {alert.triggerCondition}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${alert.isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {alert.isActive ? 'Em Monitoramento' : 'Pausado'}
                </span>
              </div>
            </div>
            
            <AlertCircle size={240} className="absolute -right-20 -bottom-20 text-slate-100/50 pointer-events-none group-hover:scale-110 group-hover:text-indigo-50/50 transition-all duration-700" />
          </div>
        ))}

        <div 
          onClick={() => setShowForm(true)}
          className="border-4 border-dashed border-slate-200 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer"
        >
          <div className="p-8 bg-slate-100 rounded-[2.5rem] text-slate-300 group-hover:bg-white group-hover:text-indigo-500 transition-all shadow-sm">
             <Plus size={48} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-400 group-hover:text-indigo-600 transition-colors">Novo Trigger Operacional</h4>
            <p className="text-sm text-slate-400 mt-2 font-medium max-w-[250px] mx-auto leading-relaxed">Clique para criar gatilhos complexos interpretados por IA.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAlerts;
