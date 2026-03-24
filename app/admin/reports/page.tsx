"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Trash2, Check, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { logAdminAction } from "@/lib/adminLogger";

type ReportItem = {
  id: string; // Report ID
  reporter_id: string;
  content_type: string;
  content_id: string;
  created_at: string;
  reporter?: {
    full_name: string;
    email: string;
  };
  post?: {
    id: string;
    content: string;
    created_at: string;
    author_profile_id: string;
    author?: {
      full_name: string;
      email: string;
    };
  };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    // 1. Fetch reports
    const { data: reportData, error: reportError } = await supabase
      .from("reported_content")
      .select(`
        *,
        reporter:profiles!reporter_id(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (reportError || !reportData) {
      console.error(reportError);
      setLoading(false);
      return;
    }

    // 2. Fetch associated posts for 'post' type reports
    const postIds = reportData.filter(r => r.content_type === 'post').map(r => r.content_id);
    
    let postsData: any[] = [];
    if (postIds.length > 0) {
      const { data: pData } = await supabase
        .from("feed_posts")
        .select(`
          id, content, created_at, author_profile_id,
          author:profiles!author_profile_id(full_name, email)
        `)
        .in("id", postIds);
      if (pData) postsData = pData;
    }

    // 3. Map together
    const mapped = reportData.map((r: any) => {
      const p = postsData.find(x => x.id === r.content_id);
      return {
        ...r,
        post: p
      };
    });

    setReports(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismiss = async (reportId: string) => {
    if (!confirm("Dismiss this report? The content will remain active.")) return;
    
    const { error } = await supabase.from("reported_content").delete().eq("id", reportId);
    if (!error) {
      const logged = await logAdminAction("DISMISS_REPORT", "report", reportId);
      if (!logged) {
        toast.error("WARNING: Report dismissed but trace log was NOT recorded!");
      } else {
        toast.success("Report dismissed");
      }
      setReports(reports.filter(r => r.id !== reportId));
    } else {
      toast.error("Failed to dismiss report");
    }
  };

  const handleDeletePost = async (reportId: string, postId: string) => {
    if (!confirm("DELETE this post permanently? This cannot be undone.")) return;

    // 1. Delete actual platform post 
    const { error: postError } = await supabase.from("feed_posts").delete().eq("id", postId);
    
    if (postError) {
      toast.error("Failed to delete post from platform.");
      console.error(postError);
      return;
    }

    // 1.b. Immediately log trace of successful destruction
    const logged = await logAdminAction("HARD_DELETE_ENTITY", "report", reportId, { deleted_post_id: postId });
    if (!logged) {
      toast.error("WARNING: Post deleted perfectly but trace log was NOT recorded!");
    } else {
      toast.success("Post completely removed from platform.");
    }

    // 2. Clear out the reports related to that specific post
    const { error: clearError } = await supabase.from("reported_content").delete().eq("content_id", postId);
    if (clearError) {
      toast.error("Post successfully deleted, but failed to clean queue. Refreshing...");
    }

    setReports(reports.filter(r => r.content_id !== postId));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
              <ShieldAlert className="text-orange-500" />
              Trust & Safety Moderation
            </h1>
            <p className="text-white/50 text-sm">Review and take action on community-reported content.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors">
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.05)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Pending Reports</p>
              <p className="text-3xl font-bold text-white leading-none">{reports.length}</p>
            </div>
          </div>
        </div>

        {/* Action Queue */}
        <div className="wac-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.01]">
            <h2 className="text-lg font-bold text-white">Action Queue</h2>
          </div>
          
          <div className="divide-y divide-white/[0.05]">
            {loading ? (
              <div className="p-12 text-center text-white/40 text-sm">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <Check className="w-12 h-12 text-emerald-500/50 mb-4" />
                <p className="text-white/40 text-sm">No pending reports. Community is healthy.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-white/[0.01] transition-colors">
                  <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                    
                    {/* Left: Report Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 uppercase tracking-wider">
                          Reported {report.content_type}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Clock size={12} /> {new Date(report.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      {report.post ? (
                        <div className="bg-black/20 border border-white/5 rounded-xl p-4 mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-white/80">{report.post.author?.full_name || "Unknown Author"}</span>
                            <span className="text-[10px] text-white/40">{report.post.author?.email}</span>
                          </div>
                          <p className="text-sm text-white/90 whitespace-pre-wrap">{report.post.content}</p>
                        </div>
                      ) : (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-3">
                          <p className="text-sm text-rose-400 italic">Content not found or already deleted.</p>
                        </div>
                      )}
                      
                      <p className="text-[11px] text-white/40 mt-3">
                        Reported by: <span className="text-white/60">{report.reporter?.full_name || "Unknown"} ({report.reporter?.email})</span>
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => handleDismiss(report.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        Dismiss Report
                      </button>
                      
                      {report.post && (
                        <button 
                          onClick={() => handleDeletePost(report.id, report.post!.id)}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Delete Post
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
