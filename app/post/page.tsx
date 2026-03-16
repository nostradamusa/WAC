"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { Image, Loader2, Video, FileText, X, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComposePostPage() {
  const { currentActor, isLoading } = useActor();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!currentActor) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-serif text-white mb-4">Sign in to post</h1>
        <p className="opacity-70 mb-8">You need an account to post to the global network.</p>
        <Link href="/login" className="wac-button-primary bg-[var(--accent)] text-black">Log In</Link>
      </div>
    );
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Construct the payload based on current actor
      const payload: any = {
        submitted_by: user.id,
        content: content.trim(),
        post_type: 'general',
      };

      if (currentActor?.type === 'person') {
        payload.author_profile_id = currentActor.id;
      } else if (currentActor?.type === 'business') {
        payload.author_business_id = currentActor.id;
      } else if (currentActor?.type === 'organization') {
        payload.author_organization_id = currentActor.id;
      }

      const { error: insertError } = await supabase
        .from("feed_posts")
        .insert(payload);

      if (insertError) throw insertError;

      router.push("/community"); // Redirect back to feed
    } catch (err: any) {
      console.error("Failed to post:", err);
      setError(err.message || "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-2 md:pt-6 animate-in slide-in-from-right-[100%] fade-in duration-700 ease-out fill-mode-forwards">
      <div className="max-w-2xl mx-auto px-4 mt-2 sm:mt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition" aria-label="Cancel">
              <X className="w-6 h-6 outline-none" />
            </button>
            <span className="font-bold text-lg hidden sm:inline opacity-0">New Post</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--accent)] text-sm font-bold opacity-80 cursor-pointer hidden sm:block hover:opacity-100 transition">Drafts</span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="py-1.5 px-5 text-sm font-bold rounded-full flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/10"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Post
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mb-4 p-3 bg-red-500/10 rounded-xl">{error}</p>}

        {/* Content Area */}
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)] flex-shrink-0 flex items-center justify-center font-bold text-[#D4AF37] border border-[var(--border)] relative z-10">
            {currentActor.avatar_url ? (
               <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
            ) : (
               currentActor.name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 pb-20 mt-1">
             <div className="mb-2 flex items-center gap-2">
                <span className="font-bold text-[15px]">{currentActor.name}</span>
             </div>
             
             <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              rows={2}
              className="w-full bg-transparent text-lg sm:text-xl focus:outline-none resize-none pl-1 placeholder:text-white/40 mb-2 leading-relaxed"
              disabled={isSubmitting}
              autoFocus
            />

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 pt-4">
              <button
                type="button"
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-[var(--accent)]"
                title="Add Video (Coming Soon)"
              >
                <Video className="w-5 h-5" />
                <span className="hidden sm:inline opacity-80">Video</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-[var(--accent)]"
                title="Add Photo (Coming Soon)"
              >
                <Image className="w-5 h-5" />
                <span className="hidden sm:inline opacity-80">Photo</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-[var(--accent)]"
                title="Write Article (Coming Soon)"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline opacity-80">Article</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-[var(--accent)]"
                title="Create Event (Coming Soon)"
              >
                <Calendar className="w-5 h-5" />
                <span className="hidden sm:inline opacity-80">Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
