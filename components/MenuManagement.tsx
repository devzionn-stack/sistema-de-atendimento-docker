
import React, { useState, useEffect } from 'react';
import { MenuItem, AppTab } from '../types';
import { ApiService } from '../services/apiService';
import { Plus, Search, Trash2, Edit3, Sparkles, Wand2, Package, Eye, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import InteractiveMenuPreview from './InteractiveMenuPreview';
import ProductForm from './ProductForm';

const MenuManagement: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsFetching(true);
    try {
        const data = await ApiService.getMenu();
        setItems(data);
    } catch (e) {
        console.error("Failed to load menu", e);
    } finally {
        setIsFetching(false);
    }
  };

  const generateDescription = async (id: string, name: string) => {
    setLoading(id);
    try {
      const res = await ApiService.suggestMenuDescription(name);
      setItems(prev => prev.map(item => item.id === id ? { ...item, description: res.suggestion } : item));
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
        await ApiService.deleteMenuItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  if (showForm) {
      return <ProductForm onCancel={() => { setShowForm(false); loadMenu(); }} />;
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-6">
        {/* Gestão de Inventário Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-lg">
             <DollarSign className="mb-2 opacity-50" size={24} />
             <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Margem Média</h4>
             <p className="text-2xl font-black">68.4%</p>
          </div>
          <div className="bg-amber-500 p-6 rounded-[2rem] text-white shadow-lg">
             <TrendingDown className="mb-2 opacity-50" size={24} />
             <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Baixo Estoque</h4>
             <p className="text-2xl font-black">3 Itens</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-lg">
             <Package className="mb-2 opacity-50" size={24} />
             <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70">Giro de Pratos</h4>
             <p className="text-2xl font-black">Alta</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar itens no banco de dados..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`p-3 rounded-xl border transition-all ${showPreview ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <Eye size={20} />
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              <Plus size={16} /> Novo Produto
            </button>
          </div>
        </div>

        {isFetching ? (
            <div className="flex justify-center p-20">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
            </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:border-indigo-300 transition-all flex flex-col">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img src={`https://picsum.photos/400/225?sig=${item.id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-1.5 rounded-2xl text-sm font-black text-slate-800 shadow-xl border border-white">
                  R$ {item.price.toFixed(2)}
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-900 text-xl tracking-tight">{item.name}</h4>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-widest mt-2 inline-block border border-indigo-100">
                      {item.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed italic">
                  "{item.description}"
                </p>
                
                <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                   <button 
                    onClick={() => generateDescription(item.id, item.name)}
                    disabled={loading === item.id}
                    className="w-full py-3 bg-slate-50 text-indigo-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
                  >
                    <Wand2 size={16} className={loading === item.id ? 'animate-spin' : ''} />
                    Refinar com Gemini AI
                  </button>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                       <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={20} /></button>
                       <button onClick={() => handleDelete(item.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={item.available} readOnly />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {showPreview && (
        <div className="sticky top-24 animate-in slide-in-from-right-10 duration-500">
          <InteractiveMenuPreview items={items} />
          <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Visualização do Cliente (WhatsApp)
          </p>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
