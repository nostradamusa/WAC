"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Edit, Settings, MoreHorizontal, CheckCircle2, Navigation, Plus } from "lucide-react";
import NewMessageSheet from "@/components/messages/NewMessageSheet";

const mockConversations = [
  {
    id: "1",
    name: "Arben Lleshi",
    avatar: "https://i.pravatar.cc/150?u=a",
    lastMessage: "Looking forward to the real estate workshop next week!",
    time: "10:42 AM",
    unread: 2,
    type: "direct",
  },
  {
    id: "4",
    name: "Real Estate Committee",
    avatar: null,
    images: ["https://i.pravatar.cc/150?u=q", "https://i.pravatar.cc/150?u=x", "https://i.pravatar.cc/150?u=z"],
    lastMessage: "Ilir: We should definitely coordinate that carpool.",
    time: "9:15 AM",
    unread: 3,
    type: "group",
  },
  {
    id: "2",
    name: "Albanian Professionals Network",
    avatar: null,
    lastMessage: "Thanks for reaching out about the mentorship program.",
    time: "Yesterday",
    unread: 0,
    type: "organization",
  },
  {
    id: "3",
    name: "Teuta Hoxha",
    avatar: "https://i.pravatar.cc/150?u=b",
    lastMessage: "Yes, the property in Tirana is still available.",
    time: "Tuesday",
    unread: 0,
    type: "direct",
    isRequest: true,
  },
];

