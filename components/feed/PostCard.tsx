import { NetworkPost } from "@/lib/types/network-feed";
import { MessageCircle, Share2, MoreHorizontal, Repeat, ExternalLink, X, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { togglePostReaction, ReactionType, deletePost, editPost } from "@/lib/services/feedService";
import PostComments from "./PostComments";
import { ReactionIcon } from "@/components/ui/ReactionIcon";
import { useActor } from "@/components/providers/ActorProvider";
import { supabase } from "@/lib/supabase";

export default function PostCard({ post }: { post: NetworkPost }) {
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.user_reaction_type || null);
  const [reactionCount, setReactionCount] = useState(post.likes_count || 0);
  const [isReacting, setIsReacting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showRepostOptions, setShowRepostOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostThoughts, setRepostThoughts] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reactionBreakdown, setReactionBreakdown] = useState<any[]>([]);
  const [uniqueReactionIcons, setUniqueReactionIcons] = useState<ReactionType[]>(post.likes_count ? ['like'] : []);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  
  const [toastMessage, setToastMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  
  const { currentActor } = useActor();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserIdSession(data.session?.user.id));
    
    // Fetch unique reaction breakdown if there are likes recorded
    if (reactionCount > 0) {
      supabase
        .from('feed_likes')
        .select(`
          reaction_type,
          created_at,
          profile:profiles!profile_id(id, full_name, avatar_url, headline, is_verified)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setReactionBreakdown(data);
            const types = Array.from(new Set(data.map(d => d.reaction_type))).slice(0, 3) as ReactionType[];
            setUniqueReactionIcons(types);
          }
        });
    }
    
    // Close dropdowns on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
      if (repostOptionsRef.current && !repostOptionsRef.current.contains(event.target as Node)) {
        setShowRepostOptions(false);
      }
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [post.id]);

  const setUserIdSession = (id?: string) => {
    if (id) setCurrentUserId(id);
  }

  // Determine if current user owns this post
  // (Assuming personal profile ownership for now, logic can be expanded)
  const isOwner = currentUserId === post.author_profile_id;


  // Determine author details based on the populated actor association
  let authorName = "Unknown";
  let authorAvatar = null;
  let authorHeadline = "";
  let authorLink = "#";
  let isVerified = false;

  console.log('PostCard render payload:', post);

  if (post.author_profile) {
    authorName = post.author_profile.full_name || "User";
    authorAvatar = post.author_profile.avatar_url;
    authorHeadline = post.author_profile.headline || "Member";
    authorLink = post.author_profile.username ? `/people/${post.author_profile.username}` : "#";
    isVerified = post.author_profile.is_verified;
  } else if (post.author_business) {
    authorName = post.author_business.name;
    authorAvatar = post.author_business.logo_url;
    authorHeadline = post.author_business.business_type || "Business";
    authorLink = `/businesses/${post.author_business.slug}`;
    isVerified = post.author_business.is_verified;
  } else if (post.author_organization) {
    authorName = post.author_organization.name;
    authorAvatar = post.author_organization.logo_url;
    authorHeadline = post.author_organization.organization_type || "Organization";
    authorLink = `/organizations/${post.author_organization.slug}`;
    isVerified = post.author_organization.is_verified;
  }

  // Handle Reactions
  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;

    // Optimistically update UI
    setIsReacting(true);
    setShowReactions(false);
    const previousReaction = activeReaction;
    
    const updateBreakdown = (newType: ReactionType | null) => {
      setReactionBreakdown(prev => {
        let next = [...prev];
        const existingIdx = next.findIndex(r => r.profile?.id && r.profile.id === currentUserId);
        
        if (newType === null) {
          if (existingIdx >= 0) next.splice(existingIdx, 1);
        } else {
          if (existingIdx >= 0) {
            next[existingIdx] = { ...next[existingIdx], reaction_type: newType };
          } else {
            next.unshift({
              reaction_type: newType,
              created_at: new Date().toISOString(),
              profile: {
                id: currentUserId,
                full_name: currentActor?.name || "You",
                avatar_url: currentActor?.avatar_url,
                headline: currentActor?.type || "Member",
                is_verified: false
              }
            });
          }
        }
        const types = Array.from(new Set(next.map(d => d.reaction_type))).slice(0, 3) as ReactionType[];
        setUniqueReactionIcons(types);
        return next;
      });
    };

    if (activeReaction === type) {
      // Un-reacting
      setActiveReaction(null);
      setReactionCount((prev) => prev - 1);
      updateBreakdown(null);
    } else {
      // Reacting (either fresh or switching)
      if (!activeReaction) {
        setReactionCount((prev) => prev + 1);
      }
      setActiveReaction(type);
      updateBreakdown(type);
    }

    try {
      const { success } = await togglePostReaction(post.id, type);
      if (!success) {
        // Revert on failure
        setActiveReaction(previousReaction);
        updateBreakdown(previousReaction);
        if (activeReaction === type) setReactionCount((prev) => prev + 1);
        else if (!previousReaction) setReactionCount((prev) => prev - 1);
      }
    } catch (e) {
      // Revert on throw
      setActiveReaction(previousReaction);
      updateBreakdown(previousReaction);
      if (activeReaction === type) setReactionCount((prev) => prev + 1);
      else if (!previousReaction) setReactionCount((prev) => prev - 1);
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true);
      const { success } = await deletePost(post.id);
      if (success && typeof window !== 'undefined') {
        window.location.reload(); // Simple refresh for now (can use state lift later)
      } else {
        setIsDeleting(false);
        showToast("Failed to delete post", "error");
      }
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setIsReacting(true); // Re-use loading state
    const { success } = await editPost(post.id, editContent);
    setIsReacting(false);
    if (success) {
      setIsEditing(false);
      // Optimistically update
      post.content = editContent; 
    } else {
      alert("Failed to update post");
    }
  };

  const handleRepost = async () => {
    setShowRepostOptions(false);
    setIsReacting(true);
    try {
      // Basic instant repost
      const targetId = post.original_post ? post.original_post.id : post.id;
      const { error } = await supabase.from('feed_posts').insert({
        submitted_by: currentUserId,
        author_profile_id: currentUserId,
        content: '',
        post_type: 'general',
        original_post_id: targetId,
      });
      if (error) throw error;
      showToast("Successfully Reposted");
      setShowRepostOptions(false);
    } catch (e: any) {
      console.error(e);
      showToast("Failed to repost: " + e.message, "error");
    } finally {
      setIsReacting(false);
    }
  };

  const handleOpenRepostModal = () => {
    setShowRepostOptions(false);
    setShowRepostModal(true);
  };

  const handleRepostWithThoughts = () => {
    if (!repostThoughts.trim()) return;
    setIsReacting(true);
    const targetId = post.original_post ? post.original_post.id : post.id;
    supabase.from('feed_posts').insert({
      submitted_by: currentUserId,
      author_profile_id: currentUserId,
      content: repostThoughts,
      post_type: 'general',
      original_post_id: targetId,
    }).then(({ error }) => {
      setIsReacting(false);
      setShowRepostModal(false);
      setRepostThoughts("");
      if (error) showToast("Failed to repost: " + error.message, "error");
      else showToast("Successfully Reposted");
    });
  };

  const handleCopyLink = () => {
    setShowShareOptions(false);
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied to clipboard!");
    });
  };

  const handleNativeShare = async () => {
    setShowShareOptions(false);
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${authorName} on WAC`,
          text: post.content ? post.content.substring(0, 100) + '...' : '',
          url: url
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const repostOptionsRef = useRef<HTMLDivElement>(null);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  if (isDeleting) {
    return null; // Optimistic hide
  }

  // Format relative time
  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  };

  return (
    <div className="wac-card p-5 mb-4 hover:border-[var(--accent)]/30 transition-colors relative">
      
      {/* Repost Badge */}
      {post.original_post_id && (
        <div className="flex items-center gap-2 text-xs font-semibold text-white/50 mb-3 pb-3 border-b border-white/5">
          <Repeat size={14} strokeWidth={2} className="text-[#D4AF37]" />
          <span>{authorName} reposted this</span>
        </div>
      )}

      {/* Header (Depends on if repost or original) */}
      <div className="flex items-start justify-between mb-4">
        <Link href={authorLink} className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[rgba(255,255,255,0.05)] border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors">
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#D4AF37]">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-[0.95rem] group-hover:text-[var(--accent)] transition-colors">
                {authorName}
              </h3>
              {isVerified && (
                <svg
                  className="w-3.5 h-3.5 text-[#D4AF37]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M10.081.9C11.239.199 12.761.199 13.919.9l1.455.882c.49.297 1.05.438 1.611.408l1.7-.091c1.353-.072 2.553.844 2.89 2.158l.423 1.64c.143.553.438 1.05.85 1.45L24 8.527c.974.945.974 2.505 0 3.45l-1.152 1.118c-.412.4-.707.897-.85 1.45l-.423 1.64c-.337 1.314-1.537 2.23-2.89 2.158l-1.7-.091c-.56-.03-1.121.111-1.611.408l-1.455.882c-1.158.701-2.68.701-3.838 0l-1.455-.882c-.49-.297-1.05-.438-1.611-.408l-1.7.091c-1.353.072-2.553-.844-2.89-2.158l-.423-1.64c-.143-.553-.438-1.05-.85-1.45L0 11.977c-.974-.945-.974-2.505 0-3.45l1.152-1.118c.412-.4.707-.897.85-1.45l.423-1.64c.337-1.314 1.537-2.23 2.89-2.158l1.7.091c.56.03 1.121-.111 1.611-.408L10.081.9z" />
                </svg>
              )}
            </div>
            <p className="text-xs opacity-60 leading-tight">
              {authorHeadline} • {timeAgo(post.created_at)}
            </p>
          </div>
        </Link>
        {isOwner && (
          <div className="relative" ref={optionsRef}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="opacity-40 hover:opacity-100 hover:text-[var(--accent)] transition p-1"
            >
              <MoreHorizontal size={18} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-fade-in-up">
                <button 
                  onClick={() => { setIsEditing(true); setShowOptions(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition"
                >
                  Edit Post
                </button>
                <div className="h-px w-full bg-white/5" />
                <button 
                  onClick={() => { handleDelete(); setShowOptions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
           <div className="flex flex-col gap-2">
             <textarea 
               value={editContent}
               onChange={(e) => setEditContent(e.target.value)}
               className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] min-h-[100px]"
             />
             <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition">Cancel</button>
                <button onClick={handleEditSubmit} disabled={isReacting} className="px-4 py-1.5 text-xs bg-[var(--accent)] text-black font-bold rounded-lg hover:bg-[#F2D06B] transition">Save</button>
             </div>
           </div>
        ) : (
          post.content && (
            <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )
        )}
        
        {post.image_url && (
          <div className="mt-3 relative w-full h-[300px] rounded-xl overflow-hidden border border-[var(--border)]">
            <Image src={post.image_url} alt="Post Attachment" fill className="object-cover" />
          </div>
        )}

        {/* Embedded Original Post */}
        {post.original_post && (
          <div className="mt-4 border border-[var(--border)] rounded-xl p-4 bg-white/5">
            <div className="flex items-center gap-2 mb-2">
              {post.original_post.author_profile?.avatar_url ? (
                 <Image src={post.original_post.author_profile.avatar_url} alt="Author" width={24} height={24} className="rounded-full" />
              ) : (
                 <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
                   {post.original_post.author_profile?.full_name?.charAt(0) || "U"}
                 </div>
              )}
              <span className="text-xs font-semibold">{post.original_post.author_profile?.full_name || "User"}</span>
              <span className="text-xs opacity-50">• {timeAgo(post.original_post.created_at)}</span>
            </div>
            <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap line-clamp-4">
              {post.original_post.content}
            </p>
            {post.original_post.image_url && (
               <div className="mt-2 relative w-full h-[150px] rounded-lg overflow-hidden border border-white/10">
                 <Image src={post.original_post.image_url} alt="Post Attachment" fill className="object-cover" />
               </div>
            )}
          </div>
        )}
      </div>

    {/* Stats Bar (Social Proof) */}
      {(reactionCount > 0 || post.comments_count > 0 || (post.repost_count || 0) > 0) && (
        <div className="flex justify-between items-center text-[11px] text-white/50 pb-3 px-1">
          <div 
            className="flex items-center gap-1.5 hover:text-[var(--accent)] cursor-pointer transition-colors"
            onClick={() => setShowReactionsModal(true)}
          >
            {reactionCount > 0 && (
              <>
                <div className="flex -space-x-1">
                  {uniqueReactionIcons.map((type, i) => (
                    <ReactionIcon key={type || i} type={type || 'like'} size={14} active={false} className={`relative z-[${10-i}] drop-shadow-md bg-[#1a1a1a] rounded-full`} />
                  ))}
                </div>
                <span className="font-medium ml-1">{reactionCount.toLocaleString()}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {post.comments_count > 0 && (
              <span className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors" onClick={() => setShowComments(!showComments)}>
                {post.comments_count.toLocaleString()} {post.comments_count === 1 ? 'comment' : 'comments'}
              </span>
            )}
            {post.comments_count > 0 && (post.repost_count || 0) > 0 && <span>•</span>}
            {(post.repost_count || 0) > 0 && (
              <span className="hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors">
                {post.repost_count!.toLocaleString()} {post.repost_count === 1 ? 'repost' : 'reposts'}
              </span>
            )}
          </div>
        </div>
      )}

    {/* Footer / Actions */}
      <div className="flex justify-between items-center sm:px-6 px-2 border-t border-[var(--border)] pt-3 pb-1 relative">
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button 
            onTouchStart={() => {
              isLongPress.current = false;
              pressTimer.current = setTimeout(() => {
                isLongPress.current = true;
                setShowReactions(true);
              }, 400); // 400ms long press
            }}
            onTouchEnd={() => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
            }}
            onTouchMove={() => {
              // Cancel if the user starts scrolling
              if (pressTimer.current) clearTimeout(pressTimer.current);
            }}
            onContextMenu={(e) => {
              // Prevent context menu from popping up on mobile long press
              if (isLongPress.current) e.preventDefault();
            }}
            onClick={(e) => {
              if (isLongPress.current) {
                e.preventDefault();
                return;
              }
              handleReaction(activeReaction || 'like');
            }}
            disabled={isReacting}
            className={`group flex items-center gap-2 text-xs font-medium transition select-none ${activeReaction ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}
          >
            <ReactionIcon type={activeReaction || 'like'} size={18} active={!!activeReaction} animateOnClick={false} className={activeReaction === 'like' || !!activeReaction ? "" : "group-hover:scale-110 transition-transform"} />
          </button>

          {/* Reaction Popover */}
          {showReactions && (
            <div className="absolute bottom-full left-[-10px] pb-2 z-50 w-max">
              <div 
                className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-2 flex gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
                onClick={() => setShowReactions(false)}
              >
                <button onClick={(e) => { e.stopPropagation(); handleReaction('like'); }} className="p-1">
                  <ReactionIcon type="like" size={28} active={activeReaction === 'like'} className="hover:-translate-y-2 hover:scale-110" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReaction('heart'); }} className="p-1">
                  <ReactionIcon type="heart" size={28} active={activeReaction === 'heart'} className="hover:-translate-y-2 hover:scale-110" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReaction('laugh'); }} className="p-1">
                  <ReactionIcon type="laugh" size={28} active={activeReaction === 'laugh'} className="hover:-translate-y-2 hover:scale-110" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleReaction('applause'); }} className="p-1">
                  <ReactionIcon type="applause" size={28} active={activeReaction === 'applause'} className="hover:-translate-y-2 hover:scale-110" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-xs font-medium opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition"
          >
            <MessageCircle size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative flex items-center" ref={repostOptionsRef}>
          <button 
            onClick={() => setShowRepostOptions(!showRepostOptions)}
            className="flex items-center gap-2 text-xs font-medium opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition"
          >
            <Repeat size={18} strokeWidth={1.5} />
          </button>
          
          {/* Repost Options Popover */}
          {showRepostOptions && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[120%] mb-1 w-max min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-fade-in-up">
              <button 
                onClick={handleRepost}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <Repeat size={16} strokeWidth={1.5} />
                <span>Repost</span>
              </button>
              <div className="h-px w-full bg-white/5" />
              <button 
                onClick={handleOpenRepostModal}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <MessageCircle size={16} strokeWidth={1.5} />
                <span>Repost with thoughts</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center" ref={shareOptionsRef}>
          <button 
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex items-center gap-2 text-xs font-medium opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
          
          {/* Share Options Popover */}
          {showShareOptions && (
            <div className="absolute right-0 bottom-[120%] mb-1 w-max min-w-[200px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-fade-in-up">
              {/* Internal Message Route */}
              <button 
                onClick={() => { 
                  setShowShareOptions(false); 
                  const url = `${window.location.origin}/post/${post.id}`;
                  window.dispatchEvent(new CustomEvent('open-mini-chat', { detail: { text: "Check out this post: " + url } }));
                  showToast("Opening WAC Messages..."); 
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3 text-[#D4AF37] font-semibold"
              >
                <div className="w-6 flex justify-center"><MessageCircle size={16} strokeWidth={2} className="text-[#D4AF37]" /></div>
                <span>Send in WAC Message</span>
              </button>
              
              <div className="h-px w-full bg-white/5" />
              
              {/* Copy Link Route */}
              <button 
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <div className="w-6 flex justify-center"><ExternalLink size={16} strokeWidth={1.5} /></div>
                <span>Copy Link</span>
              </button>
              
              {/* Native External Share Trigger */}
              <button 
                onClick={handleNativeShare}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <div className="w-6 flex justify-center"><Share2 size={16} strokeWidth={1.5} /></div>
                <span>Share via...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <PostComments postId={post.id} />
      )}

      {/* Global In-App Toast for feedback */}
      {toastMessage && typeof document !== 'undefined' && createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-max max-w-[90vw] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl border border-white/10 ${toastMessage.type === 'error' ? 'bg-red-500/90 text-white backdrop-blur-md' : 'bg-[#1a1a1a]/95 text-white backdrop-blur-md'}`}>
            {toastMessage.type === 'success' && <CheckCircle2 size={16} className="text-[#D4AF37]" strokeWidth={2.5} />}
            {toastMessage.type === 'error' && <X size={16} strokeWidth={2.5} />}
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{toastMessage.text}</span>
          </div>
        </div>,
        document.body
      )}

      {/* Repost Modal Overlay */}
      {showRepostModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[var(--border)] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold">Repost</h2>
              <button 
                onClick={() => setShowRepostModal(false)} 
                className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-5">
              
              <div className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)] flex-shrink-0 flex items-center justify-center font-bold text-[#D4AF37]">
                  {currentActor?.avatar_url ? (
                    <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
                  ) : (
                    currentActor?.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="flex-1 mt-1">
                  <textarea 
                    placeholder="Add your thoughts..."
                    value={repostThoughts}
                    onChange={(e) => setRepostThoughts(e.target.value)}
                    autoFocus
                    rows={2}
                    className="w-full bg-transparent pl-1 border-none outline-none focus:outline-none focus:ring-0 text-base resize-none placeholder:text-white/40 placeholder:font-medium text-white font-medium"
                  />
                </div>
              </div>

              {/* Nested Post Preview */}
              <div className="border border-[var(--border)] rounded-xl p-4 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  {authorAvatar ? (
                    <Image src={authorAvatar} alt={authorName} width={20} height={20} className="rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center text-[9px] font-bold text-[#D4AF37]">
                      {authorName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold">{authorName}</span>
                </div>
                {post.content && (
                  <p className="text-xs opacity-70 leading-relaxed mt-1 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
              <span className="text-xs opacity-50 hidden sm:block">Posting safely to WAC Network</span>
              <div className="flex items-center justify-end gap-3 flex-1">
                <button 
                  onClick={() => setShowRepostModal(false)}
                  className="px-4 py-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRepostWithThoughts}
                  disabled={isReacting || !repostThoughts.trim()}
                  className="bg-[#D4AF37] text-black hover:bg-[#F2D06B] px-5 py-2 text-sm font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isReacting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reactions List Modal Overlay */}
      {showReactionsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold">Reactions</h2>
              <button onClick={() => setShowReactionsModal(false)} className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
               {reactionBreakdown.map((r, idx) => (
                 <div key={idx} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition cursor-pointer">
                    <div className="relative">
                      {r.profile?.avatar_url ? (
                        <Image src={r.profile.avatar_url} alt="" width={40} height={40} className="rounded-full border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                          {r.profile?.full_name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-0.5 border border-white/10">
                        <ReactionIcon type={r.reaction_type} size={14} active={false} />
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-sm truncate">{r.profile?.full_name || "Unknown"}</span>
                        {r.profile?.is_verified && <CheckCircle2 size={12} className="text-[#D4AF37]" />}
                      </div>
                      <span className="text-xs text-white/50 truncate">{r.profile?.headline || "Member"}</span>
                    </div>
                 </div>
               ))}
               {reactionBreakdown.length === 0 && (
                 <div className="text-center py-8 text-white/50 text-sm">Loading individual reactions...</div>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
