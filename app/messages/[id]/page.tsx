"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Paperclip, Smile, Reply, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import {
  ConversationOverview,
  getMessages,
  getUserConversations,
  markConversationRead,
  MessageInterface,
  MessagingActorType,
  sendMessage,
  toggleMessageReactionDB,
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

function formatTimestamp(isoString: string) {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ActiveChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  const { currentActor, isLoading } = useActor();
  const [conversation, setConversation] = useState<ConversationOverview | null>(null);
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageInterface | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!currentActor) {
        if (!cancelled) {
          setConversation(null);
          setMessages([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const actorType = toMessagingActorType(currentActor.type);
      const [conversations, threadMessages] = await Promise.all([
        getUserConversations(currentActor.id, actorType),
        getMessages(conversationId),
      ]);

      if (cancelled) return;

      const matchedConversation = conversations.find((item) => item.id === conversationId) ?? null;
      setConversation(matchedConversation);
      setMessages(threadMessages);
      setLoading(false);

      if (matchedConversation) {
        await markConversationRead(conversationId, currentActor.id, actorType);
      }
    }

    void loadConversation();
    return () => {
      cancelled = true;
    };
  }, [conversationId, currentActor]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages_page_${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMessage = payload.new as MessageInterface;
          setMessages((prev) => (prev.some((message) => message.id === newMessage.id) ? prev : [...prev, newMessage]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const updatedMessage = payload.new as MessageInterface;
          setMessages((prev) => prev.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const senderNameMap = useMemo(() => {
    const entries = new Map<string, string>();

    if (currentActor) {
      entries.set(`${currentActor.id}:${toMessagingActorType(currentActor.type)}`, "You");
    }

    if (conversation?.other_participant) {
      entries.set(
        `${conversation.other_participant.id}:${conversation.other_participant.type}`,
        conversation.other_participant.name,
      );
    }

    for (const participant of conversation?.participants ?? []) {
      entries.set(`${participant.id}:${participant.type}`, participant.name);
    }

    return entries;
  }, [conversation, currentActor]);

  async function handleSend() {
    if (!currentActor || !conversation || !inputText.trim() || sending) return;

    setSending(true);
    const content = inputText.trim();
    const replyId = replyTo?.id;
    setInputText("");
    setReplyTo(null);

    await sendMessage(
      conversation.id,
      currentActor.id,
      toMessagingActorType(currentActor.type),
      content,
      replyId,
    );

    await markConversationRead(
      conversation.id,
      currentActor.id,
      toMessagingActorType(currentActor.type),
    );

    setSending(false);
  }

  async function handleReaction(msgId: string, reactionType: string) {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    // Optimistic update
    const hasReacted = msg.reactions.includes(reactionType);
    const newReactions = hasReacted
      ? msg.reactions.filter((r) => r !== reactionType)
      : [...msg.reactions, reactionType];
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, reactions: newReactions } : m)),
    );
    setActiveReactionMsgId(null);
    await toggleMessageReactionDB(msgId, reactionType, msg.reactions);
  }

  function handleReply(message: MessageInterface) {
    setReplyTo(message);
    inputRef.current?.focus();
  }

  if (loading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111] text-white/50">
        Loading conversation...
      </div>
    );
  }

  if (!conversation || !currentActor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#111] text-center px-6">
        <p className="text-xl font-serif text-white">Conversation not found</p>
        <Link href="/messages" className="text-sm text-[#b08d57] hover:text-[#d0af7c] transition-colors">
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111] text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#0A0A0A]">
        <Link href="/messages" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft size={20} />
        </Link>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center">
          {conversation.type === "direct" && conversation.other_participant?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.other_participant.avatar_url}
              alt={formatConversationTitle(conversation)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-serif font-bold text-white/40">
              {formatConversationTitle(conversation).charAt(0)}
            </span>
          )}
        </div>

        {/* Name + status */}
        {conversation.type === "direct" && conversation.other_participant?.profile_url ? (
          <Link href={conversation.other_participant.profile_url} className="min-w-0 group">
            <h1 className="text-[16px] font-serif font-bold truncate group-hover:text-[#b08d57] transition-colors">
              {formatConversationTitle(conversation)}
            </h1>
            <p className="text-[11px] text-white/35 capitalize">{conversation.other_participant?.type ?? "direct"}</p>
          </Link>
        ) : (
          <div className="min-w-0">
            <h1 className="text-[16px] font-serif font-bold truncate">{formatConversationTitle(conversation)}</h1>
            <p className="text-[11px] text-white/35">
              {conversation.type === "group"
                ? `${conversation.participants?.length ?? 0} participant${(conversation.participants?.length ?? 0) === 1 ? "" : "s"}`
                : conversation.other_participant?.type ?? "direct"}
            </p>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto wac-scrollbar px-4 py-6" onClick={() => setActiveReactionMsgId(null)}>
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-white/40 py-16">No messages yet. Start the conversation.</div>
          ) : (
            messages.map((message) => {
              const isMine =
                message.sender_id === currentActor.id &&
                message.sender_type === toMessagingActorType(currentActor.type);

              const senderName =
                senderNameMap.get(`${message.sender_id}:${message.sender_type}`) ??
                (message.sender_type === "user" ? "Member" : message.sender_type);

              // Find quoted message
              const quotedMsg = message.reply_to_id
                ? messages.find((m) => m.id === message.reply_to_id)
                : null;
              const quotedSender = quotedMsg
                ? senderNameMap.get(`${quotedMsg.sender_id}:${quotedMsg.sender_type}`) ?? "Member"
                : null;

              const hasReactions = message.reactions && message.reactions.length > 0;

              return (
                <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group/msg relative`}>
                  <div className={`max-w-[80%] relative ${hasReactions ? "mb-3" : ""}`}>
                    {/* Quoted reply preview */}
                    {quotedMsg && (
                      <div
                        className={`mb-1 rounded-xl px-3 py-2 text-[12px] border-l-2 ${
                          isMine
                            ? "bg-[#9a7a45]/30 border-black/30 text-black/60"
                            : "bg-white/[0.04] border-[#b08d57]/40 text-white/50"
                        }`}
                      >
                        <span className="font-semibold">{quotedSender}</span>
                        <p className="truncate mt-0.5 opacity-70">{quotedMsg.content}</p>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isMine
                          ? "bg-[#b08d57] text-black rounded-br-md"
                          : "bg-[#1b1b1b] border border-white/[0.06] text-white rounded-bl-md"
                      }`}
                    >
                      {!isMine && conversation.type === "group" && (
                        <div className="text-[11px] font-semibold text-[#b08d57] mb-1">{senderName}</div>
                      )}
                      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</div>
                      <div className={`mt-1.5 text-[11px] ${isMine ? "text-black/50" : "text-white/30"}`}>
                        {formatTimestamp(message.created_at)}
                      </div>
                    </div>

                    {/* Reaction badges below bubble */}
                    {hasReactions && (
                      <div className={`absolute -bottom-2.5 ${isMine ? "right-2" : "left-2"} flex items-center gap-0.5`}>
                        <div className="flex items-center bg-[#1a1a1a] border border-white/[0.08] rounded-full px-1.5 py-0.5 shadow-lg">
                          {[...new Set(message.reactions)].map((r) => {
                            const found = SUPPORTED_REACTIONS.find((sr) => sr.type === r);
                            return found ? (
                              <span key={r} className="text-[13px] leading-none">{found.emoji}</span>
                            ) : null;
                          })}
                          {message.reactions.length > 1 && (
                            <span className="text-[10px] font-bold text-white/50 ml-0.5">{message.reactions.length}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hover action bar */}
                    <div
                      className={`absolute ${isMine ? "left-0 -translate-x-full pr-1.5" : "right-0 translate-x-full pl-1.5"} top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveReactionMsgId(activeReactionMsgId === message.id ? null : message.id); }}
                        className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors text-[13px]"
                        title="React"
                      >
                        😊
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReply(message); }}
                        className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.1] transition-colors"
                        title="Reply"
                      >
                        <Reply size={13} />
                      </button>
                    </div>

                    {/* Reaction picker popup */}
                    {activeReactionMsgId === message.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute ${isMine ? "right-0" : "left-0"} -top-10 z-50 flex items-center gap-1 bg-[#1a1a1a] border border-white/[0.1] rounded-full px-2 py-1.5 shadow-xl animate-in zoom-in-95 duration-150`}
                      >
                        {SUPPORTED_REACTIONS.map((r) => (
                          <button
                            key={r.type}
                            onClick={() => handleReaction(message.id, r.type)}
                            className={`text-[18px] hover:scale-125 transition-transform px-0.5 ${
                              message.reactions.includes(r.type) ? "scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]" : ""
                            }`}
                            title={r.label}
                          >
                            {r.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="border-t border-white/[0.06] bg-[#0d0d0d] px-4 py-2.5 flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[#b08d57]/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#b08d57]">
              Replying to {senderNameMap.get(`${replyTo.sender_id}:${replyTo.sender_type}`) ?? "Member"}
            </p>
            <p className="text-[12px] text-white/40 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-full hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className={`border-t border-white/[0.06] bg-[#0A0A0A] px-4 py-3 ${replyTo ? "border-t-0" : ""}`}>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await handleSend();
          }}
          className="max-w-3xl mx-auto flex items-end gap-2"
        >
          <button
            type="button"
            className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors mb-0.5"
            title="Attach file"
          >
            <Paperclip size={18} strokeWidth={1.8} />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Write a message..."
              className="w-full resize-none rounded-2xl bg-[#1A1A1A] border border-white/[0.06] pl-4 pr-10 py-3 text-sm text-white outline-none focus:border-[#b08d57]/40 min-h-[48px] max-h-32 transition-colors"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              type="button"
              className="absolute right-3 bottom-3 text-white/25 hover:text-white/50 transition-colors"
              title="Emoji"
            >
              <Smile size={18} strokeWidth={1.8} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-10 h-10 shrink-0 rounded-xl bg-[#b08d57] text-black flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#9a7545] mb-0.5"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
