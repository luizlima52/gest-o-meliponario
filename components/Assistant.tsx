import React, { useState, useRef, useEffect } from 'react';
import { generateBeeAdvice } from '../services/geminiService';
import { ChatMessage, Hive } from '../types';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AssistantProps {
  hives: Hive[];
}

const Assistant: React.FC<AssistantProps> = ({ hives }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu assistente virtual de meliponicultura. Posso ajudar com dicas de manejo, identificação de problemas ou calendários de alimentação. Como posso ajudar seu meliponário hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare context about current hives
    const context = `O usuário possui ${hives.length} enxames. 
    Espécies: ${hives.map(h => h.species).join(', ')}.
    Status de saúde: ${hives.map(h => `${h.name}: ${h.health}`).join(', ')}.`;

    const responseText = await generateBeeAdvice(input, context);

    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-honey-500 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles size={20} className="text-honey-100" />
          <h2 className="font-semibold">MeliPro IA Assistant</h2>
        </div>
        <span className="text-xs bg-honey-600 px-2 py-1 rounded text-honey-50">Powered by Gemini</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
              <div className={`p-2 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-honey-100'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} className="text-honey-600" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-800 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none prose prose-sm prose-p:my-1 prose-headings:text-gray-900 prose-headings:font-bold prose-strong:text-gray-900'
              }`}>
                {msg.role === 'model' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center space-x-2">
              <Loader2 size={16} className="animate-spin text-honey-500" />
              <span className="text-xs text-gray-500">Consultando especialista...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre divisão, alimentação ou saúde..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-transparent transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-honey-600 hover:bg-honey-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
