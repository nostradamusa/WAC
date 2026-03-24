"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Search, ServerCrash, Ghost, User, History, Terminal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdminGuard from "@/components/admin/AdminGuard";

type AuditLog = {
  id: string;
  admin_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
};

export default function AdminActionLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    // Note: This relies strictly on the `public.is_admin()` Postgres rule allowing SELECT access
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select(`
        *,
        admin:profiles!admin_id(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to fetch audit logs:", error);
    } else if (data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLogColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("SUSPEND")) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (action.includes("GRANT") || action.includes("VERIFY")) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (action.includes("UNSUSPEND") || action.includes("REVOKE")) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-white/60 bg-white/5 border-white/10";
  };

  const formatActionName = (action: string) => {
    return action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  // Basic client-side search filter over the recent 100 history items
  const filtered = logs.filter(l => 
    l.action_type.toLowerCase().includes(query.toLowerCase()) || 
    l.entity_type.toLowerCase().includes(query.toLowerCase()) ||
    l.admin?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    JSON.stringify(l.metadata).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-[70rem] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                <History className="text-purple-500" />
                Accountability Trace
              </h1>
              <p className="text-white/50 text-sm max-w-xl">
                An un-deletable historical ledger tracking destructive actions and verified badge grants executed by moderators.
              </p>
            </div>
            <Link href="/admin" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors whitespace-nowrap">
              Back to Hub
            </Link>
          </div>

          {/* Global Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text"
              placeholder="Search trace history by moderator name, action type, or entity IDs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.04] transition-all font-mono text-sm"
            />
          </div>

          {/* Trace List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-16 opacity-50 flex flex-col items-center gap-4">
                <ServerCrash className="animate-pulse" />
                <p>Extracting ledger fragments...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 opacity-50 flex flex-col items-center gap-4">
                <Ghost />
                <p>No operational trace history found.</p>
              </div>
            ) : (
              filtered.map((log) => (
                <div key={log.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] flex flex-col md:flex-row gap-4 md:items-center">
                  
                  {/* Moderator Node */}
                  <div className="flex items-center gap-3 md:w-48 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 overflow-hidden">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white max-w-[120px] truncate">{log.admin?.full_name || "Unknown Admin"}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>

                  {/* Operation Vector */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getLogColor(log.action_type)}`}>
                        {formatActionName(log.action_type)}
                      </span>
                      <span className="text-white/40 text-xs flex items-center gap-1.5 font-mono">
                        <Terminal size={12} />
                        {log.entity_type} {log.entity_id ? `[${log.entity_id.split('-')[0]}]` : ""}
                      </span>
                    </div>
                    
                    {/* JSON Metadata Tree */}
                    {Object.keys(log.metadata || {}).length > 0 && (
                      <div className="bg-black/40 rounded border border-white/5 p-2 font-mono text-[10px] text-white/30 overflow-x-auto whitespace-nowrap no-scrollbar">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>

                  {/* DB Immutability Hash */}
                  <div className="md:w-32 shrink-0 md:text-right font-mono text-[9px] text-white/20 select-all cursor-crosshair">
                     UUID: {log.id.split('-')[0]}...{log.id.split('-')[4]}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
