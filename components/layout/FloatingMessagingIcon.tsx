"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Smile, Paperclip } from "lucide-react";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import { useEffect } from "react";

export default function FloatingMessagingIcon() {
  const pathname = usePathname();
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);
  const [miniChatInput, setMiniChatInput] = useState("");
  const [miniChatMessages, setMiniChatMessages] = useState<{id: number, text: string, sender: 'me' | 'other', reactions: string[]}[]>([
    { id: 1, text: "Are you still looking for a place near Tirana?", sender: "me", reactions: [] }
  ]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [reactingTo, setReactingTo] = useState<number | null>(null);

  useEffect(() => {
    const handleOpenMiniChat = ((e: CustomEvent) => {
      setIsMiniChatOpen(true);
      if (e.detail?.text) {
        setMiniChatInput(prev => prev + (prev ? " " : "") + e.detail.text);
      }
    }) as EventListener;
    
    window.addEventListener('open-mini-chat', handleOpenMiniChat);
    return () => window.removeEventListener('open-mini-chat', handleOpenMiniChat);
  }, []);

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '👏'];

  if (pathname?.startsWith("/messages")) {
    return null;
  }

  const unreadCount = 2;
  const isTyping = true; // Simulated for demonstration

  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-4">
       {/* Mini Chat Popover */}
       {isMiniChatOpen && (
          <div className="w-80 bg-[#111] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col origin-bottom-right animate-in slide-in-from-right-[100%] fade-in duration-700 ease-out fill-mode-forwards">
             {/* Header */}
             <div 
                className="p-3 bg-[rgba(255,255,255,0.02)] border-b border-[var(--border)] rounded-t-2xl flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsMiniChatOpen(false)}
                title="Minimize chat"
             >
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--accent)]/50 shrink-0">
                      <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold leading-tight">Teuta Hoxha</h4>
                      <p className="text-[10px] text-[var(--accent)] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span> Typing...</p>
                   </div>
                </div>
                <button className="text-white/50 hover:text-white transition p-1 rounded-full hover:bg-white/10">
                   <X size={16} />
                </button>
             </div>
             
             {/* Body */}
             <div className="px-6 py-4 h-64 overflow-y-auto overflow-x-hidden wac-scrollbar bg-[rgba(255,255,255,0.01)] flex flex-col gap-3">
                <div className="text-center text-[10px] text-white/40 uppercase font-bold tracking-widest my-2">Today</div>
                
                {miniChatMessages.map((msg) => (
                   <div key={msg.id} className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"} gap-2 group relative mb-2`}>
                      <div className="relative flex items-center gap-1">
                         <div 
                            className={`p-3 relative rounded-2xl text-sm max-w-[200px] shadow-sm ${
                               msg.sender === "me" 
                               ? "bg-[rgba(212,175,55,0.1)] border border-[#D4AF37]/30 text-white rounded-tr-sm" 
                               : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                            }`}
                         >
                            {msg.text}

                            {/* Render specific reactions and hover add button */}
                            <div className={`absolute -bottom-3 ${msg.sender === "me" ? "right-2" : "left-2"} flex gap-1 z-10 origin-bottom`}>
                               {(msg.reactions && msg.reactions.length > 0) ? (
                                  <div className="flex gap-1 bg-[#111] border border-[var(--border)] rounded-full px-1.5 py-1 shadow-md origin-bottom group-hover:pr-6 transition-all duration-300 relative">
                                     {msg.reactions.map((r, idx) => (
                                        <span key={idx} className="flex items-center justify-center">
                                          <ReactionIcon 
                                             type={r} 
                                             size={14} 
                                             animateOnClick={false} 
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setMiniChatMessages(prev => prev.map(m => {
                                                   if (m.id === msg.id) {
                                                      return { ...m, reactions: (m.reactions || []).filter(x => x !== r) };
                                                   }
                                                   return m;
                                                }));
                                             }}
                                          />
                                        </span>
                                     ))}
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); setReactingTo(msg.id); }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-[var(--accent)] hover:bg-white/10 rounded-full transition-opacity duration-200 opacity-0 group-hover:opacity-100" 
                                        title="React"
                                     >
                                        <Smile size={12} />
                                     </button>
                                  </div>
                               ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 bg-[#111] border border-[var(--border)] rounded-full shadow-md">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); setReactingTo(msg.id); }}
                                        className="p-1 text-white/40 hover:text-[var(--accent)] hover:bg-white/5 rounded-full transition" 
                                        title="React"
                                     >
                                        <Smile size={12} />
                                     </button>
                                  </div>
                               )}
                            </div>
                         </div>


                         {/* Inline Reaction Picker Overlay */}
                         {reactingTo === msg.id && (
                            <div className={`absolute top-full mt-2 ${msg.sender === "me" ? "right-0" : "left-0"} bg-[#111] border border-[var(--border)] rounded-full p-1 shadow-xl flex gap-1 z-50 animate-fade-in-up`}>
                               {SUPPORTED_REACTIONS.map(r => (
                                  <button 
                                     key={r.type} 
                                     onClick={() => {
                                        setMiniChatMessages(prev => prev.map(m => {
                                           if (m.id === msg.id) {
                                              const currentReactions = m.reactions || [];
                                              const hasReaction = currentReactions.includes(r.type);
                                              return { 
                                                 ...m, 
                                                 reactions: hasReaction ? [] : [r.type]
                                              };
                                           }
                                           return m;
                                        }));
                                        setReactingTo(null);
                                     }}
                                     className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-full transition"
                                     title={r.label}
                                  >
                                     <ReactionIcon type={r.type} size={16} animateOnClick={false} />
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                ))}

                {/* Typing Bubble */}
                {isTyping && (
                   <div className="self-start bg-white/5 border border-white/10 text-white rounded-2xl rounded-tl-sm p-3 max-w-[85%] flex items-center gap-1.5 h-10 w-16">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                )}
             </div>

             {/* Footer input */}
             <div className="p-3 bg-[rgba(255,255,255,0.02)] border-t border-[var(--border)] rounded-b-2xl relative">
                {isEmojiOpen && (
                   <div className="absolute bottom-full right-4 mb-2 bg-[#111] border border-[var(--border)] rounded-xl p-2 shadow-xl flex gap-1 z-50">
                      {commonEmojis.map(emoji => (
                         <button 
                            key={emoji} 
                            type="button" 
                            onClick={() => {
                               setMiniChatInput(prev => prev + emoji);
                               setIsEmojiOpen(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition text-lg"
                         >
                            {emoji}
                         </button>
                      ))}
                   </div>
                )}
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (miniChatInput.trim()) {
                      setMiniChatMessages([...miniChatMessages, {
                         id: Date.now(),
                         text: miniChatInput.trim(),
                         sender: 'me',
                         reactions: []
                      }]);
                      setMiniChatInput(''); 
                      setIsEmojiOpen(false);
                    }
                  }} 
                  className="relative flex items-center gap-2"
                >
                   <label className="text-white/40 hover:text-[var(--accent)] transition shrink-0 cursor-pointer" title="Attach file">
                      <input type="file" className="hidden" />
                      <Paperclip size={18} />
                   </label>
                   <div className="relative flex-1">
                      <input type="text" value={miniChatInput} onChange={(e) => setMiniChatInput(e.target.value)} placeholder="Type..." className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-16 text-sm outline-none focus:border-[var(--accent)] transition" />
                      <button type="button" onClick={() => setIsEmojiOpen(!isEmojiOpen)} className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-[var(--accent)] transition" title="Add emoji">
                         <Smile size={16} />
                      </button>
                      <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-full transition disabled:opacity-50" disabled={!miniChatInput.trim()}>
                         <Send size={14} />
                      </button>
                   </div>
                </form>
             </div>
          </div>
       )}

      {/* Main Floating Button & Indicator */}
      <div className="relative group">
         <Link
            href="/messages"
            className="flex items-center justify-center w-14 h-14 bg-[var(--accent)] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all duration-300 relative z-10"
            aria-label="Open Messages"
         >
            <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
            
            {unreadCount > 0 && !isMiniChatOpen && (
               <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 border-2 border-[var(--background)] text-[10px] font-bold text-white animate-bounce shadow-lg">
               {unreadCount}
               </span>
            )}
         </Link>

         {/* Typing Indicator Bubble (Triggers Mini Chat) */}
         {isTyping && !isMiniChatOpen && (
         <button 
            onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               setIsMiniChatOpen(true);
            }}
            className="absolute -top-14 -right-2 flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] p-1.5 pr-3 rounded-full shadow-2xl animate-fade-in-up origin-bottom-right scale-90 sm:scale-100 hover:scale-105 transition-transform z-20"
         >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--accent)]/50 shrink-0">
               <img src="https://i.pravatar.cc/150?img=11" alt="Typing" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-1 items-center opacity-70">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
         </button>
         )}

         {/* Tooltip on hover */}
         {!isMiniChatOpen && (
         <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#111] border border-white/10 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-0">
            Messages
            <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-[#111]"></div>
         </div>
         )}
      </div>
    </div>
  );
}
