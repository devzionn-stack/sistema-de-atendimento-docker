
import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Send, Menu, ShoppingCart, ChevronRight, Star, User, Bot } from 'lucide-react';
import { MenuItem } from '../types';

interface PreviewProps {
  items: MenuItem[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

const InteractiveMenuPreview: React.FC<PreviewProps> = ({ items }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'agent', text: 'Olá! Seja bem-vindo à Bella Napoli. O que deseja pedir hoje?', time: '14:05' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (sender: 'user' | 'agent', text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const simulateResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let reply = "Desculpe, não entendi.";
      const lower = userText.toLowerCase();
      
      if (lower.includes('promo') || lower.includes('preço')) {
        reply = "Temos a Pizza Margherita por R$ 45,00 hoje! Deseja adicionar?";
      } else if (lower.includes('sim') || lower.includes('quero')) {
        reply = "Ótimo! Adicionei ao seu carrinho simulado. Algo mais?";
      } else if (lower.includes('não') || lower.includes('obrigado')) {
        reply = "Perfeito. Seu pedido está sendo processado (Simulação).";
      } else {
        reply = "Entendi. Você pode ver nosso cardápio acima para escolher seu sabor favorito!";
      }
      
      addMessage('agent', reply);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage('user', input);
    simulateResponse(input);
    setInput('');
  };

  const handleSelectProduct = (item: MenuItem) => {
    const msg = `Gostaria de saber mais sobre a ${item.name}`;
    addMessage('user', msg);
    simulateResponse(msg);
  };

  const handleQuickAction = (action: string) => {
    addMessage('user', action);
    simulateResponse(action);
  };

  const addToCart = () => {
    const msg = "Quero ver o catálogo completo";
    addMessage('user', msg);
    simulateResponse(msg);
  };

  return (
    <div className="bg-slate-900 p-8 rounded-[3.5rem] border-[12px] border-slate-800 shadow-2xl w-[380px] h-[750px] relative overflow-hidden hidden xl:block">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
      
      {/* Screen Content */}
      <div className="bg-[#e5ddd5] h-full w-full rounded-3xl overflow-hidden flex flex-col font-sans relative">
        {/* WPP Header */}
        <div className="bg-[#075e54] p-4 pt-8 text-white flex items-center gap-3 shadow-md z-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <img src="https://picsum.photos/40/40?sig=pizza" className="rounded-full" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Bella Napoli 🍕</h4>
            <p className="text-[10px] opacity-70">online</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl shadow-sm max-w-[85%] text-[13px] leading-tight relative ${
                msg.sender === 'user' 
                  ? 'bg-[#dcf8c6] rounded-tr-none text-slate-800' 
                  : 'bg-white rounded-tl-none text-slate-800'
              }`}>
                {msg.text}
                <div className="text-[10px] text-slate-400 text-right mt-1 flex justify-end items-center gap-1">
                  {msg.time}
                  {msg.sender === 'user' && <span className="text-blue-400">✓✓</span>}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm flex items-center gap-1 w-16">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
            </div>
          )}

          {/* Interactive List Simulation */}
          {messages.length < 3 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 mt-2">
              <div className="bg-emerald-500 p-3 text-white">
                <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <Menu size={14} /> Cardápio Bella Napoli
                </h5>
              </div>
              <div className="p-1">
                {items.slice(0, 3).map(item => (
                  <button 
                      key={item.id} 
                      onClick={() => handleSelectProduct(item)}
                      className="w-full p-3 flex items-center justify-between border-b last:border-0 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="text-left">
                      <p className="text-[12px] font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
              <button 
                  onClick={addToCart}
                  className="w-full py-2 bg-slate-50 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 border-t"
              >
                Ver Catálogo Completo
              </button>
            </div>
          )}

          {/* Reply Buttons */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {['Promo Pizza G', 'Combo Família', 'Bebidas'].map(btn => (
              <button 
                  key={btn} 
                  onClick={() => handleQuickAction(btn)}
                  className="bg-white text-emerald-600 border border-slate-200 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-sm hover:bg-emerald-50 active:scale-95 transition-all"
              >
                {btn}
              </button>
            ))}
          </div>
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#f0f0f0] p-3 flex items-center gap-3">
          <input 
            className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-slate-700 outline-none border border-transparent focus:border-emerald-500 transition-all"
            placeholder="Mensagem"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="bg-[#128c7e] p-2 rounded-full text-white hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Floating Indicator */}
      <div className="absolute bottom-12 right-12 bg-indigo-600 text-white p-4 rounded-full shadow-2xl animate-bounce">
         <Smartphone size={24} />
      </div>
    </div>
  );
};

export default InteractiveMenuPreview;
