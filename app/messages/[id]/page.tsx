"use client";

import { MessageSquare, MoreVertical, Phone, Video, Info, Image as ImageIcon, FileText, Send, Smile, Paperclip, Check, CheckCheck, Sparkles, X } from "lucide-react";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import { use } from "react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  id: number;
  sender: string;
  name?: string;
  text: string;
  time: string;
  avatar?: string;
  reactions?: string[];
  mediaUrl?: string;
  mediaType?: "image" | "video" | null;
  status?: "sent" | "delivered" | "read";
};

const directChatHistory: ChatMessage[] = [
  { id: 1, sender: "other", name: "Arben Lleshi", text: "Hey! Did you see the new community hub feature?", time: "10:30 AM", avatar: "https://i.pravatar.cc/150?u=a", reactions: [] },
  { id: 2, sender: "me", text: "I did! It looks amazing. The new Pulse feed is exactly what we needed to stay connected.", time: "10:35 AM", reactions: ['🔥'], status: "read" },
  { id: 3, sender: "other", name: "Arben Lleshi", text: "Looking forward to the real estate workshop next week! Will you be organizing a carpool from the Bronx?", time: "10:42 AM", avatar: "https://i.pravatar.cc/150?u=a", reactions: [] },
];

const groupChatHistory: ChatMessage[] = [
  { id: 1, sender: "other", name: "Teuta Hoxha", text: "Is anyone heading to the workshop from the Bronx?", time: "9:00 AM", avatar: "https://i.pravatar.cc/150?u=x", reactions: [] },
  { id: 2, sender: "other", name: "Ilir Meta", text: "We should definitely coordinate that carpool. I can drive.", time: "9:15 AM", avatar: "https://i.pravatar.cc/150?u=q", reactions: ['👍'] },
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
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("connected");
  const isConnected = connectionStatus === "connected";

  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [reactingTo, setReactingTo] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Guaranteed instant scroll to bottom on layout shift or new message
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isEmojiOpen]);

  // Simulate read receipts for newly sent messages
  useEffect(() => {
    const unreadMessages = messages.filter(m => m.sender === "me" && m.status === "sent");
    if (unreadMessages.length === 0) return;

    const timer = setTimeout(() => {
      setMessages(prev => prev.map(m => m.sender === "me" && m.status === "sent" ? { ...m, status: "read" } : m));
    }, 1500);
    return () => clearTimeout(timer);
  }, [messages]);

  const canMessage = isGroup || isConnected;

  const handleReact = (msgId: number, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reactions = m.reactions || [];
        return { 
          ...m, 
          reactions: reactions.includes(emoji) 
            ? [] 
            : [emoji] 
        };
      }
      return m;
    }));
    setReactingTo(null);
  };


  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    let mediaUrl: string | undefined = undefined;
    let mediaType: 'image' | 'video' | null = null;
    let textToSend = inputText.trim();

    if (selectedFile) {
      mediaUrl = URL.createObjectURL(selectedFile);
      if (selectedFile.type.startsWith('video/')) mediaType = 'video';
      else mediaType = 'image'; 
    }

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: "me",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name: "Me",
      mediaUrl,
      mediaType,
      status: "sent"
    }]);
    
    setInputText("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#161513] relative h-full font-sans text-white/90">
      
      {/* ── Top Bar Navigation ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-[#0A0A0A] border-b border-white/5 relative z-20">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <Link href="/messages" className="p-2 -ml-2 text-white/60 hover:text-white transition rounded-full hover:bg-white/5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>

          {/* Contact Profile Info */}
          <Link href="/profile" className="flex items-center gap-3 group">
             <div className="w-10 h-10 rounded-full border border-white/10 shrink-0 overflow-hidden relative shadow-sm">
                <img src="https://i.pravatar.cc/150?u=a" alt="Arben Lleshi" className="w-full h-full object-cover grayscale opacity-90 transition-transform group-hover:scale-110" />
             </div>
             <div className="flex flex-col">
                <span className="font-bold text-sm text-white group-hover:text-[#b08d57] transition-colors">Arben Lleshi</span>
                <span className="text-[11px] font-medium text-emerald-500/80 flex items-center gap-1.5 mt-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.3)]"></span>
                   Active now
                </span>
             </div>
          </Link>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
           <button className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
           </button>
        </div>
      </div>

      {/* ── Chat History Form ────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto wac-scrollbar pb-6 px-4 md:px-8">
        
        {/* Header Profile Info */}
        <div className="flex flex-col items-center justify-center py-10 max-w-lg mx-auto text-center border-b border-white/[0.05] mb-8">
           <div className="w-[72px] h-[72px] rounded-full overflow-hidden mb-4 border border-white/20 shadow-lg">
             <img src="https://i.pravatar.cc/150?u=a" alt="Avatar" className="w-full h-full object-cover grayscale opacity-80" />
           </div>
           
           <h2 className="text-[22px] font-serif font-bold text-white mb-2">Arben Lleshi</h2>
           <p className="text-[14px] text-white/50 leading-relaxed mb-6 font-medium">
             You are connected on WAC and both members of Albanian Professionals Network.
           </p>
           
           <button className="px-6 py-2 rounded-full border border-white/10 bg-[#1A1A1A] text-[13px] font-bold hover:bg-white/5 hover:border-white/20 transition-all text-white/90">
             View Profile
           </button>
        </div>
        
        {/* Today Divider */}
        <div className="flex items-center justify-center mb-10">
           <span className="text-[10px] font-black tracking-[0.15em] text-[#b08d57] uppercase">Today</span>
        </div>

        <div className="flex flex-col space-y-7 max-w-4xl mx-auto">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === "me";
            return (
              <div key={msg.id} className={`flex flex-col relative group ${isMe ? "items-end" : "items-start"}`}>
                
                <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} relative`}>
                  {/* Bubble */}
                  <div 
                    onClick={() => setReactingTo(reactingTo === msg.id ? null : msg.id)}
                    className={`relative px-5 py-3.5 max-w-[85%] md:max-w-xs lg:max-w-md cursor-pointer text-[14.5px] leading-relaxed transition-opacity hover:opacity-90 flex flex-col gap-2.5
                      ${isMe 
                        ? "bg-[#2A2113] border border-[#b08d57]/20 text-white/95 rounded-[20px] rounded-tr-sm" 
                        : "bg-[#252525] border border-white/[0.05] text-white/90 rounded-[20px] rounded-tl-sm"}`}
                  >
                    {/* Media Attachment */}
                    {msg.mediaUrl && (
                       <div 
                          className="relative rounded-xl overflow-hidden cursor-zoom-in group/media max-h-[250px] bg-black/40 border border-white/5"
                          onClick={(e) => {
                             e.stopPropagation();
                             setFullScreenMedia({ url: msg.mediaUrl!, type: msg.mediaType || 'image' });
                          }}
                       >
                         <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors pointer-events-none z-10" />
                         {msg.mediaType === 'video' ? (
                            <video src={msg.mediaUrl} className="w-full h-full object-cover" />
                         ) : (
                            <img src={msg.mediaUrl} alt="Attachment" className="w-full h-full object-cover" />
                         )}
                       </div>
                    )}
                    
                    {msg.text && <div>{msg.text}</div>}
                    
                    {/* Render existing reactions if any */}
                    {msg.reactions && msg.reactions.length > 0 && (
                       <div className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} flex gap-1 z-10`}>
                          {msg.reactions.map((r, i) => (
                             <div key={i} className="w-7 h-7 bg-[#1A1A1A] border-[1.5px] border-[#2A2113] rounded-full flex items-center justify-center text-[13px] shadow-sm">
                                {r}
                             </div>
                          ))}
                       </div>
                    )}
                  </div>

                  {/* Hover Actions (Desktop) or active state (Mobile) */}
                  <div className={`opacity-0 md:group-hover:opacity-100 ${reactingTo === msg.id ? "opacity-100" : ""} transition-opacity flex items-center gap-1 relative z-20`}>
                     <button 
                       onClick={() => setReactingTo(reactingTo === msg.id ? null : msg.id)} 
                       className={`p-1.5 rounded-full transition-colors ${reactingTo === msg.id ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/10"}`}
                     >
                        <Smile size={16} strokeWidth={2} />
                     </button>
                     
                     {/* Reaction Picker Overlay */}
                     {reactingTo === msg.id && (
                        <div className={`absolute bottom-[130%] ${isMe ? 'left-0' : 'right-0'} bg-[#222] border border-white/10 rounded-full py-1.5 px-3 flex gap-2.5 shadow-xl z-50 animate-in fade-in zoom-in-95`}>
                           {commonEmojis.map(emoji => (
                              <button 
                                 key={emoji} 
                                 onClick={() => handleReact(msg.id, emoji)}
                                 className="hover:scale-125 transition-transform text-[18px]"
                              >
                                 {emoji}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
                </div>
                
                {/* Time & Read Receipts Below */}
                <span className={`text-[10px] mt-1.5 font-medium px-1 flex items-center gap-1 ${isMe ? "justify-end text-white/50" : "justify-start text-white/40"}`}>
                  {msg.time}
                  {isMe && msg.status && (
                    <span className="flex items-center ml-0.5">
                      {msg.status === 'sent' && <Check size={12} className="text-white/30" />}
                      {msg.status === 'delivered' && <CheckCheck size={12} className="text-white/40" />}
                      {msg.status === 'read' && <CheckCheck size={12} className="text-[#0ea5e9]" />}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Input Area ───────────────────────────────────────────────────────── */}
      <div className="px-3 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-5 pt-3 shrink-0 bg-[#0A0A0A]/95 backdrop-blur-md relative z-10 transition-all border-t border-white/[0.03]">
         
         <div className="max-w-4xl mx-auto">

            {/* Main Input Row */}
            <div className="flex items-end gap-2.5">
               {/* Paperclip */}
               <label className="p-2.5 mb-1 text-white/40 hover:text-white cursor-pointer transition shrink-0 relative hover:bg-white/5 rounded-full">
                  <input type="file" className="hidden" onChange={handleFileChange} />
                  <Paperclip size={20} strokeWidth={2} />
                  {selectedFile && (
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#b08d57] rounded-full border-2 border-[#0A0A0A]" />
                  )}
               </label>
               
               {/* Central Pill Input */}
               <div className="flex-1 min-w-0 bg-[#1A1A1A] border border-white/5 rounded-[20px] relative flex items-end focus-within:border-[#b08d57]/40 focus-within:bg-[#1E1E1E] transition-all shadow-sm">
                  <textarea 
                     rows={1}
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Message..."
                     className="w-full bg-transparent py-3 pl-4 pr-[44px] text-[14.5px] outline-none resize-none max-h-[120px] min-h-[44px] wac-scrollbar placeholder:text-white/30"
                     style={{ fieldSizing: "content" } as any}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleSend();
                        }
                     }}
                  />
                  
                  {/* Inner Action Buttons (Emoji) */}
                  <div className="absolute right-1.5 top-1.5 bottom-1.5 flex flex-col justify-end items-center py-0.5">
                    <div className="flex gap-1">
                       <button type="button" onClick={() => setIsEmojiOpen(!isEmojiOpen)} className="p-1.5 text-white/30 hover:text-white transition group relative focus:outline-none rounded-full hover:bg-white/5">
                          <Smile size={18} className="hover:scale-110 transition-transform" />
                          {isEmojiOpen && (
                             <div className="absolute bottom-[130%] right-0 bg-[#222] border border-white/10 rounded-lg p-2 flex gap-1 shadow-xl z-50 animate-in fade-in zoom-in-95">
                                {commonEmojis.map(emoji => (
                                   <div 
                                      key={emoji} 
                                      onClick={(e) => {
                                         e.stopPropagation();
                                         setInputText(prev => prev + emoji);
                                         setIsEmojiOpen(false);
                                      }}
                                      className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded cursor-pointer text-xl"
                                   >
                                      {emoji}
                                   </div>
                                ))}
                             </div>
                          )}
                       </button>
                    </div>
                  </div>
               </div>
               
               {/* Send Button Square */}
               <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() && !selectedFile}
                  className={`w-11 h-11 rounded-[18px] mb-0.5 shrink-0 flex items-center justify-center transition-all shadow-sm ${
                     (inputText.trim() || selectedFile) ? "bg-[#b08d57] text-[#151311] hover:bg-[#9a7545] hover:scale-105" : "bg-[#1A1A1A] text-white/20 cursor-not-allowed border border-white/5"
                  }`}
               >
                  <Send size={18} strokeWidth={2.5} className="ml-0.5" />
               </button>
            </div>
         </div>
      </div>

      {/* Full Screen Media Modal */}
      {fullScreenMedia && (
         <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
            onClick={() => setFullScreenMedia(null)}
         >
            <button className="absolute top-6 right-6 p-3 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors z-[110]">
               <X size={24} />
            </button>
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
               {fullScreenMedia.type === 'video' ? (
                  <video src={fullScreenMedia.url} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md" controls autoPlay />
               ) : (
                  <img src={fullScreenMedia.url} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md" alt="Full screen media" />
               )}
            </div>
         </div>
      )}

    </div>
  );
}
