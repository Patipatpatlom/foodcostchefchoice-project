import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function ChefChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      parts: [{ text: "สวัสดีครับเชฟ! ผม De Chef's Choice AI ยินดีช่วยเช็คราคาวัตถุดิบวันนี้ ต้องการเช็คราคาอะไรพิมพ์บอกได้เลยครับ 👨‍🍳" }]
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = { role: 'user', parts: [{ text: inputText.trim() }] };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Send only role and parts to the backend
      const historyToSend = updatedMessages.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }));

      const response = await api.post('/chat', { messages: historyToSend });
      
      const aiMessage = {
        role: 'model',
        parts: [{ text: response.data.text }],
        rawData: response.data.rawData
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: "ขออภัยครับเชฟ ระบบขัดข้องเล็กน้อย รบกวนลองใหม่อีกครั้งนะครับ" }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async (rawData) => {
    try {
      await api.post('/ingredients/upsert-price', {
        name: rawData.ingredient,
        purchasePrice: rawData.price,
        purchaseUnit: rawData.unit,
        category: "Fresh Produce" // Default category as requested
      });
      alert(`อัปเดตราคา ${rawData.ingredient} เป็น ${rawData.price} บาท สำเร็จแล้วครับ!`);
    } catch (error) {
      console.error("Error updating price:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตราคาครับ");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 flex items-center justify-center"
      >
        <MessageSquare className="w-7 h-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-orange-500" />
          <h3 className="font-bold text-lg">De Chef's Choice AI</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
              <div className="flex items-start gap-2">
                {msg.role === 'model' && <Bot className="w-4 h-4 mt-1 text-orange-500 shrink-0" />}
                <div className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</div>
              </div>
              
              {/* Conditional Update Button for rawData */}
              {msg.rawData && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleUpdatePrice(msg.rawData)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="text-sm">🔄</span> ใช้ราคานี้อัปเดต Master List
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ถามราคาวัตถุดิบ..."
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl px-4 py-2 text-sm transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white p-2 rounded-xl transition-colors flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
