"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  X,
  ExternalLink,
  BellOff,
  Bell,
  Ban,
  Flag,
  LogOut,
  Image as ImageIcon,
  FileText,
  LinkIcon,
  CreditCard,
  Users,
  ChevronRight,
  Mic,
  Play,
  Pin,
  PinOff,
} from "lucide-react";
import { isAttachment, isVoiceNote, isEventCard, isGroupCard } from "@/lib/messaging/metadata";
import type { AttachmentMetadata, VoiceNoteMetadata, EventCardMetadata, GroupCardMetadata } from "@/lib/messaging/metadata";
import type { EntityCardMetadata } from "@/lib/messaging/metadata";
import type { ConversationOverview, MessageInterface, MessagingActorType } from "@/lib/services/messagingService";
import {
  muteConversation,
  unmuteConversation,
  pinConversation,
  unpinConversation,
  blockUser,
  reportUser,
} from "@/lib/services/messagingService";

// ── Types ────────────────────────────────────────────────────────────────────

type SharedContent = {
  links: { url: string; domain: string; messageId: string; senderName: string; createdAt: string }[];
  cards: { metadata: EntityCardMetadata; messageId: string; senderName: string; createdAt: string }[];
  media: { metadata: AttachmentMetadata; messageId: string; senderName: string; createdAt: string }[];
  files: { metadata: AttachmentMetadata; messageId: string; senderName: string; createdAt: string }[];
  voiceNotes: { metadata: VoiceNoteMetadata; messageId: string; senderName: string; createdAt: string }[];
  eventCards: { metadata: EventCardMetadata; messageId: string; senderName: string; createdAt: string }[];
  groupCards: { metadata: GroupCardMetadata; messageId: string; senderName: string; createdAt: string }[];
};