export default function MessagesInboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "requests">("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  useEffect(() => {
    const handleNewMessageReq = () => setIsNewMessageOpen(true);
    window.addEventListener("wac-new-message", handleNewMessageReq);
    return () => window.removeEventListener("wac-new-message", handleNewMessageReq);
  }, []);

  return (
    <>
      {/* ── LEFT SIDEBAR: Conversations List ───────────────────────────────────── */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-[#0A0A0A] flex flex-col h-full pt-16 md:pt-16 relative z-10">
        
        {/* Header Area */}
        <div className="px-5 pt-6 pb-4 shrink-0 bg-gradient-to-b from-[#0A0A0A] to-transparent relative z-20">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-serif tracking-tight font-bold text-white drop-shadow-sm">
              Messages
            </h1>
            <div className="flex items-center gap-1.5">
               <Link href="/messages/settings" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/5 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all" title="Settings">
                  <Settings size={17} strokeWidth={1.8} />
               </Link>
            </div>
          </div>

          {/* Search Bar - Clean Premium Dark Pill */}
          <div className="mb-5 group px-1">
            <div className={`relative flex items-center bg-[#151515] rounded-full transition-all duration-300 ${searchFocused ? "border-[#b08d57]/30 border bg-[#1A1A1A] ring-1 ring-[#b08d57]/10" : "border border-white/[0.04] hover:bg-[#1A1A1A] hover:border-white/10"}`}>
              <div className={`pl-4 pr-3 transition-colors ${searchFocused ? "text-[#b08d57]" : "text-white/30 group-hover:text-white/50"}`}>
                <Search size={16} strokeWidth={2.5} />
              </div>
              <input 
                id="messages-search"
                type="text" 
                placeholder="Search conversations..." 
                className="w-full bg-transparent py-2.5 pr-4 text-[14.5px] font-medium text-white placeholder:text-white/30 outline-none"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

          {/* Underline Tabs Navigation */}
          <div className="flex items-center gap-6 border-b border-white/[0.06] relative">
            {(["all", "unread", "requests"] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[13px] font-semibold tracking-wide capitalize relative transition-colors ${
                  activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab}
                {tab === "requests" && mockConversations.filter(c => c.isRequest).length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-[#b08d57]/20 text-[#b08d57] text-[10px] font-bold leading-none border border-[#b08d57]/30">
                    {mockConversations.filter(c => c.isRequest).length}
                  </span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b08d57] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto wac-scrollbar pb-32 md:pb-6 px-2">
          {mockConversations.filter(chat => {
             if (activeTab === "unread") return chat.unread > 0;
             if (activeTab === "requests") return chat.isRequest;
             if (activeTab === "all") return !chat.isRequest; // Assuming requests don't show in "All" inbox until accepted
             return true;
          }).map((chat) => {
            const isUnread = chat.unread > 0;
            return (
              <Link 
                href={`/messages/${chat.id}`} 
                key={chat.id}
                className={`relative flex items-center gap-3.5 p-3 mx-1 mb-1 rounded-2xl transition-all duration-200 group
                  ${isUnread ? "bg-[#b08d57]/[0.03] hover:bg-[#b08d57]/[0.06]" : "bg-transparent hover:bg-white/[0.04]"}`}
              >
                {/* Subtle Unread Glow Indicator */}
                {isUnread && (
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b08d57] rounded-r-lg shadow-[0_0_8px_rgba(176,141,87,0.6)]" />
                )}

                {/* Avatar Composition */}
                <div className={`relative w-14 h-14 rounded-full shrink-0 flex items-center justify-center
                  ${chat.type === 'group' ? 'bg-transparent' : 'bg-[#1A1A1A] border border-white/10 overflow-hidden'}`}
                >
                  {chat.type === 'group' && chat.images ? (
                    <div className="w-full h-full relative">
                      <img src={chat.images[0]} className="w-[34px] h-[34px] rounded-full absolute top-0 right-0 border-[2.5px] border-[#0A0A0A] object-cover shadow-sm z-10" />
                      <img src={chat.images[1]} className="w-[34px] h-[34px] rounded-full absolute bottom-0 left-0 border-[2.5px] border-[#0A0A0A] object-cover shadow-sm z-20" />
                    </div>
                  ) : chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-[22px] font-serif tracking-tight font-bold ${isUnread ? "text-[#b08d57]" : "text-white/40"}`}>
                      {chat.name.charAt(0)}
                    </span>
                  )}
                  {chat.type === 'organization' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] bg-blue-500 rounded-full border-2 border-[#0A0A0A]" />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`text-[15px] truncate pr-2 tracking-tight ${isUnread ? "font-bold text-white drop-shadow-sm" : "font-semibold text-white/80"}`}>
                      {chat.name}
                    </h3>
                    <span className={`text-[11px] shrink-0 font-medium ${isUnread ? "text-[#b08d57]" : "text-white/30"}`}>
                      {chat.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[13px] truncate leading-tight ${isUnread ? "text-white/90 font-medium" : "text-white/40 font-normal"}`}>
                      {chat.lastMessage}
                    </p>
                    {isUnread && (
                      <span className="shrink-0 w-4 h-4 rounded-full bg-[#b08d57] text-black flex items-center justify-center text-[9px] font-extrabold pb-[0.5px]">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {mockConversations.filter(chat => {
             if (activeTab === "unread") return chat.unread > 0;
             if (activeTab === "requests") return chat.isRequest;
             if (activeTab === "all") return !chat.isRequest;
             return true;
          }).length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in">
                <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 size={24} className="text-white/20" />
                </div>
                <h3 className="text-[17px] font-serif font-bold text-white mb-1.5">No {activeTab} messages</h3>
                <p className="text-[14px] text-white/40">You're all caught up here.</p>
             </div>
          )}
        </div>
      </div>

      {/* ── RIGHT MAIN AREA: Premium Empty State ───────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col relative pt-16 md:pt-16 bg-[#070707] z-0 overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b08d57]/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
           <div className="relative mb-8 group">
             <div className="absolute inset-0 bg-[#b08d57]/10 rounded-full blur-xl scale-125 transition-transform duration-700 group-hover:scale-150" />
             <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1a1711] to-[#0A0A0A] flex items-center justify-center border border-[#b08d57]/20 shadow-2xl relative z-10">
               <Navigation size={42} strokeWidth={1} className="text-[#b08d57] opacity-80 -ml-1 mt-1" />
             </div>
           </div>
           
           <h2 className="text-3xl font-serif tracking-tight text-white mb-4 drop-shadow-sm">
             Your Network
           </h2>
           <p className="text-[15px] text-white/40 max-w-[340px] mx-auto mb-10 leading-relaxed font-normal">
             Send secure messages, coordinate with organizations, and grow your presence on the World Albanian Congress.
           </p>
           
           <button 
             onClick={() => setIsNewMessageOpen(true)}
             className="flex items-center gap-2.5 bg-white text-black hover:bg-gray-200 px-7 py-3.5 rounded-full text-[14px] font-bold transition-all shadow-lg active:scale-95">
             <Plus size={18} strokeWidth={2.5} />
             Start a Conversation
           </button>
        </div>
      </div>
      
      <NewMessageSheet isOpen={isNewMessageOpen} onClose={() => setIsNewMessageOpen(false)} />
    </>
  );
}
