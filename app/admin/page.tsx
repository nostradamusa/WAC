import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, AlertTriangle, CheckCircle2, History } from "lucide-react";

// Server component to display beta tester stats securely.
export default async function AdminDashboardPage() {
  // In a real app, you would add an admin check here before rendering.
  // const { data: { session } } = await supabase.auth.getSession();
  // if (user?.email !== "admin@wac.com") return <p>Unauthorized</p>;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, city, country, headline, is_verified, is_admin, created_at, avatar_url");

  const [{ count: bizVerified }, { count: orgVerified }] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", true),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_verified", true)
  ]);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-500 mb-4">Error loading profiles</h1>
        <pre className="text-sm bg-black/20 p-4 rounded-xl">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  // Calculate onboarding status
  const totalUsers = profiles?.length || 0;
  const fullyOnboarded = profiles?.filter((p: any) => p.full_name && p.country && p.city)?.length || 0;
  const stuckUsers = totalUsers - fullyOnboarded;

  const verifiedCount = (profiles?.filter((p: any) => p.is_verified).length || 0) + (bizVerified || 0) + (orgVerified || 0);

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Beta Operations Hub</h1>
            <p className="text-white/50 text-sm">Monitor onboarding metrics, manage verifications, and moderate content.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/entities" className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-sm text-purple-400 font-semibold transition-colors whitespace-nowrap">
              Entity Mgmt
            </Link>
            <Link href="/admin/verification" className="px-4 py-2 rounded-xl bg-[#b08d57]/10 border border-[#b08d57]/20 hover:bg-[#b08d57]/20 text-sm text-[#b08d57] font-semibold transition-colors whitespace-nowrap">
              Verification Desk
            </Link>
            <Link href="/admin/reports" className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-sm text-orange-400 font-semibold transition-colors whitespace-nowrap">
              Moderation Queue
            </Link>
            <Link href="/admin/feedback" className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-sm text-rose-400 font-semibold transition-colors whitespace-nowrap">
              Bug Reports
            </Link>
            <Link href="/admin/logs" className="px-4 py-2 rounded-xl flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-sm text-emerald-400 font-mono transition-colors whitespace-nowrap">
              <History size={14} /> Traces
            </Link>
            <Link href="/" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors whitespace-nowrap">
              Exit
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Invites Accepted</p>
              <p className="text-3xl font-bold text-white leading-none">{totalUsers}</p>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Provisioned Profiles</p>
              <p className="text-3xl font-bold text-white leading-none">{fullyOnboarded}</p>
            </div>
          </div>

          <div className={`p-6 rounded-2xl bg-white/[0.02] flex items-center gap-4 ${stuckUsers > 0 ? 'border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border border-white/[0.08]'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stuckUsers > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/30'}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Stuck in Onboarding</p>
              <p className="text-3xl font-bold text-white leading-none">{stuckUsers}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#b08d57]/[0.02] border border-[#b08d57]/20 shadow-[0_0_20px_rgba(176,141,87,0.05)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#b08d57]/10 flex items-center justify-center text-[#b08d57]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-[#b08d57]/50 uppercase tracking-wider mb-1">Global Verified</p>
              <p className="text-3xl font-bold text-white leading-none">{verifiedCount}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="wac-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] bg-white/[0.01]">
            <h2 className="text-lg font-bold text-white">Registered Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {profiles?.map((profile: any) => {
                  const isOnboarded = profile.full_name && profile.country && profile.city;
                  return (
                    <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden text-xs flex items-center justify-center shrink-0">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={12} className="text-white/40" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                              {profile.full_name || "Anonymous (No Name)"}
                              {profile.is_admin && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 text-[9px] uppercase tracking-wider font-bold">Admin</span>}
                            </p>
                            <p className="text-[11px] text-white/40 truncate mt-0.5">
                              {profile.email || profile.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isOnboarded ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-medium text-emerald-400">
                            Provisioned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-[11px] font-medium text-rose-400">
                            Stuck
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {profile.city && profile.country 
                          ? `${profile.city}, ${profile.country}`
                          : <span className="text-white/20 italic">Missing data</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/50">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!profiles || profiles.length === 0) && (
              <div className="p-12 text-center text-white/40 text-sm">
                No users found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
