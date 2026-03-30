"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { 
  ChevronUp, ChevronDown, MoreHorizontal, X, Search, 
  Send, Smile, Paperclip, Filter, MessageCirclePlus, Users, Settings, BellOff 
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { supabase } from "@/lib/supabase";
import { 
  getUserConversations, ConversationOverview, getMessages, sendMessage, 
  toggleMessageReactionDB, MessageInterface, searchMessagingContacts, 
  getOrCreateConversation, createGroupConversation, MessagingContact, MessagingActorType 
} from "@/lib/services/messagingService";
import { useActor } from "@/components/providers/ActorProvider";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";

// Helper for formatting time (e.g. "Mar 11" or "1:00 PM")
function formatMsgTime(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function toMessagingActorType(type: "person" | "business" | "organization"): MessagingActorType {
  return type === "person" ? "user" : type;
}



export default function FloatingMessagingIcon() {
  const pathname = usePathname();
  const { currentActor } = useActor();
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [conversations, setConversations] = useState<ConversationOverview[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationOverview | null>(null);
  
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  
  // Compose state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [contactSearchResults, setContactSearchResults] = useState<MessagingContact[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<MessagingContact[]>([]);
  const [groupName, setGroupName] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const fetchConvs = async () => {
      if (!currentActor?.id) {
        setConversations([]);
        return;
      }

      const data = await getUserConversations(currentActor.id, toMessagingActorType(currentActor.type));
      setConversations(data);
    };

    void fetchConvs();

    if (!currentActor?.id) {
      return;
    }

    // Subscribe to conversations realtime updates
    const channel = supabase.channel('conversations_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
         fetchConvs();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants', filter: `actor_id=eq.${currentActor.id}` }, () => {
         fetchConvs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentActor?.id, currentActor?.type]);

  // Handle active conversation specific real-time messages & reactions
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase.channel(`messages_${activeConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` }, (payload) => {
        const newMsg = payload.new as MessageInterface;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` }, (payload) => {
        const updatedMsg = payload.new as MessageInterface;
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  // If we are already on the full screen messages route, hide this overlay, hide this overlay
  if (pathname?.startsWith("/messages")) {
    return null;
  }

  // Calculate unread globally
  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  const filteredConversations = conversations.filter(c => 
    c.other_participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = async (conv: ConversationOverview) => {
    setActiveConversation(conv);
    setIsEmojiOpen(false);
    setIsComposeOpen(false); // Close compose if open
    
    // Fetch live messages
    const liveMsgs = await getMessages(conv.id);
    setMessages(liveMsgs);
  };
  
  const handleContactSelect = async (contact: MessagingContact) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
    }
    setContactSearchResults([]); 
    setIsSearchingContacts(false);
  };

  const startComposeChat = async () => {
    if (!currentActor || selectedContacts.length === 0) return;

    if (selectedContacts.length === 1) {
      // Start Direct Message
      const contact = selectedContacts[0];
      const res = await getOrCreateConversation(currentActor.id, toMessagingActorType(currentActor.type), contact.id, contact.type);
      
      if (res.success && res.conversationId) {
        const mockOverview: ConversationOverview = {
          id: res.conversationId,
          type: 'direct',
          updated_at: new Date().toISOString(),
          unread_count: 0,
          muted_at: null,
          pinned_at: null,
          pinned_message_id: null,
          other_participant: {
            id: contact.id,
            name: contact.name,
            type: contact.type,
            avatar_url: contact.avatar_url
          }
        };
        
        setConversations(prev => {
          if (!prev.find(c => c.id === mockOverview.id)) return [mockOverview, ...prev];
          return prev;
        });
        openChat(mockOverview);
      }
    } else {
      // Start Group Chat
      const res = await createGroupConversation(
        currentActor.id,
        toMessagingActorType(currentActor.type),
        selectedContacts.map(c => ({ id: c.id, type: c.type })),
        groupName
      );
      
      if (res.success && res.conversationId) {
         const mockOverview: ConversationOverview = {
          id: res.conversationId,
          type: 'group',
          title: groupName || undefined,
          participants: selectedContacts.map(c => ({ id: c.id, name: c.name, type: c.type, avatar_url: c.avatar_url })),
          updated_at: new Date().toISOString(),
          unread_count: 0,
          muted_at: null,
          pinned_at: null,
          pinned_message_id: null,
        };
        
        setConversations(prev => {
          if (!prev.find(c => c.id === mockOverview.id)) return [mockOverview, ...prev];
          return prev;
        });
        openChat(mockOverview);
      }
    }
    
    // Clear state after both
    setSelectedContacts([]);
    setGroupName("");
  };

  const closeChat = () => {
    setActiveConversation(null);
    setActiveReactionMsgId(null);
  };

  const toggleMessageReaction = (msgId: string, reactionType: string) => {
    // Find message locally first
    let currentReactions: string[] = [];
    setMessages(msgs => msgs.map(m => {
      if (m.id === msgId) {
        currentReactions = m.reactions || [];
        const hasReacted = currentReactions.includes(reactionType);
        return {
          ...m,
          reactions: hasReacted 
            ? currentReactions.filter(r => r !== reactionType)
            : [...currentReactions, reactionType]
        };
      }
      return m;
    }));
    setActiveReactionMsgId(null);
    
    // Fire off async DB update
    toggleMessageReactionDB(msgId, reactionType, currentReactions);
  };

  return (
    <div className="hidden md:block fixed bottom-0 right-10 z-[100] flex items-end">
      
      {/* 
        PANEL 2: Active Chat Panel (Rendered if a conversation is active) 
        This is rendered to the LEFT of the main panel through flex layout or absolute positioning
      */}
      {(activeConversation || isComposeOpen) && (
        <div 
          className="absolute bottom-0 right-[350px] w-[340px] bg-[#111] border border-[var(--border)] border-b-0 rounded-t-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right"
          style={{ height: "450px" }}
        >
          {isComposeOpen ? (
            <>
              {/* Compose Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.05)] border-b border-white/10 rounded-t-xl">
                 <div className="font-bold text-[14px] tracking-wide text-white">
                   {selectedContacts.length > 1 ? 'Create Group Chat' : 'New message'}
                 </div>
                 <button className="p-1.5 hover:bg-white/10 rounded-full transition text-white/50 hover:text-white" onClick={() => { setIsComposeOpen(false); setSelectedContacts([]); setGroupName(""); }}><X size={16} /></button>
              </div>
              
              {/* Compose Search Input */}
              <div className="p-2 border-b border-[var(--border)] flex flex-col gap-2 bg-[#111]">
                 {selectedContacts.length > 1 && (
                   <input 
                      type="text"
                      placeholder="Group name (optional)"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md text-sm outline-none text-white placeholder:text-white/40 px-3 py-2 font-medium focus:border-[var(--accent)] transition-colors"
                   />
                 )}
                 
                 {selectedContacts.length > 0 && (
                   <div className="flex flex-wrap gap-2 px-1">
                     {selectedContacts.map(contact => (
                       <div key={contact.id} className="flex items-center gap-1.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold px-2 py-1 rounded-full border border-[var(--accent)]/30">
                         {contact.avatar_url && <img src={contact.avatar_url} className="w-4 h-4 rounded-full object-cover" />}
                         {contact.name}
                         <button onClick={() => setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id))} className="hover:text-white transition-colors">
                           <X size={12} />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}

                 <div className="flex items-center bg-white/5 rounded-md px-2 py-1">
                   <Search size={14} className="text-white/40 mr-2" />
                   <input 
                      type="text"
                      placeholder={selectedContacts.length === 0 ? "Search a name..." : "Add another person..."}
                      autoFocus
                      onChange={async (e) => {
                      const val = e.target.value;
                      if (val.length < 2) {
                        setContactSearchResults([]);
                        return;
                      }
                      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                      
                      searchTimeoutRef.current = setTimeout(async () => {
                        setIsSearchingContacts(true);
                        const results = await searchMessagingContacts(val);
                        // Filter out people already selected
                        setContactSearchResults(results.filter(r => !selectedContacts.find(c => c.id === r.id)));
                        setIsSearchingContacts(false);
                      }, 400);
                    }}
                    className="w-full bg-transparent border-none text-sm outline-none text-white placeholder:text-white/40 py-1 font-medium"
                 />
                 </div>
              </div>
              
              {/* Compose Body / Results */}
              <div className="flex-1 overflow-y-auto wac-scrollbar bg-[#111]">
                  {isSearchingContacts && (
                    <div className="text-center text-sm text-white/40 p-5 animate-pulse">Searching...</div>
                  )}
                  
                  {!isSearchingContacts && contactSearchResults.map(contact => (
                    <div 
                      key={contact.id} 
                      onClick={() => handleContactSelect(contact)}
                      className="flex gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-[var(--accent)]"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#1a1a1a]">
                        {contact.avatar_url ? (
                          <img src={contact.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-500/20 font-bold">{contact.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <span className="text-sm font-bold text-white truncate">{contact.name}</span>
                        {contact.type === 'business' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full w-fit mt-0.5">
                            Business
                          </span>
                        )}
                        {contact.type === 'organization' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit mt-0.5">
                            {contact.headline || "Association"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {!isSearchingContacts && contactSearchResults.length === 0 && (
                    <div className="flex flex-col">
                      <div className="px-4 py-2 text-[11px] font-bold text-white/40 uppercase tracking-widest mt-1">Recent Contacts</div>
                      
                      {conversations.filter(c => c.other_participant || c.type === 'group').map(conv => (
                        <div 
                          key={conv.id} 
                          onClick={() => openChat(conv)}
                          className="flex gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-[var(--accent)]"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[var(--surface)] relative border border-white/10">
                            {conv.type === 'group' ? (
                              <div className="w-full h-full flex items-center justify-center text-white/50 bg-white/10">
                                <Users size={18} />
                              </div>
                            ) : conv.other_participant?.avatar_url ? (
                              <img src={conv.other_participant.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-500/20 font-bold text-sm">
                                {conv.other_participant?.name?.charAt(0) || "U"}
                              </div>
                            )}
                            {conv.type !== 'group' && conv.other_participant?.is_online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111]"></div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center min-w-0">
                            <span className="text-sm font-bold text-white truncate">
                              {conv.type === 'group' 
                                ? (conv.title || conv.participants?.map(p => p.name).join(', ') || 'Group Chat') 
                                : conv.other_participant?.name}
                            </span>
                            <span className="text-xs text-white/50 truncate capitalize">
                              {conv.type === 'group' ? 'Group Chat' : conv.other_participant?.type}
                            </span>
                          </div>
                        </div>
                      ))}

                      {conversations.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-sm p-8 text-center gap-3 pt-12">
                          <Search size={24} className="opacity-20 mb-1" />
                          <div>Type a name to search the network</div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              
              {/* Start Chat Button */}
              {selectedContacts.length > 0 && (
                <div className="p-3 border-t border-[var(--border)] bg-[#111]">
                  <button 
                    onClick={startComposeChat}
                    className="w-full bg-[var(--accent)] text-[#111] font-bold py-2 rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
                  >
                    {selectedContacts.length === 1 ? "Start Chat" : "Start Group Chat"}
                  </button>
                </div>
              )}
            </>
          ) : activeConversation ? (
            <>
          {/* Header */}
          <div 
            className="flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.05)] border-b border-white/10 rounded-t-xl cursor-pointer hover:bg-white/10 transition-colors"
            onClick={closeChat}
          >
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full bg-[var(--surface)] shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {activeConversation.type === 'group' ? (
                    <div className="w-full h-full flex items-center justify-center text-white/50 bg-white/10">
                      <Users size={16} />
                    </div>
                  ) : activeConversation.other_participant?.avatar_url ? (
                    <img src={activeConversation.other_participant.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                      {activeConversation.other_participant?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                {/* Active Online Indicator */}
                {activeConversation.type !== 'group' && activeConversation.other_participant?.is_online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#111]"></div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">
                  {activeConversation.type === 'group' 
                    ? (activeConversation.title || activeConversation.participants?.map(p => p.name).join(', ') || 'Group Chat') 
                    : activeConversation.other_participant?.name}
                </span>
                <span className="text-[10px] text-white/50">
                  {activeConversation.type === 'group' 
                    ? `${activeConversation.participants?.length || 0} participants` 
                    : (activeConversation.other_participant?.is_online ? "Active Now" : activeConversation.other_participant?.type)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/70">
              <button className="p-1.5 hover:bg-white/10 rounded-full transition" onClick={(e) => { e.stopPropagation(); }} title="More options"><MoreHorizontal size={16} /></button>
              <button className="p-1.5 hover:bg-white/10 rounded-full transition" onClick={(e) => { e.stopPropagation(); closeChat(); }} title="Close"><X size={16} /></button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-10 flex flex-col gap-5 wac-scrollbar bg-[#111]" onClick={() => setActiveReactionMsgId(null)}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentActor?.id;
              
              return (
              <div key={msg.id} className={`flex w-full group ${isMe ? "justify-end" : "justify-start"} ${activeReactionMsgId === msg.id ? "z-50" : "z-10"}`}>
                <div className={`
                    relative p-3 rounded-2xl text-sm max-w-[85%] 
                    ${isMe 
                      ? "bg-[rgba(176,141,87,0.1)] border border-[#b08d57]/30 text-white rounded-tr-sm" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                    }
                `}>
                  {msg.content}
                  
                  {/* Reactions Badge */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-3.5 ${isMe ? "right-2" : "left-2"} flex items-center bg-[#1a1a1a] border border-white/10 rounded-full px-1.5 py-0.5 shadow-md z-10`}>
                      {Array.from(new Set(msg.reactions)).map((r, i) => (
                        <div key={i} className="-ml-1.5 pl-1.5 rounded-full bg-[#1a1a1a]">
                          <ReactionIcon type={r} size={12} active={false} />
                        </div>
                      ))}
                      {msg.reactions.length > 1 && (
                        <span className="text-[9px] ml-1 opacity-80 font-bold">{msg.reactions.length}</span>
                      )}
                    </div>
                  )}

                  {/* Reaction Hover Trigger */}
                  <div className={`absolute -bottom-2 ${isMe ? "-left-2" : "-right-2"} opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                      }}
                      className="p-1.5 bg-[#111] border border-white/10 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-colors shadow-sm"
                    >
                      <Smile size={14} />
                    </button>
                  </div>
                  
                  {/* Reaction Popover */}
                  {activeReactionMsgId === msg.id && (
                    <div 
                      className={`absolute top-[80%] ${isMe ? "-left-4" : "-right-4"} bg-[#1a1a1a] border border-white/10 rounded-full px-2 py-1.5 shadow-xl z-50 flex items-center gap-1 animate-in zoom-in-95 duration-150`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {SUPPORTED_REACTIONS.map(reaction => (
                        <button
                          key={reaction.type}
                          onClick={() => toggleMessageReaction(msg.id, reaction.type)}
                          className="hover:bg-white/10 rounded-full p-1 transition-colors"
                        >
                          <ReactionIcon type={reaction.type} size={20} active={msg.reactions.includes(reaction.type)} showTooltip={false} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
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
              onSubmit={async (e) => {
                e.preventDefault();
                if(chatInput.trim() && currentActor && activeConversation){
                  const txt = chatInput.trim();
                  setChatInput("");
                  setIsEmojiOpen(false);
                  
                  // Optimistic append, but it causes flicker with live updates so real live logic:
                  // For production we can rely purely on realtime channel, or implement an optimistic id mapper.
                  // Since latency is tiny, we'll just fire the db call. The realtime channel will pick it up and inject.
                  await sendMessage(
                    activeConversation.id, 
                    currentActor.id, 
                    toMessagingActorType(currentActor.type),
                    txt
                  );
                }
              }}
              className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-full px-3 py-1.5 mt-1"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0] && currentActor && activeConversation) {
                    const txt = `📎 Attached: ${e.target.files[0].name}`;
                    setIsEmojiOpen(false);
                    await sendMessage(
                      activeConversation.id, 
                      currentActor.id, 
                      toMessagingActorType(currentActor.type),
                      txt
                    );
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
          </>
          ) : null}
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
            <div className="font-bold text-white tracking-wide flex items-center gap-2">
              Messages
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-md">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 text-white/70 relative z-10 w-fit">
            
            <div className="relative">
              <button 
                className={`p-1.5 hover:bg-white/10 rounded-full transition ${isSettingsOpen ? 'bg-white/10 text-white' : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsSettingsOpen(!isSettingsOpen); 
                }} 
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
                className={`p-1.5 hover:bg-white/10 rounded-full transition ${isComposeOpen ? 'bg-white/10 text-white' : ''}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsComposeOpen(true); 
                  setActiveConversation(null); 
                  setSelectedContacts([]);
                  setIsSettingsOpen(false);
                }} 
                title="New message"
              >
                <MessageCirclePlus size={16} />
              </button>
            </div>
            <div className="p-1.5 hover:bg-white/10 hover:text-white rounded-full transition flex items-center justify-center">
              {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          </div>
        </div>

        {/* Tab Body (List) */}
        {isOpen && (
          <div className="flex-1 flex flex-col h-[calc(500px-48px)]">
            
                  {/* Search row */}
                  <div className="p-3 border-b border-[var(--border)] flex gap-2">
                    <div className="relative flex-1 group">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition" />
                      <input 
                        id="floating-messages-search"
                        name="floating-messages-search"
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
                          {conv.type === 'group' ? (
                            <div className="w-full h-full bg-white/10 text-white/50 flex items-center justify-center text-xl font-bold">
                               <Users size={20} />
                            </div>
                          ) : conv.other_participant?.avatar_url ? (
                            <img src={conv.other_participant.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl font-bold">
                              {conv.other_participant?.name?.charAt(0) || "U"}
                            </div>
                          )}
                        </div>
                        {/* Active Online Indicator */}
                        {conv.type !== 'group' && conv.other_participant?.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[2.5px] border-[#111]"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate pr-2 ${isUnread ? 'font-bold text-white' : 'font-medium text-white/90'}`}>
                            {conv.type === 'group' 
                               ? (conv.title || conv.participants?.map(p => p.name).join(', ') || 'Group Chat') 
                               : (conv.other_participant?.name || "Unknown")}
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
                            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 shadow-[0_0_5px_rgba(176,141,87,1)]"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
