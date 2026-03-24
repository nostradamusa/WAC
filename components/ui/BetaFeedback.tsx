"use client";

import { useState } from "react";
import { Bug, Send, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export function BetaFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issue, setIssue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const pathname = usePathname();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      toast.error("Screenshot must be under 4MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function removeFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      let imageUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("feedback_media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Strip the public URL extraction. Strictly log the internal S3 object path for secure signed URL mapping.
        imageUrl = uploadData.path;
      }

      const { error: insertError } = await supabase.from("beta_feedback").insert({
        user_id: userId,
        issue_text: issue,
        image_url: imageUrl,
        route_path: pathname,
        user_agent: navigator.userAgent,
        window_width: window.innerWidth,
      });

      if (insertError) throw insertError;
      
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setIssue("");
        removeFile();
      }, 3000);

    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pathname === '/login' || pathname === '/vision' || pathname?.startsWith('/invite')) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 md:right-auto md:left-8 z-[100] flex flex-col items-end md:items-start pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end md:items-start">

      {isOpen && (
        <div className="mb-4 w-[320px] sm:w-[380px] rounded-2xl bg-[#171513] border border-white/[0.08] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Bug size={12} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold tracking-wide text-white">Beta Feedback</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/40 hover:text-white/80 transition-colors bg-white/[0.04] p-1.5 rounded-full"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-5">
            {submitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-white font-semibold mb-1">Thanks for the catch!</h3>
                <p className="text-xs text-white/50 px-4">Your feedback helps us improve WAC for everyone.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <p className="text-xs text-white/50 leading-relaxed mb-1">
                  Found a bug or have a suggestion? We'd love to hear it. Currently looking at <code className="bg-white/5 px-1 rounded text-white/70">{pathname}</code>
                </p>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="What's on your mind? Did something break?"
                  rows={4}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:border-rose-400/50 focus:ring-1 focus:ring-rose-400/20 transition-all outline-none resize-none placeholder:text-white/30"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      id="bug-screenshot" 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg, image/webp" 
                      onChange={handleFile}
                    />
                    <label 
                      htmlFor="bug-screenshot" 
                      className="cursor-pointer text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-lg"
                      title="Attach screenshot (max 4MB)"
                    >
                      <ImageIcon size={16} />
                    </label>
                    {preview && (
                      <div className="relative w-8 h-8 rounded border border-white/20 overflow-hidden group">
                        <img src={preview} alt="attached screenshot" className="w-full h-full object-cover" />
                        <button onClick={removeFile} type="button" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white" aria-label="Remove image">
                           <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!issue.trim() || isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#0A0A0A] text-sm font-bold rounded-full transition-colors"
                  >
                    <span>{isSubmitting ? "Sending..." : "Send"}</span>
                    {!isSubmitting && <Send size={14} className="opacity-80" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] bg-rose-500 hover:bg-rose-400 hover:scale-105 transition-all flex items-center justify-center text-white z-50 group border border-rose-400/30"
        aria-label="Report a bug or give feedback"
      >
        <Bug size={20} strokeWidth={2.5} className={isOpen ? "rotate-45 opacity-0 absolute" : "rotate-0 opacity-100 transition-all duration-300"} />
        <X size={20} strokeWidth={2.5} className={isOpen ? "rotate-0 opacity-100 transition-all duration-300" : "-rotate-45 opacity-0 absolute"} />
      </button>
      </div>
    </div>
  );
}
