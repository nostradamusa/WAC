"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import { ArrowLeft, Activity } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useActor } from "@/components/providers/ActorProvider";
import EntityFeed from "@/components/feed/EntityFeed";

export default function ProfileActivityClient({ profile }: { profile: EnrichedDirectoryPerson }) {
  const displayName = profile.full_name || profile.username || "WAC Member";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const { currentActor } = useActor();
  const isOwner = currentActor?.id === profile.id && currentActor?.type === "person";
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);

  useEffect(() => {
    const handler = () => setFeedRefreshKey((n) => n + 1);
    window.addEventListener("wac-refresh-feed", handler);
    return () => window.removeEventListener("wac-refresh-feed", handler);
  }, []);

  const handleCompose = () => {
    window.dispatchEvent(
      new CustomEvent("open-compose-sheet", {
        detail: {
          overrideActorType: "person",
          overrideActorId: profile.id,
          overrideActorName: displayName,
          overrideActorAvatarUrl: profile.avatar_url,
        },
      })
    );
  };

  return (
    <div className="w-full">
      {/* ── HEADER AREA ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 pt-5 pb-2 px-4 sm:px-6">
        
        {/* Top Nav Row */}
        <div className="flex items-center gap-4 mb-6">
           <Link href={`/people/${profile.username}`} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors" title="Back to profile">
              <ArrowLeft size={18} strokeWidth={2.5} />
           </Link>
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15]">
               <Activity size={16} className="text-rose-400" strokeWidth={2.5} />
             </div>
             <h1 className="font-serif text-[24px] font-normal text-white leading-none">
                <span className="italic text-rose-400">Pulse</span>
             </h1>
           </div>
        </div>

        {/* Profile Context Strip */}
        <div className="flex items-center gap-3.5 mb-6 px-1">
           <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#151515] border-2 border-white/10 shadow-md shrink-0">
             {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[15px] font-bold text-[#b08d57]">{initials}</div>}
           </div>
           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                 <h2 className="text-[17px] font-bold text-white tracking-tight truncate">{displayName}</h2>
                 {profile.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[14.5px] text-white/50 font-medium truncate">
                 {profile.headline || profile.current_title || "Professional"}
              </p>
           </div>
        </div>
      </div>

      {/* ── FEED LIST ───────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-6 flex flex-col">
          {isOwner && (
            <button
              onClick={handleCompose}
              className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-4 border border-white/[0.06] flex items-center gap-4 mb-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#111] border border-white/5 flex items-center justify-center shrink-0">
                 {profile.avatar_url ? (
                   <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                 ) : (
                   <span className="text-[12px] font-bold text-[#b08d57]">{initials}</span>
                 )}
              </div>
              <span className="text-[14.5px] font-medium text-white/40">Share an update with your network...</span>
            </button>
          )}

          <EntityFeed
            entityType="person"
            entityId={profile.id}
            emptyStateTitle="No active signal yet"
            emptyStateDesc={`When ${displayName} posts on The Pulse, their activity will appear here.`}
            refreshKey={feedRefreshKey}
          />
      </div>

    </div>
  );
}
