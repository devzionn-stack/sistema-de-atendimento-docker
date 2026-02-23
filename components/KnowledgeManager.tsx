
import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeItem } from '../types';
import { ApiService } from '../services/apiService';
import { Database, Plus, Search, Loader2, FileText, Trash2, ShieldCheck, Binary, CheckCircle2 } from 'lucide-react';

const KnowledgeManager: React.FC = () => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStage, setUploadStage] = useState<'idle' | 'reading' | 'chunking' | 'embedding'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
        const data = await ApiService.getKnowledgeFiles();
        setItems(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStage('reading');
    
    // Simulate stages for UI feedback while real upload happens
    setTimeout(() => setUploadStage('chunking'), 500);
    setTimeout(() => setUploadStage('embedding'), 1000);

    try {
        await ApiService.uploadKnowledgeFile(file);
        setUploadStage('idle');
        loadFiles(); // Reload list
        if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
        alert("Falha no upload do arquivo.");
        setUploadStage('idle');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Tem certeza? Isso removerá o documento do banco vetorial.')) return;
    try {
      await ApiService.deleteKnowledgeDocument(docId);
      setItems(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      alert('Erro ao excluir documento.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Database size={28} />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-200">RAG Vector Engine</span>
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tight">Memória Semântica</h2>
            <p className="text-indigo-100 text-xl leading-relaxed opacity-90 font-medium">
              Documentos indexados aqui permitem que o Agente responda perguntas sobre o cardápio e políticas da Bella Napoli com <span className="text-white font-bold underline decoration-emerald-400">precisão cirúrgica</span>.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-6 bg-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-2xl">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStage !== 'idle'}
              className="bg-white text-indigo-600 px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-4 hover:bg-indigo-50 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {uploadStage === 'idle' ? <Plus size={24} /> : <Loader2 size={24} className="animate-spin" />}
              {uploadStage === 'idle' ? 'Indexar Documento' : 'Processando...'}
            </button>
            
            {uploadStage !== 'idle' && (
              <div className="flex items-center gap-5">
                {[
                  { id: 'reading', label: 'Leitura' },
                  { id: 'chunking', label: 'Fragmentos' },
                  { id: 'embedding', label: 'Vetores' }
                ].map((s, idx) => (
                  <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        uploadStage === s.id ? 'bg-emerald-400 scale-125 animate-pulse' : 'bg-white/20'
                      }`}></div>
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">{s.label}</span>
                    </div>
                    {idx < 2 && <div className="w-6 h-[2px] bg-white/10 mb-3"></div>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
        <Binary size={400} className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none rotate-12" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
        <div className="p-10 border-b flex items-center justify-between bg-slate-50/30">
          <div>
            <h3 className="font-bold text-slate-800 text-xl tracking-tight">Arquivos Vetorizados</h3>
            <p className="text-sm text-slate-500 mt-1">Sincronizado com <span className="font-mono text-indigo-600">pgvector @ production</span></p>
          </div>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar base de conhecimento..." 
              className="bg-white border border-slate-200 pl-14 pr-8 py-4 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-96 shadow-sm" 
            />
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
              <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Consultando Embeddings...</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-10 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center gap-8">
                  <div className="p-5 bg-slate-100 text-slate-400 rounded-3xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xl">{item.fileName}</h4>
                    <div className="flex items-center gap-6 mt-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">{item.fileType}</span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 size={14} /> {item.tokenCount} Tokens Ativos
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.uploadDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleDeleteDocument(item.id)}
                    className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeManager;
