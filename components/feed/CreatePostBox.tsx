"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { Image, Send, Loader2, Video, FileText, X } from "lucide-react";

export default function CreatePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
  const { currentActor, isLoading } = useActor();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic validation
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        return;
      }
      
      setSelectedMedia(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="wac-card p-4 animate-pulse">
        <div className="h-10 bg-[rgba(255,255,255,0.05)] rounded-md mb-2"></div>
      </div>
    );
  }

  if (!currentActor) {
    return (
      <div className="wac-card p-4 text-center opacity-70 text-sm">
        Sign in to post to the network feed.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !selectedMedia) return;

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

      // Handle media upload if present
      if (selectedMedia) {
        const fileExt = selectedMedia.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('feed_media')
          .upload(filePath, selectedMedia);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('feed_media')
          .getPublicUrl(filePath);

        payload.image_url = publicUrl;
      }

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

      setContent(""); // Clear input
      clearMedia();   // Clear selected image
      if (onPostCreated) onPostCreated(); // Refresh feed
    } catch (err: any) {
      console.error("Failed to post:", err);
      setError(err.message || "Failed to post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="wac-card p-4 mb-6 shadow-xl">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 items-start">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[rgba(255,255,255,0.1)] flex-shrink-0 flex items-center justify-center font-bold text-[#D4AF37] border-2 border-transparent hover:border-[var(--accent)] transition cursor-pointer">
            {currentActor.avatar_url ? (
               <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
            ) : (
               currentActor.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              rows={1}
              className={`w-full bg-[rgba(255,255,255,0.03)] border border-white/10 hover:bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm focus:outline-none focus:border-[var(--accent)] resize-none transition-all cursor-text placeholder:text-white/60 placeholder:font-bold font-medium ${content.length > 0 || content.includes('\n') ? 'rounded-2xl' : 'rounded-full'}`}
              disabled={isSubmitting}
            />
            
            {/* Media Preview Area */}
            {previewUrl && (
              <div className="relative mt-3 rounded-xl overflow-hidden bg-black/50 border border-white/10 mx-auto w-full max-w-sm">
                 <button
                   type="button"
                   onClick={clearMedia}
                   className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white p-1 rounded-full transition z-10"
                   aria-label="Remove media"
                 >
                   <X size={16} />
                 </button>
                 
                 {selectedMedia?.type.startsWith('video/') ? (
                   <video src={previewUrl} className="w-full max-h-64 object-contain" controls />
                 ) : (
                   <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain" />
                 )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-2 ml-14">{error}</p>}

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2 sm:gap-0 pl-[3.25rem]">
          <div className="flex items-center gap-1 sm:gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept="image/*,video/*" 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-white/80 hover:text-white"
              title="Add Video"
            >
              <Video className="w-5 h-5 text-green-500" />
              <span className="hidden sm:inline">Video</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-white/80 hover:text-white"
              title="Add Photo"
            >
              <Image className="w-5 h-5 text-blue-400" />
              <span className="hidden sm:inline">Photo</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-[rgba(255,255,255,0.05)] transition text-sm font-bold text-white/80 hover:text-white"
              title="Write Article (Coming Soon)"
            >
              <FileText className="w-5 h-5 text-amber-500" />
              <span className="hidden sm:inline">Write article</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={(!content.trim() && !selectedMedia) || isSubmitting}
              className="wac-button-primary py-1.5 px-5 text-sm font-bold rounded-full flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
