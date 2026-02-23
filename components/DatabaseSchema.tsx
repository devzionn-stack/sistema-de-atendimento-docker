
import React, { useState } from 'react';
import { DB_SCHEMA } from '../constants';
import { Database, Table as TableIcon, Key, Info, Layers, Code, Sparkles, RefreshCw } from 'lucide-react';

interface DatabaseSchemaProps {
  onCreateClick: () => void;
}

const DatabaseSchema: React.FC<DatabaseSchemaProps> = ({ onCreateClick }) => {
  const [viewMode, setViewMode] = useState<'logical' | 'health'>('logical');

  const handleShowSQL = (tableName: string) => {
      alert(`-- SQL Script para ${tableName} \n\nCREATE TABLE ${tableName} (\n  id UUID PRIMARY KEY,\n  created_at TIMESTAMP\n);`);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Arquitetura de Dados (PostgreSQL + PgVector)</h2>
          <p className="text-slate-500 text-sm">Estrutura de tabelas e vetores para persistência de memória do LangGraph.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setViewMode('logical')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all ${viewMode === 'logical' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}
          >
             <Layers size={14} /> Visualização Lógica
          </button>
          <button 
            onClick={() => setViewMode('health')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${viewMode === 'health' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
             <Info size={14} /> Status de Saúde DB
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DB_SCHEMA.map(table => (
          <div key={table.name} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <TableIcon size={18} />
                </div>
                <h3 className="font-bold tracking-tight">{table.name}</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public</span>
            </div>
            
            <div className="flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Coluna</th>
                    <th className="px-6 py-3 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {table.columns.map(col => (
                    <tr key={col.name} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {col.name === 'id' && <Key size={12} className="text-amber-500" />}
                          <span className="font-mono text-xs font-bold text-slate-800">{col.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 italic">{col.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          col.type.includes('VECTOR') ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {col.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Relacionamentos: 0</span>
              <button 
                onClick={() => handleShowSQL(table.name)}
                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Code size={12} /> Ver SQL Script
              </button>
            </div>
          </div>
        ))}
        
        <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 group hover:bg-indigo-50/50 transition-all">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Database size={32} className="text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900">Nova Tabela / Index</h4>
            <p className="text-xs text-indigo-600">A IA pode sugerir novos esquemas com base em logs de erros do agente.</p>
          </div>
          <button 
            onClick={onCreateClick}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Sparkles size={14} />
            Criar com IA
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