type Props = {
  conversation: ConversationOverview;
  messages: MessageInterface[];
  senderNameMap: Map<string, string>;
  actorId: string;
  actorType: MessagingActorType;
  onClose: () => void;
  onConversationUpdate?: () => void;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

function extractLinks(content: string): string[] {
  return content.match(URL_REGEX) ?? [];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ThreadDetailPanel({ conversation, messages, senderNameMap, actorId, actorType, onClose, onConversationUpdate }: Props) {
  const [muted, setMuted] = useState(!!conversation.muted_at);
  const [pinned, setPinned] = useState(!!conversation.pinned_at);
  const [activeSection, setActiveSection] = useState<"links" | "cards" | "media" | "files" | null>(null);

  const isGroup = conversation.type === "group";
  const other = conversation.other_participant;

  // Compute shared content from messages
  const shared = useMemo<SharedContent>(() => {
    const links: SharedContent["links"] = [];
    const cards: SharedContent["cards"] = [];
    const media: SharedContent["media"] = [];
    const files: SharedContent["files"] = [];
    const voiceNotes: SharedContent["voiceNotes"] = [];
    const eventCards: SharedContent["eventCards"] = [];
    const groupCards: SharedContent["groupCards"] = [];

    for (const msg of messages) {
      const senderName = senderNameMap.get(`${msg.sender_id}:${msg.sender_type}`) ?? "Member";

      // Extract links from message content
      const urls = extractLinks(msg.content);
      for (const url of urls) {
        links.push({ url, domain: extractDomain(url), messageId: msg.id, senderName, createdAt: msg.created_at });
      }

      // Entity cards
      if (msg.metadata?.type === "entity_card") {
        cards.push({ metadata: msg.metadata as EntityCardMetadata, messageId: msg.id, senderName, createdAt: msg.created_at });
      }

      // Attachments — separate into media vs files
      if (isAttachment(msg.metadata)) {
        const meta = msg.metadata as AttachmentMetadata;
        if (meta.mime_type.startsWith("image/") || meta.mime_type.startsWith("video/")) {
          media.push({ metadata: meta, messageId: msg.id, senderName, createdAt: msg.created_at });
        } else {
          files.push({ metadata: meta, messageId: msg.id, senderName, createdAt: msg.created_at });
        }
      }

      // Voice notes
      if (isVoiceNote(msg.metadata)) {
        voiceNotes.push({ metadata: msg.metadata as VoiceNoteMetadata, messageId: msg.id, senderName, createdAt: msg.created_at });
      }

      // Event cards
      if (isEventCard(msg.metadata)) {
        eventCards.push({ metadata: msg.metadata as EventCardMetadata, messageId: msg.id, senderName, createdAt: msg.created_at });
      }

      // Group cards
      if (isGroupCard(msg.metadata)) {
        groupCards.push({ metadata: msg.metadata as GroupCardMetadata, messageId: msg.id, senderName, createdAt: msg.created_at });
      }
    }

    return { links: links.reverse(), cards: cards.reverse(), media: media.reverse(), files: files.reverse(), voiceNotes: voiceNotes.reverse(), eventCards: eventCards.reverse(), groupCards: groupCards.reverse() };
  }, [messages, senderNameMap]);

  // Profile URL for the other participant
  const profileUrl = other?.profile_url;
  const profileType = other?.type === "user" ? "Person" : other?.type === "business" ? "Business" : other?.type === "organization" ? "Organization" : "";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — full-screen on mobile, 380px slide-over on desktop */}
      <div className="relative w-full sm:max-w-[380px] h-full bg-[#0A0A0A] sm:border-l border-white/[0.06] overflow-y-auto wac-scrollbar animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/[0.06]">
          <h2 className="text-[16px] font-serif font-bold">Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Profile section ──────────────────────────────────── */}
        <div className="flex flex-col items-center px-6 py-8">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-white/[0.08] overflow-hidden flex items-center justify-center mb-4">
            {!isGroup && other?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.avatar_url} alt={other.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-serif font-bold text-white/30">
                {isGroup
                  ? (conversation.title?.charAt(0) ?? "G")
                  : (other?.name?.charAt(0) ?? "?")}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-[18px] font-serif font-bold text-white text-center mb-1">
            {isGroup
              ? (conversation.title || conversation.participants?.map((p) => p.name).slice(0, 3).join(", ") || "Group")
              : (other?.name ?? "Conversation")}
          </h3>

          {/* Type badge */}
          {!isGroup && profileType && (
            <span className="text-[11px] text-white/35 capitalize mb-3">{profileType}</span>
          )}

          {/* Group member count */}
          {isGroup && conversation.participants && (
            <span className="text-[12px] text-white/35 mb-3">
              {conversation.participants.length} member{conversation.participants.length !== 1 ? "s" : ""}
            </span>
          )}

          {/* View profile button */}
          {!isGroup && profileUrl && (
            <Link
              href={profileUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 text-[#b08d57] text-[13px] font-semibold hover:bg-[#b08d57]/20 transition-colors"
            >
              View Profile
              <ExternalLink size={13} />
            </Link>
          )}
        </div>

        <div className="h-px bg-white/[0.05] mx-5" />

        {/* ── Group members ─────────────────────────────────────── */}
        {isGroup && conversation.participants && conversation.participants.length > 0 && (
          <div className="px-5 py-5">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-3">Members</h4>
            <div className="space-y-1">
              {conversation.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-white/[0.06] overflow-hidden flex items-center justify-center shrink-0">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-[#b08d57]">{p.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/80 truncate">{p.name}</p>
                    <p className="text-[10px] text-white/30 capitalize">{p.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isGroup && <div className="h-px bg-white/[0.05] mx-5" />}

        {/* ── Shared content sections ──────────────────────────── */}
        <div className="px-5 py-5">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-3">Shared Content</h4>

          {/* Links */}
          <button
            onClick={() => setActiveSection(activeSection === "links" ? null : "links")}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              <LinkIcon size={16} className="text-white/40" />
            </div>
            <span className="flex-1 text-left text-[14px] text-white/70">Links</span>
            <span className="text-[12px] text-white/25 mr-1">{shared.links.length}</span>
            <ChevronRight size={14} className={`text-white/20 transition-transform ${activeSection === "links" ? "rotate-90" : ""}`} />
          </button>

          {activeSection === "links" && (
            <div className="ml-2 mb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              {shared.links.length === 0 ? (
                <p className="py-3 px-2 text-[12px] text-white/25">No shared links yet</p>
              ) : (
                shared.links.slice(0, 10).map((link, i) => (
                  <a
                    key={`${link.messageId}-${i}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col gap-0.5 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-[12px] text-[#b08d57] truncate">{link.domain}</span>
                    <span className="text-[11px] text-white/30 truncate">{link.url}</span>
                    <span className="text-[10px] text-white/20">{link.senderName} &middot; {formatDate(link.createdAt)}</span>
                  </a>
                ))
              )}
            </div>
          )}

          {/* Cards */}
          <button
            onClick={() => setActiveSection(activeSection === "cards" ? null : "cards")}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              <CreditCard size={16} className="text-white/40" />
            </div>
            <span className="flex-1 text-left text-[14px] text-white/70">WAC Cards</span>
            <span className="text-[12px] text-white/25 mr-1">{shared.cards.length + shared.eventCards.length + shared.groupCards.length}</span>
            <ChevronRight size={14} className={`text-white/20 transition-transform ${activeSection === "cards" ? "rotate-90" : ""}`} />
          </button>

          {activeSection === "cards" && (
            <div className="ml-2 mb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              {shared.cards.length + shared.eventCards.length + shared.groupCards.length === 0 ? (
                <p className="py-3 px-2 text-[12px] text-white/25">No shared cards yet</p>
              ) : (
                <>
                  {shared.cards.slice(0, 10).map((card, i) => (
                    <Link
                      key={`ec-${card.messageId}-${i}`}
                      href={card.metadata.url}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] overflow-hidden flex items-center justify-center shrink-0">
                        {card.metadata.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={card.metadata.avatar_url} alt={card.metadata.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#b08d57]">{card.metadata.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{card.metadata.name}</p>
                        <p className="text-[10px] text-white/25 capitalize">{card.metadata.entity_type} &middot; {formatDate(card.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                  {shared.eventCards.slice(0, 5).map((ev, i) => (
                    <Link
                      key={`ev-${ev.messageId}-${i}`}
                      href={ev.metadata.url}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#b08d57]/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#b08d57]">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{ev.metadata.title}</p>
                        <p className="text-[10px] text-white/25">Event &middot; {formatDate(ev.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                  {shared.groupCards.slice(0, 5).map((gr, i) => (
                    <Link
                      key={`gr-${gr.messageId}-${i}`}
                      href={gr.metadata.url}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Users size={14} className="text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{gr.metadata.name}</p>
                        <p className="text-[10px] text-white/25">{gr.metadata.member_count} members &middot; {formatDate(gr.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Media */}
          <button
            onClick={() => setActiveSection(activeSection === "media" ? null : "media")}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              <ImageIcon size={16} className="text-white/40" />
            </div>
            <span className="flex-1 text-left text-[14px] text-white/70">Media</span>
            <span className="text-[12px] text-white/25 mr-1">{shared.media.length}</span>
            <ChevronRight size={14} className={`text-white/20 transition-transform ${activeSection === "media" ? "rotate-90" : ""}`} />
          </button>

          {activeSection === "media" && (
            <div className="ml-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {shared.media.length === 0 ? (
                <p className="py-3 px-2 text-[12px] text-white/25">No shared media yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                  {shared.media.slice(0, 12).map((item, i) => (
                    <a
                      key={`${item.messageId}-${i}`}
                      href={item.metadata.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square bg-[#1A1A1A] overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      {item.metadata.mime_type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.metadata.file_url} alt={item.metadata.file_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play size={20} className="text-white/30" />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files */}
          <button
            onClick={() => setActiveSection(activeSection === "files" ? null : "files")}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              <FileText size={16} className="text-white/40" />
            </div>
            <span className="flex-1 text-left text-[14px] text-white/70">Files</span>
            <span className="text-[12px] text-white/25 mr-1">{shared.files.length + shared.voiceNotes.length}</span>
            <ChevronRight size={14} className={`text-white/20 transition-transform ${activeSection === "files" ? "rotate-90" : ""}`} />
          </button>

          {activeSection === "files" && (
            <div className="ml-2 mb-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
              {shared.files.length === 0 && shared.voiceNotes.length === 0 ? (
                <p className="py-3 px-2 text-[12px] text-white/25">No shared files yet</p>
              ) : (
                <>
                  {shared.voiceNotes.slice(0, 5).map((vn, i) => (
                    <a
                      key={`vn-${vn.messageId}-${i}`}
                      href={vn.metadata.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#b08d57]/10 flex items-center justify-center shrink-0">
                        <Mic size={14} className="text-[#b08d57]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70">Voice note</p>
                        <p className="text-[10px] text-white/25">{vn.senderName} &middot; {formatDate(vn.createdAt)} &middot; {Math.floor(vn.metadata.duration_seconds / 60)}:{(vn.metadata.duration_seconds % 60).toString().padStart(2, "0")}</p>
                      </div>
                    </a>
                  ))}
                  {shared.files.slice(0, 10).map((file, i) => (
                    <a
                      key={`file-${file.messageId}-${i}`}
                      href={file.metadata.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-white/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-white/70 truncate">{file.metadata.file_name}</p>
                        <p className="text-[10px] text-white/25">{file.senderName} &middot; {formatDate(file.createdAt)}</p>
                      </div>
                    </a>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-white/[0.05] mx-5" />

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="px-5 py-5">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-3">Actions</h4>

          {/* Pin / Unpin */}
          <button
            onClick={async () => {
              const ok = pinned
                ? await unpinConversation(conversation.id, actorId, actorType)
                : await pinConversation(conversation.id, actorId, actorType);
              if (ok) { setPinned(!pinned); onConversationUpdate?.(); }
            }}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              {pinned ? <PinOff size={16} className="text-[#b08d57]" /> : <Pin size={16} className="text-white/40" />}
            </div>
            <span className="text-[14px] text-white/70">{pinned ? "Unpin Conversation" : "Pin Conversation"}</span>
          </button>

          {/* Mute / Unmute */}
          <button
            onClick={async () => {
              const ok = muted
                ? await unmuteConversation(conversation.id, actorId, actorType)
                : await muteConversation(conversation.id, actorId, actorType);
              if (ok) { setMuted(!muted); onConversationUpdate?.(); }
            }}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
              {muted ? <Bell size={16} className="text-white/40" /> : <BellOff size={16} className="text-white/40" />}
            </div>
            <span className="text-[14px] text-white/70">{muted ? "Unmute Conversation" : "Mute Conversation"}</span>
          </button>

          {isGroup && (
            <button className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                <LogOut size={16} className="text-white/40" />
              </div>
              <span className="text-[14px] text-white/70">Leave Group</span>
            </button>
          )}

          {!isGroup && other && (
            <>
              <button
                onClick={async () => {
                  if (!confirm("Block this account? They won't be able to message you.")) return;
                  await blockUser(actorId, actorType, other.id, other.type);
                  onConversationUpdate?.();
                  onClose();
                }}
                className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Ban size={16} className="text-red-400/60" />
                </div>
                <span className="text-[14px] text-red-400/60">Block Account</span>
              </button>

              <button
                onClick={async () => {
                  const reason = prompt("Why are you reporting this account?");
                  if (!reason) return;
                  await reportUser(actorId, other.id, reason);
                  alert("Report submitted. Thank you.");
                }}
                className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Flag size={16} className="text-red-400/60" />
                </div>
                <span className="text-[14px] text-red-400/60">Report Account</span>
              </button>
            </>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-10" />
      </div>
    </div>
  );
}
