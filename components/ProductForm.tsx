
import React, { useState } from 'react';
import { Save, X, UtensilsCrossed, Image, DollarSign, Tag, AlignLeft, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/apiService';

interface ProductFormProps {
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Pizzas Clássicas',
    description: '',
    available: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await ApiService.addMenuItem({
            ...formData,
            price: parseFloat(formData.price)
        });
        onCancel();
    } catch (e) {
        alert("Erro ao salvar produto");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                   <UtensilsCrossed size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight">Novo Item</h2>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cadastro de Cardápio</p>
                </div>
             </div>
             <button onClick={onCancel} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={24} />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Tag size={14} className="text-indigo-500" /> Nome do Prato
                   </label>
                   <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      placeholder="Ex: Pizza Calabresa Premium"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <DollarSign size={14} className="text-emerald-500" /> Preço (R$)
                   </label>
                   <input 
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                      placeholder="0.00"
                   />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <AlignLeft size={14} className="text-indigo-500" /> Descrição e Ingredientes
                </label>
                <textarea 
                   value={formData.description}
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                   placeholder="Descreva o item de forma vendedora..."
                />
             </div>

             <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-indigo-200 transition-all cursor-pointer">
                <Image size={32} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Upload de Foto</span>
             </div>

             <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                   {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                   {isSaving ? 'Salvando...' : 'Salvar Produto'}
                </button>
             </div>
          </form>
       </div>
    </div>
  );
};

export default ProductForm;
