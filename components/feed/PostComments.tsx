"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { NetworkComment } from "@/lib/types/network-feed";
import { addPostComment, searchMentionSuggestions, MentionSuggestion, deleteComment, editComment, toggleCommentReaction, ReactionType } from "@/lib/services/feedService";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import Image from "next/image";
import Link from "next/link";
import { Send, Loader2, MoreHorizontal, X, Plus } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

// Long-press duration for showing reaction picker on touch
const LONG_PRESS_MS = 400;

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<NetworkComment[]>([]);
  const [newContent, setNewContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followedComments, setFollowedComments] = useState<Record<string, boolean>>({});
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [commentReactions, setCommentReactions] = useState<Record<string, ReactionType | null>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const reactionPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReactionLongPress = useRef(false);
  const [commentReactionCounts, setCommentReactionCounts] = useState<Record<string, Record<string, number>>>({});
  const [reactionsModal, setReactionsModal] = useState<{ commentId: string; breakdown: any[]; loading: boolean; tab: string } | null>(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeMentions, setActiveMentions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newContent]);

  // Auto-focus inline reply textarea when reply mode activates
  useEffect(() => {
    if (replyingToId && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [replyingToId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user.id || null));

    async function fetchComments() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("feed_comments")
        .select(`
          *,
          author_profile:profiles!author_profile_id(full_name, username, avatar_url, is_verified),
          author_business:businesses(name, slug, logo_url, is_verified),
          author_organization:organizations(name, slug, logo_url, is_verified)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setComments(data as any[]);
        const ids = data.map((c: any) => c.id);
        if (ids.length > 0) {
          const { data: rxns } = await supabase
            .from("comment_reactions")
            .select("comment_id, reaction_type")
            .in("comment_id", ids);
          if (rxns) {
            const counts: Record<string, Record<string, number>> = {};
            rxns.forEach((r: any) => {
              if (!counts[r.comment_id]) counts[r.comment_id] = {};
              counts[r.comment_id][r.reaction_type] = (counts[r.comment_id][r.reaction_type] || 0) + 1;
            });
            setCommentReactionCounts(counts);
          }
        }
      }
      setIsLoading(false);
    }

    fetchComments();
  }, [postId]);

  // Top-level comment submit (bottom composer — no parent_id)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);

    let finalContent = newContent.trim();
    const sortedMentions = [...activeMentions].sort((a, b) => b.name.length - a.name.length);
    sortedMentions.forEach(m => {
       const linkPath = m.type === 'profile' ? `/people/${m.username_or_slug || m.id}`
                      : m.type === 'business' ? `/businesses/${m.username_or_slug || m.id}`
                      : `/organizations/${m.username_or_slug || m.id}`;
       const regex = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
       finalContent = finalContent.replace(regex, `[@${m.name}](${linkPath})`);
    });

    const { success, data } = await addPostComment(postId, finalContent, null);
    if (success && data && !Array.isArray(data)) {
      setComments((prev) => [...prev, data as any]);
      setNewContent("");
      setActiveMentions([]);
    }
    setIsSubmitting(false);
  };

  // Inline reply submit
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting || !replyingToId) return;

    setIsSubmitting(true);
    const { success, data } = await addPostComment(postId, replyContent.trim(), replyingToId);
    if (success && data && !Array.isArray(data)) {
      setComments(prev => [...prev, data as any]);
      setReplyContent("");
      setReplyingToId(null);
      setReplyingToName(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      const { success } = await deleteComment(commentId);
      if (success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    }
    setActiveOptionsId(null);
  };

  const handleEditCommentSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;
    const { success } = await editComment(commentId, editContent);
    if (success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent } : c));
      setEditingCommentId(null);
    } else {
      alert("Failed to update comment");
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "now";
  };

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewContent(val);

    const pos = e.target.selectionStart;
    setCursorPos(pos);

    const textBeforeCursor = val.slice(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (/[\s\n]/.test(charBeforeAt)) {
        const queryCandidate = textBeforeCursor.slice(lastAtIndex + 1);
        if (queryCandidate.length <= 50 && !queryCandidate.includes('\n')) {
          setMentionStartIdx(lastAtIndex);
          if (queryCandidate.length >= 2) {
            const results = await searchMentionSuggestions(queryCandidate);
            setMentionSuggestions(results);
            setSelectedIndex(0);
            setShowMentions(results.length > 0);
          } else {
            setShowMentions(false);
            setMentionSuggestions([]);
          }
          return;
        }
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (suggestion: MentionSuggestion) => {
    const mentionText = `@${suggestion.name} `;
    const textBeforeMention = newContent.slice(0, mentionStartIdx);
    const textAfterCursor = newContent.slice(cursorPos);
    setNewContent(textBeforeMention + mentionText + textAfterCursor);
    setShowMentions(false);
    if (!activeMentions.find(m => m.id === suggestion.id)) {
      setActiveMentions(prev => [...prev, suggestion]);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = textBeforeMention.length + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleCommentReaction = async (commentId: string, type: ReactionType) => {
    const prev = commentReactions[commentId] ?? null;
    const next = prev === type ? null : type;
    setCommentReactions(r => ({ ...r, [commentId]: next }));
    setCommentReactionCounts(c => {
      const cur = { ...(c[commentId] || {}) };
      if (prev && cur[prev]) { cur[prev]--; if (!cur[prev]) delete cur[prev]; }
      if (next) cur[next] = (cur[next] || 0) + 1;
      return { ...c, [commentId]: cur };
    });
    setShowReactionPicker(null);
    const { success } = await toggleCommentReaction(commentId, type);
    if (!success) {
      setCommentReactions(r => ({ ...r, [commentId]: prev }));
      setCommentReactionCounts(c => {
        const cur = { ...(c[commentId] || {}) };
        if (next && cur[next]) { cur[next]--; if (!cur[next]) delete cur[next]; }
        if (prev) cur[prev] = (cur[prev] || 0) + 1;
        return { ...c, [commentId]: cur };
      });
    }
  };

  const getTopReactionTypes = (commentId: string) =>
    Object.entries(commentReactionCounts[commentId] || {})
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

  const getTotalReactionCount = (commentId: string) =>
    Object.values(commentReactionCounts[commentId] || {}).reduce((a, b) => a + b, 0);

  const openReactionsModal = async (commentId: string) => {
    setReactionsModal({ commentId, breakdown: [], loading: true, tab: "all" });
    const { data } = await supabase
      .from("comment_reactions")
      .select("reaction_type, profile:profiles!profile_id(id, full_name, avatar_url, headline, is_verified)")
      .eq("comment_id", commentId)
      .order("created_at", { ascending: false });
    setReactionsModal(prev => prev ? { ...prev, breakdown: data || [], loading: false } : null);
  };

  const renderCommentContent = (content: string) => {
    const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        let colorClass = "text-[var(--accent)]";
        if (match[2].startsWith("/businesses")) colorClass = "text-blue-400";
        if (match[2].startsWith("/organizations")) colorClass = "text-green-400";
        return <Link key={i} href={match[2]} className={`${colorClass} font-semibold hover:underline`}>{match[1]}</Link>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const renderCommentThread = (comment: NetworkComment, isReply = false) => {
    let cAuthorName = "Unknown";
    let cAuthorAvatar = null;
    let cAuthorLink = "#";

    if (comment.author_profile) {
      cAuthorName = comment.author_profile.full_name || "User";
      cAuthorAvatar = comment.author_profile.avatar_url;
      cAuthorLink = comment.author_profile.username ? `/people/${comment.author_profile.username}` : "#";
    } else if (comment.author_business) {
      cAuthorName = comment.author_business.name;
      cAuthorAvatar = comment.author_business.logo_url;
      cAuthorLink = `/businesses/${comment.author_business.slug}`;
    } else if (comment.author_organization) {
      cAuthorName = comment.author_organization.name;
      cAuthorAvatar = comment.author_organization.logo_url;
      cAuthorLink = `/organizations/${comment.author_organization.slug}`;
    }

    const replies = getReplies(comment.id);
    const isEditing = editingCommentId === comment.id;
    // Which comment id this Reply button targets (replies-to-replies thread under parent)
    const replyTargetId = isReply ? comment.parent_id! : comment.id;
    const isActiveReplyTarget = replyingToId === replyTargetId;

    return (
      <div key={comment.id} className={`flex gap-3 text-sm flex-col ${isReply ? 'mt-1.5 pl-3 border-l border-white/[0.12]' : ''}`}>
        <div className="flex gap-3 items-start">
          <div className="relative shrink-0">
            <Link href={cAuthorLink} className="group block">
              <div className={`relative ${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden bg-black/20 border border-[var(--border)] group-hover:border-[var(--accent)] transition`}>
                {cAuthorAvatar ? (
                  <Image src={cAuthorAvatar} alt={cAuthorName} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#b08d57] text-xs">
                    {cAuthorName.charAt(0)}
                  </div>
                )}
              </div>
            </Link>
            {/* Quick Follow Overlay for Unfollowed Accounts */}
            {currentUserId !== comment.submitted_by && !followedComments[comment.submitted_by] && (
               <button 
                  onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setFollowedComments(prev => ({ ...prev, [comment.submitted_by]: true }));
                  }}
                  title={`Follow ${cAuthorName}`}
                  className="absolute -bottom-1 -right-0.5 bg-[#b08d57] text-[#151311] w-[14px] h-[14px] flex items-center justify-center border-2 border-[#161513] rounded-full hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-sm z-10"
               >
                  <Plus size={8} strokeWidth={4} />
               </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative group">
              <div className="flex justify-between items-start mb-1 gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <Link href={cAuthorLink} className="font-semibold hover:text-[var(--accent)] transition truncate">
                    {cAuthorName}
                  </Link>
                  <span className="text-xs opacity-50 shrink-0">{timeAgo(comment.created_at)}</span>
                </div>

                {currentUserId === comment.submitted_by && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveOptionsId(activeOptionsId === comment.id ? null : comment.id)}
                      className="opacity-40 md:opacity-0 md:group-hover:opacity-60 hover:!opacity-100 hover:text-[var(--accent)] transition p-1"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {activeOptionsId === comment.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveOptionsId(null)} />
                        <div className="absolute right-0 top-full mt-1 w-28 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-fade-in-up">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditContent(comment.content);
                              setActiveOptionsId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition"
                          >
                            Edit
                          </button>
                          <div className="h-px w-full bg-white/5" />
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-2 flex flex-col gap-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[10px] text-white/50 hover:text-white transition">Cancel</button>
                    <button onClick={() => handleEditCommentSubmit(comment.id)} className="px-3 py-1 text-[10px] bg-[var(--accent)] text-black font-bold rounded hover:bg-[#F2D06B] transition">Save</button>
                  </div>
                </div>
              ) : (
                <p className="opacity-90 whitespace-pre-wrap break-words">{renderCommentContent(comment.content)}</p>
              )}
            </div>

            {/* Comment action row */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isActiveReplyTarget) {
                      setReplyingToId(null);
                      setReplyingToName(null);
                      setReplyContent("");
                    } else {
                      setReplyingToId(replyTargetId);
                      setReplyingToName(cAuthorName);
                    }
                  }}
                  className={`text-[11px] font-semibold transition ${isActiveReplyTarget ? 'text-[#b08d57]' : 'text-white/40 hover:text-[#b08d57]'}`}
                >
                  Reply
                </button>
                <span className="text-white/10 text-xs">·</span>
                <div
                  className="relative"
                  onMouseEnter={() => setShowReactionPicker(comment.id)}
                  onMouseLeave={() => setShowReactionPicker(null)}
                >
                  <button
                    onTouchStart={() => {
                      isReactionLongPress.current = false;
                      reactionPressTimer.current = setTimeout(() => {
                        isReactionLongPress.current = true;
                        setShowReactionPicker(comment.id);
                      }, LONG_PRESS_MS);
                    }}
                    onTouchEnd={() => { if (reactionPressTimer.current) clearTimeout(reactionPressTimer.current); }}
                    onTouchMove={() => { if (reactionPressTimer.current) clearTimeout(reactionPressTimer.current); }}
                    onContextMenu={(e) => { if (isReactionLongPress.current) e.preventDefault(); }}
                    onClick={(e) => {
                      if (isReactionLongPress.current) { e.preventDefault(); return; }
                      handleCommentReaction(comment.id, commentReactions[comment.id] || 'like');
                    }}
                    className={`text-[11px] font-semibold transition flex items-center gap-1 ${commentReactions[comment.id] ? 'text-[#b08d57]' : 'text-white/40 hover:text-pink-400'}`}
                  >
                    <ReactionIcon
                      type={commentReactions[comment.id] || 'heart'}
                      size={12}
                      active={!!commentReactions[comment.id]}
                      showTooltip={false}
                      animateOnClick={false}
                    />
                    {commentReactions[comment.id]
                      ? (SUPPORTED_REACTIONS.find(r => r.type === commentReactions[comment.id])?.label ?? commentReactions[comment.id])
                      : 'Like'}
                  </button>
                  {showReactionPicker === comment.id && (
                    <>
                      {/* Backdrop to dismiss picker on tap outside */}
                      <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowReactionPicker(null)} />
                      <div className="absolute bottom-full left-0 pb-1.5 z-50">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-full px-2.5 py-1.5 flex gap-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                          {SUPPORTED_REACTIONS.map(({ type }) => (
                            <button
                              key={type}
                              onClick={(e) => { e.stopPropagation(); handleCommentReaction(comment.id, type); }}
                              className="p-0.5"
                            >
                              <ReactionIcon type={type} size={22} active={commentReactions[comment.id] === type} showTooltip={false} className="hover:-translate-y-1.5 hover:scale-110" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {getTotalReactionCount(comment.id) > 0 && (() => {
                const topTypes = getTopReactionTypes(comment.id);
                const dominantLabel = SUPPORTED_REACTIONS.find(r => r.type === topTypes[0])?.label ?? topTypes[0];
                return (
                  <button
                    onClick={() => openReactionsModal(comment.id)}
                    className="flex items-center gap-1 group"
                  >
                    <div className="flex -space-x-1">
                      {topTypes.map(type => (
                        <span key={type} className="leading-none" style={{ fontSize: '13px' }}>
                          {SUPPORTED_REACTIONS.find(r => r.type === type)?.emoji}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-white/40 group-hover:text-[#b08d57] transition font-semibold ml-0.5">
                      {getTotalReactionCount(comment.id)}
                    </span>
                    <span className="text-[11px] text-white/30 group-hover:text-[#b08d57]/70 transition">
                      {dominantLabel}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── Inline reply composer ─────────────────────────────────────────
            Only renders under top-level comments when this thread is active.
            Nested reply clicks set replyingToId = parent_id so this
            naturally appears under the correct top-level comment.
        ────────────────────────────────────────────────────────────────── */}
        {!isReply && replyingToId === comment.id && (
          <div className="pl-11">
            {/* Context strip */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="inline-block w-4 h-px bg-white/15 rounded-full" />
                Replying to{" "}
                <span className="font-semibold text-white/65">{replyingToName}</span>
              </span>
              <button
                type="button"
                onClick={() => { setReplyingToId(null); setReplyingToName(null); setReplyContent(""); }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition"
                aria-label="Cancel reply"
              >
                <X size={11} />
              </button>
            </div>

            {/* Composer row */}
            <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
              {/* Current user avatar */}
              <div className="w-6 h-6 rounded-full bg-[#b08d57]/20 border border-[#b08d57]/30 flex items-center justify-center text-[#b08d57] text-[10px] font-bold shrink-0 mb-[3px]">
                {currentUserId ? currentUserId.charAt(0).toUpperCase() : "?"}
              </div>

              {/* Unified input + send shell */}
              <div className="flex-1 flex items-end bg-black/25 border border-white/[0.07] rounded-2xl overflow-hidden transition-colors focus-within:border-[var(--accent)]/30 focus-within:bg-black/30">
                <textarea
                  ref={replyTextareaRef}
                  value={replyContent}
                  onChange={(e) => {
                    setReplyContent(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  placeholder="Write a reply…"
                  rows={1}
                  style={{ minHeight: "36px", fontSize: "16px" }}
                  className="flex-1 bg-transparent px-3 py-[7px] text-sm md:text-xs resize-none outline-none placeholder:text-white/20 leading-[1.45] overflow-hidden"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (replyContent.trim() && !isSubmitting) handleReplySubmit(e as any);
                    } else if (e.key === "Escape") {
                      setReplyingToId(null);
                      setReplyingToName(null);
                      setReplyContent("");
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  aria-label="Send reply"
                  className="shrink-0 w-[32px] h-[32px] md:w-[26px] md:h-[26px] m-[2px] rounded-[9px] bg-[var(--accent)] text-black flex items-center justify-center disabled:opacity-25 hover:bg-[#F2D06B] transition-colors"
                >
                  {isSubmitting
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Send size={11} className="translate-x-[1px]" />
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="ml-8 mt-1 space-y-2 relative">
            {replies.map(reply => renderCommentThread(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <div className="pt-2 pb-3 relative">

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin opacity-50" size={20} /></div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 mb-3">
          {topLevelComments.map((comment) => renderCommentThread(comment))}
        </div>
      ) : (
        <p className="text-[12px] text-white/25 py-1 mb-3">No comments yet.</p>
      )}

      {/* ── Top-level comment composer ───────────────────────────────────── */}
      <div className="flex items-end gap-2.5">
        {showMentions && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-[50] animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
            <div className="max-h-[40vh] md:max-h-96 overflow-y-auto custom-scrollbar pb-1" style={{ overscrollBehavior: 'contain' }}>
              {mentionSuggestions.map((suggestion, idx) => {
                const isOrg = suggestion.type === 'organization';
                const isBiz = suggestion.type === 'business';
                const typeColor = isOrg ? 'text-green-400' : isBiz ? 'text-blue-400' : 'text-[#b08d57]';
                const bgBorderColor = isOrg ? 'border-green-500/30' : isBiz ? 'border-blue-500/30' : 'border-[#b08d57]/30';
                return (
                  <button
                    key={`${suggestion.id}-${idx}`}
                    type="button"
                    onClick={() => handleMentionSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition border-b border-white/5 last:border-0 ${idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className={`relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-black/40 border ${bgBorderColor}`}>
                      {suggestion.avatar_url ? (
                        <Image src={suggestion.avatar_url} alt={suggestion.name} fill sizes="32px" className="object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${typeColor}`}>
                          {suggestion.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{suggestion.name}</span>
                      {suggestion.is_verified && <VerifiedBadge size="xs" className="shrink-0" />}
                      <span className={`flex-shrink-0 text-xs ml-auto capitalize px-2 py-0.5 rounded-full bg-black/40 border ${bgBorderColor} ${typeColor}`}>
                        {suggestion.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current user avatar */}
        <div className="w-8 h-8 rounded-full bg-[#b08d57]/20 border border-[#b08d57]/30 flex items-center justify-center text-[#b08d57] text-xs font-bold shrink-0 mb-[5px]">
          {currentUserId ? currentUserId.charAt(0).toUpperCase() : "?"}
        </div>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="flex items-end bg-black/20 border border-[var(--border)] rounded-2xl overflow-hidden transition-colors focus-within:border-[var(--accent)]">
            <textarea
              id={`comment-textarea-${postId}`}
              name={`comment-textarea-${postId}`}
              ref={textareaRef}
              value={newContent}
              onChange={handleTextChange}
              placeholder="Write a comment… (Type @ to mention)"
              rows={1}
              style={{ fontSize: "16px" }}
              className="flex-1 bg-transparent pl-4 pr-2 py-3 text-sm focus:outline-none resize-none overflow-hidden placeholder:text-white/30 leading-snug"
              onKeyDown={(e) => {
                if (showMentions) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < mentionSuggestions.length - 1 ? prev + 1 : prev));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (mentionSuggestions[selectedIndex]) {
                      handleMentionSelect(mentionSuggestions[selectedIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    setShowMentions(false);
                  }
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newContent.trim() && !isSubmitting) {
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={!newContent.trim() || isSubmitting}
              className="shrink-0 w-[36px] h-[36px] md:w-[30px] md:h-[30px] m-[4px] bg-[var(--accent)] text-black rounded-[10px] flex items-center justify-center hover:bg-[#F2D06B] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} className="translate-x-[1px]" />}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Reactions Modal */}
    {reactionsModal && typeof document !== "undefined" && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
        onClick={() => setReactionsModal(null)}
      >
        <div
          className="bg-[#0e0e0e] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250 max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-bold text-white tracking-wide">Reactions</h2>
            <button
              onClick={() => setReactionsModal(null)}
              className="w-7 h-7 rounded-full bg-white/[0.05] flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition"
            >
              <X size={13} />
            </button>
          </div>

          {!reactionsModal!.loading && reactionsModal!.breakdown.length > 0 && (
            <div className="flex items-center gap-1 px-4 pt-3 pb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setReactionsModal(prev => prev ? { ...prev, tab: 'all' } : null)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                  reactionsModal!.tab === 'all'
                    ? 'bg-[#b08d57]/15 text-[#b08d57] border border-[#b08d57]/25'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                All {reactionsModal!.breakdown.length}
              </button>
              {Object.entries(
                reactionsModal!.breakdown.reduce((acc: Record<string, number>, r: any) => {
                  acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setReactionsModal(prev => prev ? { ...prev, tab: type } : null)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap ${
                      reactionsModal!.tab === type
                        ? 'bg-[#b08d57]/15 text-[#b08d57] border border-[#b08d57]/25'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{SUPPORTED_REACTIONS.find(r => r.type === type)?.emoji}</span>
                    <span>{count}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {reactionsModal!.loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-white/20" size={20} /></div>
            ) : (() => {
              const filtered = reactionsModal!.tab === 'all'
                ? reactionsModal!.breakdown
                : reactionsModal!.breakdown.filter((r: any) => r.reaction_type === reactionsModal!.tab);
              return filtered.length > 0 ? filtered.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition">
                  <div className="relative shrink-0">
                    {r.profile?.avatar_url ? (
                      <Image src={r.profile.avatar_url} alt={r.profile.full_name || ''} width={40} height={40} className="rounded-full border border-white/[0.08]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/15 flex items-center justify-center text-sm font-bold text-[#b08d57]">
                        {r.profile?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 leading-none bg-[#0e0e0e] rounded-full p-0.5" style={{ fontSize: '13px' }}>
                      {SUPPORTED_REACTIONS.find(rx => rx.type === r.reaction_type)?.emoji || '👍'}
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-white truncate">{r.profile?.full_name || 'Unknown'}</span>
                      {r.profile?.is_verified && <VerifiedBadge size="xs" className="shrink-0" />}
                    </div>
                    {r.profile?.headline && (
                      <span className="text-xs text-white/30 truncate mt-0.5">{r.profile.headline}</span>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-white/20 text-sm">No reactions yet</div>
              );
            })()}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
