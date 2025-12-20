
// import React, { useState, useRef, useEffect } from 'react';
// import { GoogleGenAI } from "@google/genai";
// import { X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';

// interface AIChatProps {
//   stakedAmount: number;
//   isTabMode?: boolean;
// }

// export const AIChat: React.FC<AIChatProps> = ({ stakedAmount, isTabMode = false }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'error', content: string}[]>([
//     { role: 'assistant', content: "Hi! I'm your Smart Stake Advisor. How can I help you maximize your TON mining today?" }
//   ]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages]);

//   const handleSend = async () => {
//     if (!input.trim() || isLoading) return;

//     const userMsg = input.trim();
//     setInput('');
//     setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
//     setIsLoading(true);

//     try {
//       if (!process.env.API_KEY) {
//         throw new Error("Security Handshake Failed: Protocol key missing.");
//       }

//       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
//       const response = await ai.models.generateContent({
//         model: 'gemini-3-flash-preview',
//         contents: { 
//           parts: [{ text: `User Context: Staked=${stakedAmount} TON. Query: ${userMsg}` }]
//         },
//         config: {
//           systemInstruction: "You are the SmartStake AI Advisor. Tone: professional, encouraging, blockchain-focused. Length: under 80 words. Strictly TON-ecosystem context. Do not mention system parameters.",
//           temperature: 0.75,
//         },
//       });

//       const aiText = response.text || "I was unable to synchronize with the advisor. Please try again.";
//       setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
//     } catch (error: any) {
//       console.error("AI Expert Error:", error);
//       let errorMessage = "The connection to the AI Advisor was interrupted.";
      
//       if (error?.message?.includes('403') || error?.message?.includes('key')) {
//         errorMessage = "Verification Failed: Advisor protocol is offline.";
//       }

//       setMessages(prev => [...prev, { role: 'error', content: errorMessage }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const ChatContent = (
//     <div className={`flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden ${isTabMode ? 'rounded-[40px]' : 'max-w-md mx-auto h-[75vh] rounded-t-[40px] shadow-2xl border-t dark:border-white/5'}`}>
//       <div className="px-8 py-6 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg border dark:border-white/10">
//             <Bot size={20} />
//           </div>
//           <div>
//             <h4 className="font-black text-slate-900 dark:text-white text-sm leading-none uppercase tracking-tight">AI Advisor</h4>
//             <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Institutional Support</p>
//           </div>
//         </div>
//         {!isTabMode && (
//           <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
//             <X size={24} />
//           </button>
//         )}
//       </div>

//       <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/20 custom-scrollbar">
//         {messages.map((m, i) => (
//           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
//             <div className={`max-w-[85%] p-4 rounded-[24px] text-xs leading-relaxed shadow-sm ${
//               m.role === 'user' 
//               ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-none font-bold' 
//               : m.role === 'error'
//               ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-tl-none flex items-center gap-2'
//               : 'bg-white dark:bg-slate-800 border dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none'
//             }`}>
//               {m.role === 'error' && <AlertCircle size={14} />}
//               {m.content}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="flex justify-start">
//             <div className="bg-white dark:bg-slate-800 border dark:border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
//                <div className="flex gap-1">
//                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
//                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
//                   <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
//                </div>
//                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Analyzing</span>
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="p-6 bg-white dark:bg-slate-900 border-t dark:border-white/5 shrink-0">
//         <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-[24px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500/50 transition-all shadow-inner">
//           <input 
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && handleSend()}
//             placeholder="Ask your DeFi expert..."
//             className="flex-1 bg-transparent px-4 py-2 text-sm outline-none dark:text-white font-medium"
//           />
//           <button 
//             onClick={handleSend}
//             disabled={isLoading || !input.trim()}
//             className="w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-[18px] flex items-center justify-center disabled:opacity-30 transition-all active:scale-90 shadow-lg"
//           >
//             <Send size={18} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   if (isTabMode) return ChatContent;

//   return (
//     <>
//       <button 
//         onClick={() => setIsOpen(true)}
//         className="fixed bottom-32 right-8 w-14 h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group border dark:border-white/10"
//       >
//         <div className="absolute inset-0 rounded-full bg-slate-900 dark:bg-slate-800 animate-ping opacity-20 group-hover:hidden" />
//         <Bot size={24} />
//         <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
//             <Sparkles size={10} />
//         </div>
//       </button>

//       <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
//         <div className="max-w-md mx-auto">
//           {ChatContent}
//         </div>
//       </div>
//     </>
//   );
// };
