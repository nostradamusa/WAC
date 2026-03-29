"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Settings, CheckCircle2, Plus, PenSquare, X, Loader2 } from "lucide-react";
import { useActor } from "@/components/providers/ActorProvider";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  ConversationOverview,
  getUserConversations,
  MessagingActorType,
  MessagingContact,
  searchMessagingContacts,
  getOrCreateConversation,
  searchConversationMessages,
  MessageSearchResult,
} from "@/lib/services/messagingService";

function toMessagingActorType(type: "person" | "business" | "organization"): MessagingActorType {
  return type === "person" ? "user" : type;
}

function formatConversationTitle(conversation: ConversationOverview) {
  if (conversation.type === "group") {
    if (conversation.title?.trim()) return conversation.title;
    const names = conversation.participants?.map((participant) => participant.name).slice(0, 3) ?? [];
    return names.length > 0 ? names.join(", ") : "Group conversation";
  }

  return conversation.other_participant?.name ?? "Direct conversation";
}

function formatConversationSubtitle(conversation: ConversationOverview) {
  if (conversation.last_message?.content?.trim()) return conversation.last_message.content;
  return conversation.type === "group" ? "No messages yet" : "Start the conversation";
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#b08d57]/25 text-white/80 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function formatConversationTime(updatedAt: string) {
  if (!updatedAt) return "";
  const date = new Date(updatedAt);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesInboxPage() {
  const { currentActor, isLoading } = useActor();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "requests">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [conversations, setConversations] = useState<ConversationOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Message search state ──
  const [messageResults, setMessageResults] = useState<MessageSearchResult[]>([]);
  const [messageSearching, setMessageSearching] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    if (!debouncedSearchQuery || debouncedSearchQuery.length < 2 || !currentActor) {
      setMessageResults([]);
      return;
    }
    async function search() {
      if (!currentActor) return;
      setMessageSearching(true);
      const results = await searchConversationMessages(
        currentActor.id,
        toMessagingActorType(currentActor.type),
        debouncedSearchQuery,
      );
      setMessageResults(results);
      setMessageSearching(false);
    }
    search();
  }, [debouncedSearchQuery, currentActor]);

  // ── Compose modal state ──
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeQuery, setComposeQuery] = useState("");
  const [composeSearching, setComposeSearching] = useState(false);
  const [composeCreating, setComposeCreating] = useState(false);
  const [composeContacts, setComposeContacts] = useState<MessagingContact[]>([]);
  const debouncedComposeQuery = useDebounce(composeQuery, 300);

  useEffect(() => {
    if (!debouncedComposeQuery || debouncedComposeQuery.length < 2) {
      setComposeContacts([]);
      return;
    }
    async function search() {
      setComposeSearching(true);
      const results = await searchMessagingContacts(debouncedComposeQuery);
      setComposeContacts(results);
      setComposeSearching(false);
    }
    search();
  }, [debouncedComposeQuery]);

  async function handleStartChat(contact: MessagingContact) {
    if (!currentActor) return;
    setComposeCreating(true);
    const { success, conversationId } = await getOrCreateConversation(
      currentActor.id,
      toMessagingActorType(currentActor.type),
      contact.id,
      contact.type,
    );
    setComposeCreating(false);
    if (success && conversationId) {
      setComposeOpen(false);
      setComposeQuery("");
      setComposeContacts([]);
      router.push(`/messages/${conversationId}`);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      if (!currentActor) {
        if (!cancelled) {
          setConversations([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const data = await getUserConversations(currentActor.id, toMessagingActorType(currentActor.type));
      if (!cancelled) {
        setConversations(data);
        setLoading(false);
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [currentActor]);

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (activeTab === "unread" && conversation.unread_count === 0) return false;
      if (activeTab === "requests") return false;

      if (!query) return true;

      const title = formatConversationTitle(conversation).toLowerCase();
      const preview = (conversation.last_message?.content ?? "").toLowerCase();
      return title.includes(query) || preview.includes(query);
    });
  }, [activeTab, conversations, searchQuery]);

  const requestCount = 0;

  return (
    <>
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-white/5 bg-[#0A0A0A] flex flex-col h-full pt-16 md:pt-16 relative z-10">
        <div className="px-5 pt-6 pb-4 shrink-0 bg-gradient-to-b from-[#0A0A0A] to-transparent relative z-20">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-serif tracking-tight font-bold text-white drop-shadow-sm">
              Messages
            </h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setComposeOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 text-[#b08d57] hover:bg-[#b08d57]/20 active:scale-95 transition-all"
                title="New message"
              >
                <PenSquare size={16} strokeWidth={2} />
              </button>
              <Link
                href="/messages/settings"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/5 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                title="Settings"
              >
                <Settings size={17} strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          <div className="mb-5 group px-1">
            <div
              className={`relative flex items-center bg-[#151515] rounded-full transition-all duration-300 ${
                searchFocused
                  ? "border-[#b08d57]/30 border bg-[#1A1A1A] ring-1 ring-[#b08d57]/10"
                  : "border border-white/[0.04] hover:bg-[#1A1A1A] hover:border-white/10"
              }`}
            >
              <div
                className={`pl-4 pr-3 transition-colors ${
                  searchFocused ? "text-[#b08d57]" : "text-white/30 group-hover:text-white/50"
                }`}
              >
                <Search size={16} strokeWidth={2.5} />
              </div>
              <input
                id="messages-search"
                type="text"
                placeholder="Search conversations and messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-2.5 pr-4 text-[14.5px] font-medium text-white placeholder:text-white/30 outline-none"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </div>

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
                {tab === "requests" && requestCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-[#b08d57]/20 text-[#b08d57] text-[10px] font-bold leading-none border border-[#b08d57]/30">
                    {requestCount}
                  </span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b08d57] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto wac-scrollbar pb-32 md:pb-6 px-2">
          {/* Section header when searching */}
          {searchQuery.trim().length >= 2 && filteredConversations.length > 0 && !loading && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 shrink-0">Conversations</span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
          )}

          {loading || isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <CheckCircle2 size={24} className="text-white/20" />
              </div>
              <p className="text-[14px] text-white/40">Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const isUnread = conversation.unread_count > 0;
              const title = formatConversationTitle(conversation);

              return (
                <Link
                  href={`/messages/${conversation.id}`}
                  key={conversation.id}
                  className={`relative flex items-center gap-3.5 p-3 mx-1 mb-1 rounded-2xl transition-all duration-200 group ${
                    isUnread ? "bg-[#b08d57]/[0.03] hover:bg-[#b08d57]/[0.06]" : "bg-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  {isUnread && (
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b08d57] rounded-r-lg shadow-[0_0_8px_rgba(176,141,87,0.6)]" />
                  )}

                  <div className="relative w-14 h-14 shrink-0">
                    {conversation.type === "group" && conversation.participants ? (
                      /* Stacked group avatars (2 overlapping circles) */
                      <div className="relative w-14 h-14">
                        <div className="absolute top-0 left-0 w-10 h-10 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A] overflow-hidden flex items-center justify-center z-[1]">
                          {conversation.participants[0]?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={conversation.participants[0].avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-[#b08d57]">{conversation.participants[0]?.name?.charAt(0) ?? "?"}</span>
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#1A1A1A] border-2 border-[#0A0A0A] overflow-hidden flex items-center justify-center z-[2]">
                          {conversation.participants[1]?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={conversation.participants[1].avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[12px] font-bold text-white/30">{conversation.participants[1]?.name?.charAt(0) ?? "+"}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-white/10 overflow-hidden flex items-center justify-center">
                        {conversation.type === "direct" && conversation.other_participant?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={conversation.other_participant.avatar_url}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`text-[20px] font-serif font-bold ${isUnread ? "text-[#b08d57]" : "text-white/40"}`}>
                            {title.charAt(0)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <h3 className={`text-[15px] truncate ${isUnread ? "font-bold text-white" : "font-semibold text-white/80"}`}>
                          {title}
                        </h3>
                        {conversation.type === "group" && conversation.participants && (
                          <span className="text-[10px] text-white/25 shrink-0">{conversation.participants.length}</span>
                        )}
                      </div>
                      <span className={`text-[11px] shrink-0 font-medium ${isUnread ? "text-[#b08d57]" : "text-white/30"}`}>
                        {formatConversationTime(conversation.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-[13px] truncate leading-tight ${isUnread ? "text-white/90 font-medium" : "text-white/40"}`}>
                        {formatConversationSubtitle(conversation)}
                      </p>
                      {isUnread && (
                        <span className="shrink-0 min-w-4 h-4 rounded-full bg-[#b08d57] text-black flex items-center justify-center text-[9px] font-extrabold px-1">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mb-4">
                <Plus size={24} className="text-white/20" />
              </div>
              <h3 className="text-[17px] font-serif font-bold text-white mb-1.5">
                {activeTab === "requests" ? "No message requests" : "No conversations yet"}
              </h3>
              <p className="text-[14px] text-white/40">
                {activeTab === "requests"
                  ? "Requests are not wired yet for this account."
                  : "Start a conversation from the compose button."}
              </p>
            </div>
          )}

          {/* ── Message search results ──────────────────────────── */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-1 px-1">
              {/* Section divider */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 shrink-0 flex items-center gap-2">
                  In Messages
                  {messageSearching && <Loader2 size={10} className="animate-spin text-white/15" />}
                </span>
                <div className="h-px flex-1 bg-white/[0.04]" />
              </div>

              {!messageSearching && messageResults.length === 0 && (
                <p className="px-3 py-3 text-[12px] text-white/25 text-center">No messages matching &quot;{searchQuery}&quot;</p>
              )}
              {messageResults.map((result) => {
                const conv = conversations.find((c) => c.id === result.conversation_id);
                const convTitle = conv ? formatConversationTitle(conv) : "Conversation";
                return (
                  <Link
                    key={result.message_id}
                    href={`/messages/${result.conversation_id}`}
                    className="flex items-start gap-3 p-3 mx-1 mb-0.5 rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0 mt-0.5">
                      <Search size={13} className="text-white/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[12px] font-semibold text-white/50 truncate">{convTitle}</span>
                        <span className="text-[10px] text-white/20">&middot;</span>
                        <span className="text-[10px] text-white/20 shrink-0">{result.sender_name}</span>
                      </div>
                      <p className="text-[13px] text-white/40 truncate">{highlightMatch(result.content, searchQuery)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col relative pt-16 md:pt-16 bg-[#070707] z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b08d57]/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-[#b08d57]/10 rounded-full blur-xl scale-125 transition-transform duration-700 group-hover:scale-150" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1a1711] to-[#0A0A0A] flex items-center justify-center border border-[#b08d57]/20 shadow-2xl relative z-10">
              <Search size={42} strokeWidth={1.2} className="text-[#b08d57] opacity-80" />
            </div>
          </div>

          <h2 className="text-3xl font-serif tracking-tight text-white mb-4">Your Conversations</h2>
          <p className="text-[15px] text-white/40 max-w-[360px] mx-auto mb-10 leading-relaxed">
            Open an existing thread from the inbox or start a new conversation with the compose button.
          </p>
        </div>
      </div>

      {/* ── Compose Modal ──────────────────────────────────────────── */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200"
          onClick={() => { setComposeOpen(false); setComposeQuery(""); setComposeContacts([]); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[600px] max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-xl font-bold font-serif tracking-tight">New Message</h2>
              <button
                onClick={() => { setComposeOpen(false); setComposeQuery(""); setComposeContacts([]); }}
                className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search people, businesses, or organizations..."
                  value={composeQuery}
                  onChange={(e) => setComposeQuery(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#b08d57]/40 transition text-white placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto wac-scrollbar">
              {composeSearching ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="animate-spin text-[#b08d57] opacity-50" size={24} />
                </div>
              ) : composeQuery.length < 2 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  Type at least 2 characters to search...
                </div>
              ) : composeContacts.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No contacts found matching &quot;{composeQuery}&quot;
                </div>
              ) : (
                <div className="p-2 flex flex-col gap-0.5">
                  {composeContacts.map((contact) => (
                    <button
                      key={contact.id}
                      disabled={composeCreating}
                      onClick={() => handleStartChat(contact)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.04] rounded-xl transition text-left disabled:opacity-50"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#b08d57] text-sm border border-white/[0.06]">
                        {contact.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={contact.avatar_url} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          contact.name.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{contact.name}</span>
                          {contact.is_verified && <CheckCircle2 size={12} className="text-[#b08d57] shrink-0" />}
                          <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40 capitalize shrink-0">{contact.type}</span>
                        </div>
                        {contact.headline && (
                          <span className="text-xs text-white/40 truncate">{contact.headline}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
