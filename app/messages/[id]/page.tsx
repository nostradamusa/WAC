"use client";

import { MessageSquare, MoreVertical, Phone, Video, Info, Image as ImageIcon, FileText, Send, Smile, Paperclip, Check, CheckCheck, Sparkles, X } from "lucide-react";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import { use } from "react";
import Link from "next/link";
import { useState } from "react";

type ChatMessage = {
  id: number;
  sender: string;
  name?: string;
  text: string;
  time: string;
  avatar?: string;
  reactions?: string[];
};

const directChatHistory: ChatMessage[] = [
  { id: 1, sender: "other", name: "Arben Lleshi", text: "Hey! Did you see the new community hub feature?", time: "10:30 AM", avatar: "https://i.pravatar.cc/150?u=a", reactions: [] },
  { id: 2, sender: "me", text: "I did! It looks amazing. The new Pulse feed is exactly what we needed to stay connected.", time: "10:35 AM", reactions: ['🔥'] },
  { id: 3, sender: "other", name: "Arben Lleshi", text: "Looking forward to the real estate workshop next week! Will you be organizing a carpool from the Bronx?", time: "10:42 AM", avatar: "https://i.pravatar.cc/150?u=a", reactions: [] },
];

const groupChatHistory: ChatMessage[] = [
  { id: 1, sender: "other", name: "Teuta Hoxha", text: "Is anyone heading to the workshop from the Bronx?", time: "9:00 AM", avatar: "https://i.pravatar.cc/150?u=x", reactions: [] },
  { id: 2, sender: "other", name: "Ilir Meta", text: "We should definitely coordinate that carpool. I can drive.", time: "9:15 AM", avatar: "https://i.pravatar.cc/150?u=q", reactions: ['👍', '🚘'] },
  { id: 3, sender: "other", name: "Teuta Hoxha", text: "Perfect, thank you!", time: "9:18 AM", avatar: "https://i.pravatar.cc/150?u=x", reactions: ['❤️'] }
];

const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '👏'];

