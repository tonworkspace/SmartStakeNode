
// import React, { useState, useRef, useEffect } from 'react';
// import { GoogleGenAI } from "@google/genai";
// import { X, Send, Bot, Sparkles } from 'lucide-react';

// interface AIChatProps {
//   stakedAmount: number;
//   isTabMode?: boolean;
// }

// export const AIChat: React.FC<AIChatProps> = ({ stakedAmount, isTabMode = false }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
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
//       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
//       const response = await ai.models.generateContent({
//         model: 'gemini-3-flash-preview',
//         contents: [
//             {
//                 role: 'user',
//                 parts: [{ text: `
//                     The following is a conversation with an AI Staking Advisor for the Smart Stake AI app on the TON blockchain.
//                     Context: The user currently has ${stakedAmount} TON staked. The network APY is 15%.
//                     The tokens being mined are called SMART.
                    
//                     User says: ${userMsg}
//                 `}]
//             }
//         ],
//         config: {
//           systemInstruction: "You are a friendly, helpful AI expert on TON blockchain and DeFi. Keep your responses concise, professional, and encouraging. Focus on helping the user understand staking and the benefits of the Smart AI network. Note that the current network APY is 15%.",
//           temperature: 0.7,
//         },
//       });

//       setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't process that right now." }]);
//     } catch (error) {
//       setMessages(prev => [...prev, { role: 'assistant', content: "Oops! My connection was interrupted. Please try again later." }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const ChatContent = (
//     <div className={`flex flex-col overflow-hidden h-full ${isTabMode ? '' : 'max-w-md mx-auto h-[70vh] bg-white dark:bg-slate-900 rounded-t-[40px] shadow-2xl border-t border-slate-100 dark:border-white/5'}`}>
//       <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none border dark:border-white/10">
//             <Bot size={20} />
//           </div>
//           <div>
//             <h4 className="font-black text-slate-900 dark:text-white text-sm leading-none">Smart Advisor</h4>
//             <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mt-1">Gemini AI Engine</p>
//           </div>
//         </div>
//         {!isTabMode && (
//           <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-white transition-colors">
//             <X size={24} />
//           </button>
//         )}
//       </div>

//       <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-slate-950/20">
//         {messages.map((m, i) => (
//           <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
//             <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
//               m.role === 'user' 
//               ? 'bg-slate-900 dark:bg-green-500 text-white dark:text-slate-950 rounded-tr-none font-medium' 
//               : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none'
//             }`}>
//               {m.content}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="flex justify-start">
//             <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-4 rounded-3xl rounded-tl-none flex gap-1">
//               <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" />
//               <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce delay-150" />
//               <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce delay-300" />
//             </div>
//           </div>
//         )}
//       </div>

//       <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 shrink-0">
//         <div className="flex gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-[24px] border border-slate-100 dark:border-white/10 focus-within:border-slate-300 dark:focus-within:border-green-500/50 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all">
//           <input 
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && handleSend()}
//             placeholder="Ask anything..."
//             className="flex-1 bg-transparent px-4 py-2 text-sm outline-none dark:text-white"
//           />
//           <button 
//             onClick={handleSend}
//             disabled={isLoading}
//             className="w-10 h-10 bg-slate-900 dark:bg-green-500 text-white dark:text-slate-900 rounded-[18px] flex items-center justify-center hover:bg-slate-800 dark:hover:bg-green-400 disabled:opacity-50 transition-all active:scale-90"
//           >
//             <Send size={18} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   if (isTabMode) {
//     return (
//       <div className="flex flex-col h-[calc(100vh-180px)] animate-in slide-in-from-right duration-500">
//         <div className="space-y-1 mb-6">
//           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Advisor</h2>
//           <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Personalized staking insights</p>
//         </div>
//         <div className="flex-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
//           {ChatContent}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <button 
//         onClick={() => setIsOpen(true)}
//         className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 dark:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group border dark:border-white/10"
//       >
//         <div className="absolute inset-0 rounded-full bg-slate-900 dark:bg-slate-800 animate-ping opacity-20 group-hover:hidden" />
//         <Bot size={28} />
//         <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
//             <Sparkles size={10} />
//         </div>
//       </button>

//       <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
//         {ChatContent}
//       </div>
//     </>
//   );
// };
