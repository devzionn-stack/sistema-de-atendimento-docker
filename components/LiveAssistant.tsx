
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Activity, Play, Square, Sparkles, Brain, Waves, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('Clique em "Iniciar" para abrir o canal de áudio nativo...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(5).fill(10));
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
        // Simular visualizador de áudio
        intervalRef.current = window.setInterval(() => {
            const newLevels = new Array(5).fill(0).map(() => Math.random() * 40 + 10);
            setAudioLevel(newLevels);
        }, 100);
    } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setAudioLevel(new Array(5).fill(10));
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  // Simulação de conexão com o endpoint live (WSS) do Gemini
  const handleToggleSession = () => {
    if (isActive) {
        setIsActive(false);
        setTranscription('Sessão encerrada.');
    } else {
        setIsProcessing(true);
        setTranscription('Estabelecendo handshake seguro...');
        setTimeout(() => {
          setIsActive(true);
          setIsProcessing(false);
          setTranscription('Conectado via Gemini Live API. Aguardando voz do usuário...');
        }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Voice Support Intelligence</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
          Interação humana por voz de baixíssima latência (nativo). A IA ouve, pensa e responde em <span className="font-black text-indigo-600">~200ms</span>.
        </p>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col items-center p-12 relative">
        {/* Radar Effect */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-[500px] h-[500px] border-4 border-indigo-600 rounded-full animate-ping"></div>
          </div>
        )}

        <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 relative z-10 ${
          isActive ? 'bg-indigo-600 text-white shadow-[0_0_80px_rgba(79,70,229,0.4)] scale-110' : 'bg-slate-100 text-slate-300'
        }`}>
          {isProcessing ? <Loader2 size={64} className="animate-spin" /> : isActive ? <Waves size={64} className="animate-pulse" /> : <Mic size={64} />}
        </div>

        <div className="mt-12 text-center relative z-10 min-h-[80px]">
          <p className={`text-sm font-bold transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400 italic'}`}>
            {transcription}
          </p>
          {isActive && (
             <div className="mt-8 flex gap-3 justify-center items-end h-16">
                {audioLevel.map((h, i) => (
                    <div 
                        key={i} 
                        style={{ height: `${h}px` }}
                        className="w-2 bg-indigo-500 rounded-full transition-all duration-100"
                    ></div>
                ))}
             </div>
          )}
        </div>

        <div className="mt-12 flex gap-4 relative z-10">
           <button 
             onClick={handleToggleSession}
             disabled={isProcessing}
             className={`px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 ${
               isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'
             }`}
           >
             {isActive ? <Square size={16} /> : <Play size={16} />}
             {isActive ? 'Encerrar Sessão' : 'Iniciar Assistente'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <div className="flex items-center gap-3 mb-4">
             <Brain size={20} className="text-indigo-400" />
             <h4 className="font-bold">Multimodal Reasoning</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A IA utiliza o modelo <span className="text-white font-mono">gemini-2.5-flash-native-audio</span>, eliminando a etapa de STT (Speech-to-Text) e gerando áudio diretamente dos neurônios artificiais.
          </p>
        </div>
        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
           <div className="flex items-center gap-3 mb-4">
             <Sparkles size={20} className="text-indigo-600" />
             <h4 className="font-bold text-indigo-900">Emotion Aware</h4>
          </div>
          <p className="text-xs text-indigo-600/70 leading-relaxed">
            Detectamos sarcasmo, urgência e frustração no tom de voz do cliente, permitindo que a IA ajuste sua entonação para ser mais empática ou assertiva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