export default function ActiveChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const chatId = resolvedParams.id;
  const isGroup = chatId === "4";
  
  const [messages, setMessages] = useState(isGroup ? groupChatHistory : directChatHistory);
  const [inputText, setInputText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("none");
  const isConnected = connectionStatus === "connected";
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [reactingTo, setReactingTo] = useState<number | null>(null);

  const canMessage = isGroup || isConnected;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([...messages, {
      id: Date.now(),
      sender: "me",
      text: inputText,
      time: "Just now",
      name: "Me",
      avatar: ""
    }]);
    setInputText("");
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] relative h-full pt-16 md:pt-20">
      
      {/* Top Bar Navigation (Desktop & Mobile) */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="md:hidden p-2 -ml-2 text-white/60 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          
          {isGroup ? (
            <div className="w-10 h-10 shrink-0 flex items-center justify-center relative bg-transparent">
              <div className="w-full h-full relative">
                 <img src="https://i.pravatar.cc/150?u=q" className="w-7 h-7 rounded-full absolute top-0 right-0 border-2 border-[var(--background)] object-cover z-10" />
                 <img src="https://i.pravatar.cc/150?u=x" className="w-7 h-7 rounded-full absolute bottom-0 left-0 border-2 border-[var(--background)] object-cover z-20" />
              </div>
            </div>
          ) : (
             <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                <img src="https://i.pravatar.cc/150?u=a" alt="Avatar" className="w-full h-full object-cover" />
             </div>
          )}

          <div>
            <h2 className="font-bold text-sm tracking-wide">{isGroup ? "Real Estate Committee" : "Arben Lleshi"}</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              {isGroup ? (
                 <span className="text-white/50">3 Members</span>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Online
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button className="p-2 text-white/60 hover:text-[var(--accent)] transition rounded-full hover:bg-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
           </button>
        </div>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 wac-scrollbar bg-[rgba(255,255,255,0.01)]">
        <div className="text-center py-6">
           {isGroup ? (
              <>
                 <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 </div>
                 <h3 className="font-serif text-xl tracking-tight mb-1">Real Estate Committee</h3>
                 <p className="opacity-60 text-sm mb-4">You created this group chat on Jan 14, 2026.</p>
              </>
           ) : (
              <>
                 <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-[var(--border)]"><img src="https://i.pravatar.cc/150?u=a" alt="Avatar" className="w-full h-full object-cover"/></div>
                 <h3 className="font-serif text-xl tracking-tight mb-1">Arben Lleshi</h3>
                 <p className="opacity-60 text-sm mb-4">You are connected on WAC and both members of Albanian Professionals Network.</p>
                 <Link href="/people/arbenll" className="wac-button-secondary py-1 px-4 text-xs font-bold w-auto inline-block">View Profile</Link>
              </>
           )}
        </div>
        
        <div className="border-b border-white/10 w-full relative h-[1px] my-8">
           <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] px-4 text-[10px] uppercase font-bold tracking-widest text-[var(--accent)] opacity-80">Today</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"} gap-3 group relative mb-2`}>
            {msg.sender === "other" && isGroup && msg.avatar && (
               <img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full shrink-0 border border-white/10 mt-1" />
            )}
            <div className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"} max-w-[80%]`}>
               {msg.sender === "other" && isGroup && msg.name && (
                  <span className="text-xs font-bold text-white/50 mb-1 ml-1">{msg.name}</span>
               )}
               
               <div className="relative flex items-center gap-2">
                  <div 
                     className={`p-3 md:p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm relative ${
                       msg.sender === "me" 
                         ? "bg-[rgba(212,175,55,0.1)] border border-[#D4AF37]/30 text-white rounded-tr-sm" 
                         : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                     }`}
                  >
                    {msg.text}

                    {/* Render specific reactions and hover add button */}
                    <div className={`absolute -bottom-3 ${msg.sender === "me" ? "right-2" : "left-2"} flex gap-1 z-10 origin-bottom`}>
                       {(msg.reactions && msg.reactions.length > 0) ? (
                          <div className="flex gap-1 bg-[#111] border border-[var(--border)] rounded-full px-2 py-1 shadow-md origin-bottom group-hover:pr-7 transition-all duration-300 relative">
                             {msg.reactions.map((r, idx) => (
                                <span key={idx} className="flex items-center justify-center">
                                   <ReactionIcon 
                                      type={r} 
                                      size={14} 
                                      animateOnClick={false} 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setMessages(prev => prev.map(m => {
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
                     <div className={`absolute top-full mt-3 ${msg.sender === "me" ? "right-0" : "left-0"} bg-[#111] border border-[var(--border)] rounded-full p-1 shadow-xl flex gap-1 z-50 animate-fade-in-up`}>
                        {SUPPORTED_REACTIONS.map(r => (
                           <button 
                              key={r.type} 
                              onClick={() => {
                                 setMessages(prev => prev.map(m => {
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
                              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition"
                           >
                              <ReactionIcon type={r.type} size={18} animateOnClick={false} />
                           </button>
                        ))}
                     </div>
                  )}
               </div>
               
               <span className="text-[10px] opacity-40 mt-1 px-1 font-medium">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10 shrink-0 relative">
         
         {/* AI Smart Replies (Only if connected) */}
         {isConnected && (
            <div className="absolute -top-14 left-0 w-full px-4 flex gap-2 overflow-x-auto wac-scrollbar pb-2">
               <button 
                  onClick={() => setInputText("I'd love to organize a carpool. Let's coordinate!")}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgba(212,175,55,0.08)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold hover:bg-[var(--accent)] hover:text-black transition-all shadow-[0_4px_12px_rgba(212,175,55,0.15)]"
               >
                  <Sparkles size={12} />
                  Sure, let's coordinate.
               </button>
               <button 
                  onClick={() => setInputText("I won't be able to carpool this time, but I'll see you there!")}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-[rgba(212,175,55,0.08)] border border-[var(--accent)]/30 text-[var(--accent)] text-xs font-bold hover:bg-[var(--accent)] hover:text-black transition-all shadow-[0_4px_12px_rgba(212,175,55,0.15)]"
               >
                  <Sparkles size={12} />
                  I can't carpool, sorry.
               </button>
            </div>
         )}

         {isConnected ? (
            <>
               <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
                  <label className="p-3 text-white/40 hover:text-[var(--accent)] cursor-pointer transition mb-1 disabled:opacity-50">
                     <input type="file" className="hidden" />
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </label>
                  <div className="flex-1 relative">
                     {isEmojiOpen && (
                        <div className="absolute bottom-full right-1 mb-2 bg-[#111] border border-[var(--border)] rounded-xl p-2 shadow-xl flex gap-1 z-50">
                           {commonEmojis.map(emoji => (
                              <button 
                                 key={emoji} 
                                 type="button" 
                                 onClick={() => {
                                    setInputText(prev => prev + emoji);
                                    setIsEmojiOpen(false);
                                 }}
                                 className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition text-lg"
                              >
                                 {emoji}
                              </button>
                           ))}
                        </div>
                     )}
                     <div className="absolute right-3 top-2 flex items-center gap-1 z-10 transition-opacity">
                        <button 
                           type="button" 
                           onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                           className="p-1.5 text-white/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors group relative"
                           title="Add emoji"
                        >
                           <Smile size={16} />
                        </button>
                        <button 
                           type="button" 
                           className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/20 rounded-lg transition-colors group relative"
                           title="Draft with AI Copilot"
                        >
                           <Sparkles size={16} />
                           <span className="absolute bottom-full mb-2 right-0 w-max px-2 py-1 bg-[#111] border border-[var(--accent)]/30 text-[10px] text-[var(--accent)] font-bold rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
                              Draft with AI
                           </span>
                        </button>
                     </div>
                     
                     <textarea 
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message or use AI to draft..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-12 text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all resize-none max-h-32 min-h-[46px] wac-scrollbar break-words placeholder:opacity-50"
                        style={{ fieldSizing: "content" } as any}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend(e);
                           }
                        }}
                     />
                     <button type="button" className="absolute right-10 bottom-2.5 text-white/40 hover:text-[var(--accent)] transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 10 10 0 0 0-10-10zm0 14a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm1-5a1 1 0 1 1-1-1 1 1 0 0 1 1 1h-1"/></svg>
                     </button>
                  </div>
                  <button 
                     type="submit" 
                     disabled={!inputText.trim()}
                     className={`p-3 rounded-xl mb-1 flex items-center justify-center transition ${inputText.trim() ? "bg-[var(--accent)] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "bg-white/5 text-white/30 cursor-not-allowed"}`}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
               </form>
               <div className="text-center mt-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] opacity-30 font-medium">Press Enter to send. Shift + Enter for a new line.</span>
               </div>
            </>
         ) : (
            <div className="max-w-md mx-auto text-center py-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-white/40"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               <p className="text-sm font-medium mb-1">
                 {connectionStatus === "pending" ? "Request Sent" : "Messaging is locked"}
               </p>
               <p className="text-xs text-white/50 mb-4 px-6">
                 {connectionStatus === "pending" 
                   ? "Your connection request has been sent. You will be able to message Arben once they accept." 
                   : "You need to be connected with Arben to send direct messages. Send a connection request to start chatting."}
               </p>
               {connectionStatus === "none" ? (
                 <div className="w-full px-6 flex flex-col gap-3">
                    <textarea 
                       placeholder="Add a note to introduce yourself..." 
                       rows={2}
                       className="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-2 px-3 text-xs focus:border-[var(--accent)] outline-none resize-none placeholder:text-white/30 text-white/90"
                    ></textarea>
                    <button 
                       onClick={() => setConnectionStatus("pending")} 
                       className="bg-[var(--accent)] text-black font-bold py-2.5 px-6 text-sm rounded-full hover:bg-[var(--accent)]/90 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all mx-auto w-max inline-block mt-2"
                    >
                       Send Connection Request
                    </button>
                 </div>
               ) : (
                 <button disabled className="bg-white/5 border border-white/10 text-white py-2.5 px-6 text-sm mx-auto flex items-center justify-center opacity-50 cursor-not-allowed rounded-full">
                    Pending Acceptance...
                 </button>
               )}
               {/* Quick dev toggle to simulate acceptance */}
               {connectionStatus === "pending" && (
                 <button onClick={() => setConnectionStatus("connected")} className="text-[10px] text-white/20 hover:text-white/50 mt-4 underline">
                    (Simulate Acceptance)
                 </button>
               )}
            </div>
         )}
      </div>
    </div>
  );
}
