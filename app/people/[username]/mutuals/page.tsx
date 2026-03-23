import { notFound } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/services/profileService";
import Link from "next/link";
import { ArrowLeft, Users, Search, MoreHorizontal } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FollowButton from "@/components/ui/FollowButton";

// Mock data since we don't have a real mutuals connection graph query constructed yet.
const MOCK_MUTUALS = [
  {
    id: "m1",
    username: "teuta_h",
    fullName: "Teuta Hoxha",
    headline: "Commercial Real Estate Broker",
    location: "New York, NY",
    avatar: "https://i.pravatar.cc/150?u=b",
    isVerified: true
  },
  {
    id: "m2",
    username: "ilir_j",
    fullName: "Ilir Jashari",
    headline: "Software Engineer at TechCorp",
    location: "Boston, MA",
    avatar: "https://i.pravatar.cc/150?u=x",
    isVerified: false
  },
  {
    id: "m3",
    username: "arben_ldesigns",
    fullName: "Arben Lleshi",
    headline: "Creative Director & Founder",
    location: "Chicago, IL",
    avatar: "https://i.pravatar.cc/150?u=a",
    isVerified: false
  },
  {
    id: "m4",
    username: "enkelaj_k",
    fullName: "Enkela Krasniqi",
    headline: "Venture Capital Partner",
    location: "San Francisco, CA",
    avatar: "https://i.pravatar.cc/150?u=y",
    isVerified: true
  },
];

export default async function MutualConnectionsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const p = await params;
  const username = p.username;

  if (!username) {
    notFound();
  }

  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const displayName = profile.full_name || profile.username || "User";

  return (
    <main className="min-h-screen bg-[var(--background)] pt-20 md:pt-28 pb-24">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href={`/people/${username}`} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-serif font-black tracking-tight text-white flex items-center gap-2">
              <Users className="text-[#b08d57]" size={24} strokeWidth={2.5} />
              Mutual Connections
            </h1>
            <p className="text-[14px] text-white/50 font-medium mt-1">
              You and <span className="text-white/80 font-bold">{displayName}</span> both know these members.
            </p>
          </div>
        </div>

        {/* ── SEARCH / FILTER BAR ──────────────────────────────────────────────── */}
        <div className="mb-6 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-white/30 group-focus-within:text-[#b08d57] transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search mutual connections..." 
            className="w-full bg-[#111] border border-white/10 focus:border-[#b08d57]/40 ring-1 ring-transparent focus:ring-[#b08d57]/20 rounded-xl py-3.5 pl-11 pr-4 text-[14.5px] text-white placeholder:text-white/30 outline-none transition-all shadow-sm"
          />
        </div>

        {/* ── MUTUALS LIST ─────────────────────────────────────────────────────── */}
        <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 shadow-xl overflow-hidden divide-y divide-white/[0.03]">
          {MOCK_MUTUALS.map((mutual) => {
            const initials = mutual.fullName.split(' ').map(n => n[0]).join('');
            
            return (
              <div key={mutual.id} className="flex items-center p-4 md:p-5 hover:bg-white/[0.02] transition-colors group">
                
                {/* Avatar */}
                <Link href={`/people/${mutual.username}`} className="w-14 h-14 rounded-full border border-white/10 bg-[#151515] overflow-hidden shrink-0 flex items-center justify-center">
                  {mutual.avatar ? (
                    <img src={mutual.avatar} alt={mutual.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[17px] font-bold text-[#b08d57]">{initials}</span>
                  )}
                </Link>

                {/* Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <Link href={`/people/${mutual.username}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-[16px] font-bold text-white truncate group-hover:text-[#b08d57] transition-colors">{mutual.fullName}</h3>
                      {mutual.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-[14px] text-white/70 truncate">{mutual.headline}</p>
                    <p className="text-[13px] text-white/40 truncate mt-0.5">{mutual.location}</p>
                  </Link>
                </div>

                {/* Actions */}
                <div className="ml-4 flex items-center gap-2">
                  {/* Reuse FollowButton component to simulate standard WAC actions */}
                  <FollowButton followingType="person" followingId={mutual.id} className="px-5 py-2 min-w-[100px]" size="sm" />
                  
                  <button className="w-9 h-9 flex items-center justify-center rounded-full bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors hidden md:flex" title="More options">
                    <MoreHorizontal size={18} className="text-white/50" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subtle Footer */}
        <div className="mt-6 text-center">
           <p className="text-[13px] text-white/30 font-medium">Showing all {MOCK_MUTUALS.length} mutual connections</p>
        </div>

      </div>
    </main>
  );
}
