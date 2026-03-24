"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MessageSquareWarning, Check, XCircle, Monitor, Smartphone, Maximize2, ExternalLink, Globe } from "lucide-react";
import { toast } from "react-hot-toast";

type FeedbackUser = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
};

type FeedbackItem = {
  id: string;
  user_id: string;
  issue_text: string;
  image_url: string | null;
  route_path: string;
  user_agent: string;
  window_width: number;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  user?: FeedbackUser;
  signed_image_url?: string | null;
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      // 1. Fetch the raw feedback
      const { data: rawFeedback, error: feedbackError } = await supabase
        .from("beta_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError || !rawFeedback) {
        toast.error("Failed to load feedback");
        setLoading(false);
        return;
      }

      // 2. Extract unique user IDs to fetch profile data manually since cross-schema joins are restricted
      const userIds = Array.from(new Set(rawFeedback.map(f => f.user_id).filter(Boolean)));

      let profilesMap: Record<string, FeedbackUser> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);
          
        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, FeedbackUser>);
        }
      }

      // 3. Batch extract and sign image URLs securely
      const imagePaths = rawFeedback.map(f => {
        if (!f.image_url) return null;
        // Backward comp for legacy public DB str references
        if (f.image_url.startsWith('http')) {
          const parts = f.image_url.split('/feedback_media/');
          return parts.length > 1 ? parts[1] : null;
        }
        return f.image_url;
      }).filter(Boolean) as string[];

      let signedUrlsMap: Record<string, string> = {};
      if (imagePaths.length > 0) {
        const { data: signedData } = await supabase.storage.from("feedback_media").createSignedUrls(imagePaths, 60 * 60); // 1 hr token
        if (signedData) {
          signedData.forEach(item => {
            if (!item.error && item.signedUrl && item.path) {
              signedUrlsMap[item.path] = item.signedUrl;
            }
          });
        }
      }

      // 4. Merge UI Object
      const populated = rawFeedback.map(f => {
        let finalImageUrl = null;
        if (f.image_url) {
          const path = f.image_url.startsWith('http') ? f.image_url.split('/feedback_media/')[1] : f.image_url;
          finalImageUrl = path ? signedUrlsMap[path as string] : null;
        }
        
        return {
          ...f,
          user: f.user_id ? profilesMap[f.user_id] : undefined,
          signed_image_url: finalImageUrl
        };
      });

      setFeedback(populated as FeedbackItem[]);
      setLoading(false);
    }
    
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    // Optimistic UI Update
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: newStatus as any } : f));
    
    const { error } = await supabase.from("beta_feedback").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Database update failed");
    } else {
      toast.success(`Marked as ${newStatus}`);
    }
  };

  const pendingCount = feedback.filter(f => f.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="absolute top-6 right-6">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <XCircle size={28} />
            </button>
          </div>
          <img src={selectedImage} alt="Fullscreen Attachment" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/10 shadow-2xl" />
          <a 
            href={selectedImage} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <span>Open Original</span>
            <ExternalLink size={16} />
          </a>
        </div>
      )}

      <div className="max-w-[70rem] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
              <MessageSquareWarning className="text-rose-500" />
              Bug Reports Queue
              {pendingCount > 0 && <span className="text-sm font-sans bg-rose-500 px-2.5 py-0.5 rounded-full text-white ml-2">{pendingCount} New</span>}
            </h1>
            <p className="text-white/50 text-sm">Review incoming beta feedback and user bug submissions.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors whitespace-nowrap">
            Back to Dashboard
          </Link>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--accent)] animate-spin" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
              <p className="text-white/40">No bug reports submitted yet.</p>
            </div>
          ) : (
            feedback.map(item => (
              <div key={item.id} className={`p-5 rounded-2xl border transition-colors ${item.status === 'pending' ? 'bg-rose-500/[0.02] border-rose-500/20 shadow-[0_4px_30px_rgba(244,63,94,0.03)]' : 'bg-white/[0.02] border-white/[0.05] opacity-60'}`}>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Metadata & Issue */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    
                    {/* Header: User & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                          {item.user?.avatar_url ? (
                            <img src={item.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 font-bold text-sm">
                              {item.user?.full_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.user?.full_name || "Anonymous User"}</p>
                          <p className="text-xs text-white/40">{item.user?.email || "No email attached"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' ? (
                          <>
                            <button onClick={() => updateStatus(item.id, 'resolved')} className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 flex items-center justify-center transition-colors border border-emerald-500/20" title="Mark Resolved">
                              <Check size={14} strokeWidth={3} />
                            </button>
                            <button onClick={() => updateStatus(item.id, 'dismissed')} className="w-8 h-8 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors border border-white/10" title="Dismiss">
                              <XCircle size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-white/5 text-white/50 border border-white/10">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="bg-black/20 rounded-xl p-4 border border-[var(--accent)]/40 mb-4 min-h-[4rem]">
                      <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{item.issue_text}</p>
                    </div>

                    {/* Metadata Badges */}
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <div className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-1.5 text-[11px] text-white/50">
                        <Globe size={10} />
                        <span className="truncate max-w-[150px]">{item.route_path}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-1.5 text-[11px] text-white/50">
                        {item.window_width < 768 ? <Smartphone size={10} /> : <Monitor size={10} />}
                        <span>{item.window_width}px</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5 flex items-center gap-1.5 text-[11px] text-white/40">
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Screenshot Attachment (If it exists) */}
                  {item.signed_image_url && (
                    <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Attached Screenshot</p>
                      <button 
                        onClick={() => setSelectedImage(item.signed_image_url ?? null)}
                        className="relative group w-full aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 transition-all hover:border-rose-500/30"
                      >
                        <img src={item.signed_image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="text-white drop-shadow-md" size={24} />
                        </div>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
