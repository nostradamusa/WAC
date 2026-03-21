"use client";

import { useState } from "react";
import Link from "next/link";

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
  },
];

export default function MessagesInboxPage() {
  const [activeTab, setActiveTab] = useState<"focused" | "other">("focused");

  return (
    <>
      {/* LEFT SIDEBAR: Conversations List */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/10 bg-[var(--background)] flex flex-col h-full pt-16 md:pt-20">
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-serif tracking-tight font-bold">
              Messages
            </h1>
            <div className="flex items-center gap-3">
               <button className="text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-full transition">
                  Mark all read
               </button>
               <button className="text-white/50 hover:text-white transition p-1.5 rounded-full hover:bg-white/5" title="Settings">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
               </button>
            </div>
          </div>

          <div className="relative mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              id="messages-search"
              name="messages-search"
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <div className="flex gap-2 shrink-0">
             <button 
               onClick={() => setActiveTab("focused")}
               className={`flex-1 py-1.5 text-xs font-bold rounded-full transition ${activeTab === "focused" ? "bg-white/10 text-white" : "bg-transparent text-white/50 hover:bg-white/5"}`}
             >
               All
             </button>
             <button 
               onClick={() => setActiveTab("other")}
               className={`flex-1 py-1.5 text-xs font-bold rounded-full transition ${activeTab === "other" ? "bg-white/10 text-white" : "bg-transparent text-white/50 hover:bg-white/5"}`}
             >
               Unread
             </button>
             <button 
               className="flex-1 py-1.5 text-xs font-bold rounded-full bg-transparent text-white/50 hover:bg-white/5 transition flex justify-center items-center gap-1"
             >
               Requests
               <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[9px] border border-red-500/30">1</span>
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto wac-scrollbar pb-32 md:pb-6">
          {mockConversations.map((chat) => (
            <Link 
              href={`/messages/${chat.id}`} 
              key={chat.id}
              className="flex items-start gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition block"
            >
              <div className={`w-12 h-12 rounded-full shrink-0 border border-white/10 flex items-center justify-center relative ${chat.type === 'group' ? 'bg-transparent' : 'bg-white/5 overflow-hidden'}`}>
                {chat.type === 'group' && chat.images ? (
                   <div className="w-full h-full relative">
                      <img src={chat.images[0]} className="w-8 h-8 rounded-full absolute top-0 right-0 border-2 border-[var(--background)] object-cover z-10" />
                      <img src={chat.images[1]} className="w-8 h-8 rounded-full absolute bottom-0 left-0 border-2 border-[var(--background)] object-cover z-20" />
                   </div>
                ) : chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-[var(--accent)]">{chat.name.charAt(0)}</span>
                )}
                {chat.type === 'organization' && (
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border border-[var(--background)]"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-sm truncate pr-2">{chat.name}</h3>
                  <span className="text-xs opacity-50 shrink-0">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? "text-white font-medium" : "opacity-60"}`}>
                  {chat.lastMessage}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold flex items-center justify-center shrink-0 mt-4">
                  {chat.unread}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA: Empty State / Chat Frame */}
      <div className="hidden md:flex flex-1 flex-col bg-[var(--background)] relative pt-24 md:pt-32 mt-16 md:mt-20">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pb-20">
           <div className="w-24 h-24 rounded-full bg-[rgba(176,141,87,0.05)] flex items-center justify-center border border-[var(--accent)]/30 mb-6 drop-shadow-2xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
           </div>
           <h2 className="text-3xl font-serif tracking-tight mb-3">Your Conversations</h2>
           <p className="opacity-60 max-w-md mx-auto mb-8 text-sm">
             Send private messages, network with professionals, and reach out to organizations securely on the World Albanian Congress platform.
           </p>
           <button className="wac-button-primary px-8 py-2.5 text-sm font-bold">
             Start a New Message
           </button>
        </div>
      </div>
    </>
  );
}
