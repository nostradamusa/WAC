"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { 
  ChevronUp, ChevronDown, MoreHorizontal, X, Search, 
  Send, Smile, Paperclip, Filter, MessageCirclePlus, Users, Settings, BellOff 
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { supabase } from "@/lib/supabase";
import { getUserConversations, ConversationOverview } from "@/lib/services/messagingService";
import { useActor } from "@/components/providers/ActorProvider";

// Helper for formatting time (e.g. "Mar 11" or "1:00 PM")
function formatMsgTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}



export default function FloatingMessagingIcon() {
  const pathname = usePathname();
  const { currentActor } = useActor();
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [conversations, setConversations] = useState<ConversationOverview[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationOverview | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{id: number, text: string, sender: 'me'|'other', reactions: string[]}[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'direct'|'group'>('direct');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '👏'];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentActor?.id) {
      setConversations([]);
      return;
    }

    const isBusinessOrOrg = currentActor.type !== 'person';

    const dummyConversations: ConversationOverview[] = [
      {
        id: `mock-1-${currentActor.id}`,
        type: "direct",
        updated_at: new Date().toISOString(),
        last_message: {
          content: isBusinessOrOrg ? "Do you offer bulk discounts?" : "Hey, are we still on for lunch today?",
          created_at: new Date().toISOString(),
          sender_id: "other",
          is_read: false,
        },
        other_participant: {
          id: "u1",
          name: isBusinessOrOrg ? "Procurement Team" : "Alex Smith",
          avatar_url: isBusinessOrOrg ? "https://i.pravatar.cc/150?u=procurement" : "https://i.pravatar.cc/150?u=a042581f4e29026024d",
          type: "user",
          is_online: true,
        },
        unread_count: 1,
      },
      {
        id: `mock-2-${currentActor.id}`,
        type: "direct",
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        last_message: {
          content: isBusinessOrOrg ? "We will send over the contract." : "Sounds great, thanks!",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender_id: currentActor.id, // Ensure it shows as sent by me
          is_read: true,
        },
        other_participant: {
          id: "u2",
          name: isBusinessOrOrg ? "Legal Dept" : "Sarah Jenkins",
          avatar_url: isBusinessOrOrg ? "https://i.pravatar.cc/150?u=legal" : "https://i.pravatar.cc/150?u=a042581f4e29026704d",
          type: "user",
          is_online: false,
        },
        unread_count: 0,
      },
      {
        id: `mock-3-${currentActor.id}`,
        type: "direct",
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        last_message: {
          content: isBusinessOrOrg ? "Great working with you." : "Can you review the attached designs?",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          sender_id: "other",
          is_read: false,
        },
        other_participant: {
          id: "b1",
          name: isBusinessOrOrg ? "Partner Agency" : "Design Studio Pro",
          avatar_url: isBusinessOrOrg ? "https://i.pravatar.cc/150?u=agency" : "https://i.pravatar.cc/150?u=designstudio",
          type: "business",
          is_online: true,
        },
        unread_count: 2,
      }
    ];

    getUserConversations(currentActor.id).then(data => {
      setConversations([...data, ...dummyConversations]);
    });
  }, [currentActor?.id, currentActor?.type]);

  // If we are already on the full screen messages route, hide this overlay
  if (pathname?.startsWith("/messages")) {
    return null;
  }

  // Calculate unread globally
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  const filteredConversations = conversations.filter(c => 
    c.other_participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = (conv: ConversationOverview) => {
    setActiveConversation(conv);
    setIsEmojiOpen(false);
    
    // Different fake messages based on the dummy conversation selected
    let mockMessages = [];
    if (conv.id.startsWith('mock-1')) {
      mockMessages = [
        { id: 1, text: "Hey! Just wanted to follow up.", sender: 'other', reactions: [] },
        { id: 2, text: "Hey, are we still on for lunch today?", sender: 'other', reactions: [] },
      ];
    } else if (conv.id.startsWith('mock-2')) {
      mockMessages = [
        { id: 1, text: "Here is the repo link: example.com", sender: 'other', reactions: [] },
        { id: 2, text: "I'll take a look this afternoon.", sender: 'me', reactions: [] },
        { id: 3, text: "Sounds great, thanks!", sender: 'me', reactions: [] },
      ];
    } else if (conv.id.startsWith('mock-3')) {
      mockMessages = [
        { id: 1, text: "The new prototypes are ready.", sender: 'other', reactions: [] },
        { id: 2, text: "Can you review the attached designs?", sender: 'other', reactions: [] },
      ];
    } else {
      mockMessages = [
        { id: 1, text: "Hello! How can we help?", sender: 'other', reactions: [] },
        { id: 2, text: "I'll be there in 5 mins.", sender: 'me', reactions: [] }
      ];
    }
    
    setMessages(mockMessages as any);
  };

  const closeChat = () => {
    setActiveConversation(null);
  };

  return (
    <div className="hidden md:block fixed bottom-0 right-10 z-[100] flex items-end">
      
      {/* 
        PANEL 2: Active Chat Panel (Rendered if a conversation is active) 
        This is rendered to the LEFT of the main panel through flex layout or absolute positioning
      */}
      {activeConversation && (
        <div 
          className="absolute bottom-0 right-[350px] w-[340px] bg-[#111] border border-[var(--border)] border-b-0 rounded-t-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right"
          style={{ height: "450px" }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.05)] border-b border-white/10 rounded-t-xl cursor-pointer hover:bg-white/10 transition-colors"
            onClick={closeChat}
          >
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full bg-[var(--surface)] shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {activeConversation.other_participant?.avatar_url ? (
                    <img src={activeConversation.other_participant.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                      {activeConversation.other_participant?.name.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Active Online Indicator */}
                {activeConversation.other_participant?.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111]"></div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">{activeConversation.other_participant?.name}</span>
                <span className="text-[10px] text-white/50">{activeConversation.other_participant?.is_online ? "Active Now" : activeConversation.other_participant?.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/70">
              <button className="p-1.5 hover:bg-white/10 rounded-full transition" onClick={(e) => { e.stopPropagation(); }} title="More options"><MoreHorizontal size={16} /></button>
              <button className="p-1.5 hover:bg-white/10 rounded-full transition" onClick={(e) => { e.stopPropagation(); closeChat(); }} title="Close"><X size={16} /></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 wac-scrollbar bg-[#0a0a09]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`
                    p-3 rounded-2xl text-sm max-w-[85%] 
                    ${msg.sender === "me" 
                      ? "bg-[rgba(212,175,55,0.1)] border border-[#D4AF37]/30 text-white rounded-tr-sm" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                    }
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-[var(--border)] bg-[#111] relative">
            {/* Emoji Picker Popover */}
            {isEmojiOpen && (
              <div className="absolute bottom-full right-0 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData) => {
                    setChatInput(prev => prev + emojiData.emoji);
                    setIsEmojiOpen(false);
                  }}
                  width={300}
                  height={400}
                />
              </div>
            )}
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if(chatInput.trim()){
                  setMessages(prev => [...prev, {id: Date.now(), text: chatInput.trim(), sender: 'me', reactions: []}]);
                  setChatInput("");
                  setIsEmojiOpen(false);
                }
              }}
              className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-full px-3 py-1 mt-1 mb-1"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMessages(prev => [...prev, {id: Date.now(), text: `📎 Attached: ${e.target.files![0].name}`, sender: 'me', reactions: []}]);
                    setIsEmojiOpen(false);
                  }
                }} 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-1.5 text-white/40 hover:text-[var(--accent)] hover:bg-white/5 transition rounded-full shrink-0"
              >
                <Paperclip size={16} />
              </button>
              
              <input 
                type="text" 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder="Write a message..."
                className="flex-1 min-w-0 w-full bg-transparent border-none focus:ring-0 text-[13px] py-1.5 outline-none text-white placeholder:text-white/40"
              />
              
              <button 
                type="button" 
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className={`p-1.5 transition rounded-full shrink-0 ${isEmojiOpen ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-white/40 hover:text-[var(--accent)] hover:bg-white/5'}`}
              >
                <Smile size={16} />
              </button>
              
              <button 
                type="submit" 
                disabled={!chatInput.trim()} 
                className="p-1.5 text-[var(--accent)] disabled:opacity-30 disabled:hover:bg-transparent hover:bg-[var(--accent)]/10 transition rounded-full shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 
        PANEL 1: Main Conversation List Tab 
      */}
      <div 
        className="w-[330px] bg-[#111] border border-[var(--border)] border-b-0 rounded-t-xl shadow-[0_-5px_25px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 ease-in-out origin-bottom z-10"
        style={{ height: isOpen ? '500px' : '48px' }}
      >
        <div 
          className="flex items-center justify-between px-4 h-[48px] bg-[rgba(255,255,255,0.05)] hover:bg-white/10 transition-colors cursor-pointer rounded-t-xl shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentActor?.avatar_url ? (
                <img src={currentActor.avatar_url} className="w-7 h-7 rounded-full object-cover border border-[var(--surface)]" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-500 font-bold text-xs border border-[var(--surface)]">
                  {currentActor?.name ? currentActor.name.charAt(0) : "U"}
                </div>
              )}
              {/* Online status dot for current user */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111]"></div>
            </div>
            <div className="font-bold text-white tracking-wide">
              Messages
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 text-white/70 relative z-10 w-fit">
            
            <div className="relative">
              <button 
                className={`p-1.5 hover:bg-white/10 rounded-full transition ${isSettingsOpen ? 'bg-white/10 text-white' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }} 
                title="Message Settings"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {isSettingsOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1a1a1a] border border-[var(--border)] rounded-xl py-1.5 shadow-2xl z-50 text-sm animate-in fade-in slide-in-from-bottom-2">
                  <button className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-white/90">
                    <Settings size={16} /> Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-white/90">
                    <BellOff size={16} /> Mute Notifications
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                className={`p-1.5 hover:bg-white/10 rounded-full transition ${isNewMessageOpen ? 'bg-white/10 text-white' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIsNewMessageOpen(!isNewMessageOpen); }} 
                title="New message"
              >
                <MessageCirclePlus size={16} />
              </button>

              {isNewMessageOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1a1a1a] border border-[var(--border)] rounded-xl py-1.5 shadow-2xl z-50 text-sm animate-in fade-in slide-in-from-bottom-2">
                  <button 
                    onClick={() => { setIsComposeOpen(true); setComposeMode('direct'); setIsNewMessageOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-white/90"
                  >
                    <MessageCirclePlus size={16} /> New Direct Message
                  </button>
                  <button 
                    onClick={() => { setIsComposeOpen(true); setComposeMode('group'); setIsNewMessageOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-2 text-white/90"
                  >
                    <Users size={16} /> Create Group Chat
                  </button>
                </div>
              )}
            </div>
            <div className="p-1.5 hover:bg-white/10 hover:text-white rounded-full transition">
              {isOpen ? <ChevronDown size={18} /> : (
                <div className="relative">
                   <ChevronUp size={18} />
                   {totalUnread > 0 && (
                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                       {totalUnread}
                     </span>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Body (List) */}
        {isOpen && (
          <div className="flex-1 flex flex-col h-[calc(500px-48px)]">
            
            {isComposeOpen ? (
              <div className="flex-1 flex flex-col bg-[#111] animate-in slide-in-from-left-4 fade-in duration-200">
                <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
                  <span className="font-bold text-[15px] text-white tracking-wide">
                    {composeMode === 'direct' ? 'New Message' : 'Create Group Chat'}
                  </span>
                  <button 
                    onClick={() => setIsComposeOpen(false)} 
                    className="p-1.5 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="p-3 border-b border-[var(--border)]">
                  <div className="relative flex items-center bg-white/5 border border-white/10 rounded-lg">
                    <Search size={14} className="text-white/40 ml-3 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search for people..."
                      className="bg-transparent border-none focus:ring-0 text-sm py-2 px-2 outline-none w-full text-white placeholder:text-white/40 font-medium"
                    />
                  </div>
                  {composeMode === 'group' && (
                     <div className="mt-3 relative flex items-center bg-white/5 border border-white/10 rounded-lg">
                       <input 
                         type="text" 
                         placeholder="Group name (optional)"
                         className="bg-transparent border-none focus:ring-0 text-sm py-2 px-3 outline-none w-full text-white placeholder:text-white/40 font-medium"
                       />
                     </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-sm p-8 text-center gap-3">
                  <Users size={32} className="opacity-20" />
                  <div>
                    Search the WAC network to select participants. 
                    <p className="text-xs opacity-50 mt-1">(Network connection mock)</p>
                  </div>
                </div>
              </div>
            ) : (
                <>
                  {/* Search row */}
                  <div className="p-3 border-b border-[var(--border)] flex gap-2">
                    <div className="relative flex-1 group">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search messages"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                    <button className="p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-white/70">
                      <Filter size={16} />
                    </button>
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-y-auto wac-scrollbar pb-2">
                    {filteredConversations.length === 0 ? (
                      <div className="p-8 text-center text-white/40 text-sm">
                        {searchQuery ? "No matches found." : "No conversations yet. Send a message to start connecting!"}
                      </div>
                    ) : (
                filteredConversations.map(conv => {
                  const isActive = activeConversation?.id === conv.id;
                  const isUnread = conv.unread_count > 0;
                  
                  return (
                    <div 
                      key={conv.id}
                      onClick={() => openChat(conv)}
                      className={`
                        flex gap-3 p-3 cursor-pointer border-l-2 transition-colors
                        ${isActive ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'border-transparent hover:bg-white/5'}
                      `}
                    >
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--surface)]">
                          {conv.other_participant?.avatar_url ? (
                            <img src={conv.other_participant.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl font-bold">
                              {conv.other_participant?.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        {/* Active Online Indicator */}
                        {conv.other_participant?.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#111]"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate pr-2 ${isUnread ? 'font-bold text-white' : 'font-medium text-white/90'}`}>
                            {conv.other_participant?.name || "Unknown"}
                          </span>
                          <span className={`text-[11px] shrink-0 ${isUnread ? 'text-[var(--accent)] font-bold' : 'text-white/40'}`}>
                            {formatMsgTime(conv.updated_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs truncate ${isUnread ? 'text-white font-medium' : 'text-white/50'}`}>
                            {conv.last_message ? (
                              <>{conv.last_message.sender_id === userId ? "You: " : ""}{conv.last_message.content}</>
                            ) : (
                              <span className="italic">Started a conversation</span>
                            )}
                          </span>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 shadow-[0_0_5px_rgba(212,175,55,1)]"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </>
          )}
          </div>
        )}
      </div>

    </div>
  );
}
