
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_CONVERSATIONS } from '../constants';
import { Conversation, Sentiment, Message } from '../types';
import { ApiService } from '../services/apiService';
import { Send, ThumbsUp, ThumbsDown, FileText, PlayCircle, Brain, User, Bot, Sparkles, MessageSquare, ShieldAlert, Loader2, Mic, MicOff, Volume2, Download } from 'lucide-react';
import { downloadFile } from '../utils';

const ConversationLogs: React.FC = () => {
  const [selectedConv, setSelectedConv] = useState<Conversation>(MOCK_CONVERSATIONS[0]);
  const [prediction, setPrediction] = useState<string>('Analisando intenção...');
  const [isIntervening, setIsIntervening] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConv.messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPrediction = async () => {
      setPrediction('Calculando próxima intenção...');
      const history = selectedConv.messages.map(m => `${m.sender}: ${m.text}`).join('\n');
      const intent = await ApiService.predictNextIntent(history);
      setPrediction(intent.intent || intent);
    };
    fetchPrediction();
  }, [selectedConv]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      window.alert("Permissão de microfone negada ou erro ao iniciar gravação.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const res = await ApiService.transcribeAudio({ base64: base64Audio });
        setReplyText(prev => prev ? `${prev} ${res.transcription}` : res.transcription);
      };
    } catch (err) {
      console.error("Erro na transcrição:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleInterventionToggle = async () => {
    const newStatus = !isIntervening;
    try {
      await ApiService.intervene(selectedConv.id, newStatus);
      setIsIntervening(newStatus);
    } catch (err) {
      window.alert("Erro ao comunicar com LangGraph.");
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || isSending) return;
    
    setIsSending(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      text: replyText,
      timestamp: new Date().toISOString()
    };

    const updatedConv = { ...selectedConv, messages: [...selectedConv.messages, userMsg] };
    setSelectedConv(updatedConv);
    setReplyText('');

    try {
      await ApiService.sendMessage(selectedConv.id, replyText, []);
      setIsSending(false);
    } catch (err) {
      console.error(err);
      setIsSending(false);
    }
  };

  const handleFeedback = async (messageId: string, isPositive: boolean) => {
    if (!isPositive) {
      setFeedbackMode(messageId);
    } else {
      await ApiService.sendFeedback({
        conversation_id: selectedConv.id,
        message_id: messageId,
        is_positive: true
      });
      window.alert("Feedback positivo registrado!");
    }
  };

  const submitCorrection = async () => {
    if (!feedbackMode) return;
    await ApiService.sendFeedback({
      conversation_id: selectedConv.id,
      message_id: feedbackMode,
      is_positive: false,
      correction: correction
    });
    window.alert("O Agente aprendeu esta lição!");
    setFeedbackMode(null);
    setCorrection('');
  };

  const handleExportConversation = () => {
      const data = {
        cliente: selectedConv.userName,
        telefone: selectedConv.phoneNumber,
        mensagens: selectedConv.messages.map(m => ({
          remetente: m.sender,
          texto: m.text,
          timestamp: m.timestamp
        }))
      };
      
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `conversa_${selectedConv.phoneNumber}.json`, 'application/json');
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <input 
            type="text" 
            placeholder="Buscar contato..." 
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_CONVERSATIONS.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`w-full p-5 flex gap-4 text-left border-b last:border-0 ${
                selectedConv.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
              }`}
            >
              <img src={`https://picsum.photos/48/48?u=${conv.id}`} className="w-12 h-12 rounded-2xl" alt="avatar" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 truncate">{conv.userName}</span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-1">
                  {conv.messages[conv.messages.length - 1].text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={`https://picsum.photos/48/48?u=${selectedConv.id}`} className="w-12 h-12 rounded-2xl" alt="current" />
              {isIntervening && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg">{selectedConv.userName}</h3>
              <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isIntervening ? 'text-red-500' : 'text-emerald-500'}`}>
                {isIntervening ? <ShieldAlert size={12} /> : <Sparkles size={12} />}
                {isIntervening ? 'Intervenção Humana Ativa' : 'IA Bella Napoli Ativa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IA Predição</span>
               <span className="text-sm font-black text-indigo-600">{prediction}</span>
             </div>
             <button onClick={handleExportConversation} className="p-3 hover:bg-slate-50 rounded-xl" title="Exportar Conversa">
                 <Download size={20} className="text-slate-400" />
             </button>
             <button 
                onClick={handleInterventionToggle}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
                  isIntervening ? 'bg-red-600 text-white shadow-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isIntervening ? 'Liberar para IA' : 'Intervir Agora'}
              </button>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-slate-50/30">
          {selectedConv.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[70%] group relative`}>
                <div className={`flex items-center gap-2 mb-2 ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.sender}</span>
                </div>
                <div className={`p-6 rounded-[2rem] shadow-sm relative ${
                  msg.sender === 'user' 
                    ? 'bg-white rounded-tl-none border border-slate-100' 
                    : 'bg-indigo-600 text-white rounded-tr-none'
                }`}>
                  <p className="text-sm font-medium">{msg.text}</p>
                  {msg.sender === 'agent' && !isIntervening && (
                    <div className="absolute -bottom-4 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleFeedback(msg.id, true)} className="bg-white border border-slate-100 p-2 rounded-xl text-emerald-500 shadow-md"><ThumbsUp size={14} /></button>
                      <button onClick={() => handleFeedback(msg.id, false)} className="bg-white border border-slate-100 p-2 rounded-xl text-red-500 shadow-md"><ThumbsDown size={14} /></button>
                    </div>
                  )}
                </div>
                {feedbackMode === msg.id && (
                  <div className="mt-4 p-4 bg-white border border-red-100 rounded-2xl shadow-xl">
                    <textarea 
                      value={correction}
                      onChange={(e) => setCorrection(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl bg-slate-50 outline-none mb-3"
                      placeholder="Qual seria a resposta correta?"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setFeedbackMode(null)} className="text-[10px] font-bold text-slate-400">Cancelar</button>
                      <button onClick={submitCorrection} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold">Corrigir IA</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 bg-white border-t border-slate-100">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isIntervening ? (isTranscribing ? "Transcrevendo áudio..." : "Você está no controle...") : "A IA está respondendo. Intervenha para digitar."}
                className={`w-full rounded-[2rem] px-8 py-5 text-sm bg-slate-50 border-2 border-transparent focus:border-indigo-100 outline-none transition-all ${isTranscribing ? 'animate-pulse text-indigo-400' : ''}`}
                disabled={!isIntervening || isSending || isTranscribing}
              />
              {isIntervening && (
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600 scale-125 animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                  title="Segure para falar e transcrever"
                >
                  {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              )}
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!isIntervening || !replyText.trim() || isSending || isTranscribing}
              className="bg-indigo-600 text-white p-5 rounded-[2rem] shadow-xl disabled:opacity-50"
            >
              {isSending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </button>
          </div>
          {isRecording && (
            <div className="mt-2 flex items-center gap-2 justify-center text-[10px] font-bold text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
              <Volume2 size={12} className="animate-bounce" /> Gravando áudio para transcrição...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationLogs;
