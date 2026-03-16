"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { NetworkComment } from "@/lib/types/network-feed";
import { addPostComment, searchMentionSuggestions, MentionSuggestion, deleteComment, editComment } from "@/lib/services/feedService";
import Image from "next/image";
import Link from "next/link";
import { Send, Loader2, MoreHorizontal } from "lucide-react";

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<NetworkComment[]>([]);
  const [newContent, setNewContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeMentions, setActiveMentions] = useState<MentionSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [newContent]);

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
      }
      setIsLoading(false);
    }

    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Convert "@Name" back into "[(Name)](/link)" rich markdown before saving
    let finalContent = newContent.trim();
    
    // Sort mentions by length descending so longer names don't get partially replaced by shorter ones
    const sortedMentions = [...activeMentions].sort((a, b) => b.name.length - a.name.length);
    
    sortedMentions.forEach(m => {
       const linkPath = m.type === 'profile' ? `/people/${m.username_or_slug || m.id}` 
                      : m.type === 'business' ? `/businesses/${m.username_or_slug || m.id}`
                      : `/organizations/${m.username_or_slug || m.id}`;
                      
       // Replace @Name with markdown link
       // We use a global regex to replace all instances of that specific tag
       const regex = new RegExp(`@${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
       finalContent = finalContent.replace(regex, `[@${m.name}](${linkPath})`);
    });

    const { success, data } = await addPostComment(postId, finalContent, replyingToId);
    
    if (success && data && !Array.isArray(data)) {
      setComments((prev) => [...prev, data as any]);
      setNewContent("");
      setActiveMentions([]); // clear memory
      setReplyingToId(null);
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
      // Ensure the '@' is either at the beginning or preceded by a space/newline
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      
      if (/[\s\n]/.test(charBeforeAt)) {
        const queryCandidate = textBeforeCursor.slice(lastAtIndex + 1);
        
        // Allow up to 50 characters for a search (enough for first + last name + spaces)
        // Stop searching if there's a newline
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
    // We only insert the plain text @Name so the text field looks clean to the user
    // Add a trailing space automatically so they can keep typing easily
    const mentionText = `@${suggestion.name} `;
    
    const textBeforeMention = newContent.slice(0, mentionStartIdx);
    const textAfterCursor = newContent.slice(cursorPos);
    
    setNewContent(textBeforeMention + mentionText + textAfterCursor);
    setShowMentions(false);
    
    // Remember this mention so we can convert it to markdown privately on submit
    if (!activeMentions.find(m => m.id === suggestion.id)) {
      setActiveMentions(prev => [...prev, suggestion]);
    }
    
    // Programmatically set the cursor position right after the inserted space
    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = textBeforeMention.length + mentionText.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const renderCommentContent = (content: string) => {
    // Basic markdown link parser: [name](/link)
    const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        let colorClass = "text-[var(--accent)]"; // default gold for people
        if (match[2].startsWith("/businesses")) colorClass = "text-blue-400";
        if (match[2].startsWith("/organizations")) colorClass = "text-green-400";
        
        return <Link key={i} href={match[2]} className={`${colorClass} font-semibold hover:underline`}>{match[1]}</Link>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Build a comment tree
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

    return (
      <div key={comment.id} className={`flex gap-3 text-sm flex-col ${isReply ? 'mt-3 pl-2 sm:pl-4 border-l-2 border-white/5' : ''}`}>
        <div className="flex gap-3 items-start">
          <Link href={cAuthorLink} className="shrink-0 group">
            <div className={`relative ${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden bg-black/20 border border-[var(--border)] group-hover:border-[var(--accent)] transition`}>
              {cAuthorAvatar ? (
                <Image src={cAuthorAvatar} alt={cAuthorName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">
                  {cAuthorName.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
             <div className="bg-black/20 rounded-2xl rounded-tl-[4px] p-3 border border-[var(--border)]/50 relative group">
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
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-[var(--accent)] transition p-1"
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
             
             {/* Comment Actions Area */}
             <div className="flex items-center gap-4 mt-1.5 px-2">
               <button 
                 onClick={() => {
                   setReplyingToId(isReply ? comment.parent_id! : comment.id);
                   textareaRef.current?.focus();
                 }} 
                 className="text-xs font-semibold text-white/50 hover:text-[var(--accent)] transition"
               >
                 Reply
               </button>
             </div>
          </div>
        </div>

        {/* Render nested replies */}
        {replies.length > 0 && (
          <div className="ml-8 mt-1 space-y-2 relative">
            {replies.map(reply => renderCommentThread(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)] relative">
      
      {/* Existing Comments list */}
      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin opacity-50" size={20} /></div>
      ) : comments.length > 0 ? (
        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {topLevelComments.map((comment) => renderCommentThread(comment))}
        </div>
      ) : (
        <div className="text-center text-sm opacity-50 py-2 mb-4">No comments yet. Be the first to start a discussion!</div>
      )}

      {/* Input Field */}
      <div className="relative">
        {showMentions && mentionSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-[#1a1a1a] border border-[#333] rounded-xl shadow-xl overflow-hidden z-[50] animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
            <div className="max-h-96 overflow-y-auto custom-scrollbar pb-1">
              {mentionSuggestions.map((suggestion, idx) => {
                const isOrg = suggestion.type === 'organization';
                const isBiz = suggestion.type === 'business';
                const typeColor = isOrg ? 'text-green-400' : isBiz ? 'text-blue-400' : 'text-[#D4AF37]';
                const bgBorderColor = isOrg ? 'border-green-500/30' : isBiz ? 'border-blue-500/30' : 'border-[#D4AF37]/30';

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
                        <Image src={suggestion.avatar_url} alt={suggestion.name} fill className="object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${typeColor}`}>
                          {suggestion.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{suggestion.name}</span>
                      {suggestion.is_verified && (
                        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10.081.9C11.239.199 12.761.199 13.919.9l1.455.882c.49.297 1.05.438 1.611.408l1.7-.091c1.353-.072 2.553.844 2.89 2.158l.423 1.64c.143.553.438 1.05.85 1.45L24 8.527c.974.945.974 2.505 0 3.45l-1.152 1.118c-.412.4-.707.897-.85 1.45l-.423 1.64c-.337 1.314-1.537 2.23-2.89 2.158l-1.7-.091c-.56-.03-1.121.111-1.611.408l-1.455.882c-1.158.701-2.68.701-3.838 0l-1.455-.882c-.49-.297-1.05-.438-1.611-.408l-1.7.091c-1.353.072-2.553-.844-2.89-2.158l-.423-1.64c-.143-.553-.438-1.05-.85-1.45L0 11.977c-.974-.945-.974-2.505 0-3.45l1.152-1.118c.412-.4.707-.897.85-1.45l.423-1.64c.337-1.314 1.537-2.23 2.89-2.158l1.7.091c.56.03 1.121-.111 1.611-.408L10.081.9z"/>
                        </svg>
                      )}
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
        
        <form onSubmit={handleSubmit} className="relative w-full">
          {replyingToId && (
            <div className="flex items-center justify-between text-xs px-4 py-2 bg-white/5 rounded-t-xl border-t border-x border-white/10">
              <span className="text-white/70">
                Replying to <span className="font-semibold">{comments.find(c => c.id === replyingToId)?.author_profile?.full_name || 'user'}</span>
              </span>
              <button 
                type="button" 
                onClick={() => setReplyingToId(null)}
                className="hover:text-red-400 transition"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newContent}
              onChange={handleTextChange}
              placeholder="Write a comment... (Type @ to mention)"
              rows={1}
              className={`w-full bg-black/20 border border-[var(--border)] ${replyingToId ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'} pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-[var(--accent)] resize-none overflow-hidden`}
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
              className="absolute right-2 bottom-2 shrink-0 w-8 h-8 bg-[var(--accent)] text-black rounded-xl flex items-center justify-center hover:bg-[#F2D06B] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} className="ml-0.5" />}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
}
