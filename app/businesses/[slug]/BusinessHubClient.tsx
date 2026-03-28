"use client";

import { useState, useEffect } from "react";
import { BusinessProfile } from "@/lib/types/business-directory";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacReviewTrigger from "@/components/reviews/WacReviewTrigger";
import { 
  Briefcase, MapPin, Globe, Users, CheckCircle,
  MessageCircle, MoreHorizontal, ExternalLink, Calendar, Plus
} from "lucide-react";
import EntityFeed from "@/components/feed/EntityFeed";
import CommunityUtilityBadge from "@/components/ui/CommunityUtilityBadge";
import { useActor } from "@/components/providers/ActorProvider";

type TabType = "Overview" | "Pulse" | "About" | "Services" | "Reviews";

export default function BusinessHubClient({ business }: { business: BusinessProfile }) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  
  const { currentActor } = useActor();
  const isAdmin = currentActor?.type === "person" && currentActor?.id === business.owner_id;
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
          overrideActorType: "business",
          overrideActorId: business.id,
          overrideActorName: business.name,
          overrideActorAvatarUrl: business.logo_url,
        },
      })
    );
  };

  const locationPts = [business.city, business.state, business.country].filter(Boolean);
  const locationString = locationPts.length > 0 ? locationPts.join(", ") : "Global";

  return (
    <main className="w-full min-h-screen bg-[var(--background)] pb-20">
      
      {/* ── 1. HERO COVER ──────────────────────────────────────────────────────── */}
      <div className="relative w-full h-48 md:h-72 lg:h-80 bg-[#0a0f18] border-b border-[var(--border)] overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e3a8a_0%,transparent_70%)] opacity-30 pointer-events-none" />
      </div>

      {/* ── 2. IDENTITY & CTA ROW ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-6 relative -mt-16 md:-mt-20 mb-6 md:mb-8">
          
          {/* Avatar Area */}
          <div className="h-28 w-28 md:h-40 md:w-40 rounded-3xl bg-[var(--background)] p-1.5 md:p-2 shadow-2xl shrink-0">
            <div className="h-full w-full rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-blue-400">
               <Briefcase size={40} className="md:w-12 md:h-12" strokeWidth={1.2} />
            </div>
          </div>
          
          {/* Info Block */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-5 lg:pb-3">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3 leading-tight">
                {business.name}
                {business.is_verified && (
                   <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#b08d57] bg-[#b08d57]/10 px-2 py-0.5 rounded-full border border-[#b08d57]/20">
                     <CheckCircle size={11} strokeWidth={2.5} /> Verified
                   </span>
                )}
              </h1>
              <p className="mt-1 md:mt-2 text-base md:text-lg text-white/50 font-medium tracking-wide flex items-center gap-2">
                 {business.business_type || business.industry_name || "Business"} 
                 <span className="opacity-40">•</span> 
                 {locationString}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
              <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                <Plus size={18} strokeWidth={2.5} /> Follow
              </button>
              <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-6 rounded-xl transition-all border border-white/5 active:scale-95">
                <MessageCircle size={18} strokeWidth={2} /> Message
              </button>
              {business.website && (
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" 
                   className="hidden sm:flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-5 rounded-xl transition-all border border-white/5 active:scale-95">
                   Visit Site <ExternalLink size={16} className="text-white/40" />
                </a>
              )}
              <button className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors shrink-0 border border-white/5 active:scale-95" title="More options">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. STICKY TABS ───────────────────────────────────────────────────── */}
      <div className="border-y border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl sticky top-[56px] md:top-[64px] z-40">
        <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-8 overflow-x-auto hide-scrollbar">
            {(['Overview', 'Pulse', 'About', 'Services', 'Reviews'] as TabType[]).map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)}
                 className={`py-4 px-2 whitespace-nowrap border-b-2 font-semibold text-[13px] uppercase tracking-widest transition-all ${
                   activeTab === tab ? "border-blue-400 text-blue-400" : "border-transparent text-white/50 hover:text-white/80"
                 }`}>
                 {tab}
               </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. DUAL COLUMN CONTENT ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-[350px_1fr] xl:grid-cols-[380px_1fr] gap-8 items-start">
           
           {/* LEFT RAIL (Details / Trust Signals) — Appears before Main Feed on mobile */}
           <div className="w-full flex-col gap-6 flex">
              
              {/* About Brief */}
              <div className="wac-card p-6 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)]">
                <h2 className="text-xl font-bold text-white mb-3">About</h2>
                <div className="text-white/70 leading-relaxed font-medium whitespace-pre-wrap">
                  {business.description || "No public description provided yet."}
                </div>
                <div className="mt-5 space-y-4 pt-5 border-t border-white/5">
                   
                   {/* Location */}
                   {(business.city || business.country) && (
                     <div className="flex items-start gap-3">
                       <MapPin size={18} className="text-blue-400 shrink-0 mt-0.5" />
                       <div className="text-sm font-medium text-white/80">{locationString}</div>
                     </div>
                   )}
                   
                   {business.phone && (
                     <div className="flex items-center gap-3">
                       <MessageCircle size={18} className="text-blue-400 shrink-0" />
                       <div className="text-sm font-medium text-white/80">{business.phone}</div>
                     </div>
                   )}
                   
                   {business.email && (
                     <div className="flex items-center gap-3">
                       <Globe size={18} className="text-blue-400 shrink-0" />
                       <a href={`mailto:${business.email}`} className="text-sm font-medium text-white/80 hover:text-blue-400 transition">
                         {business.email}
                       </a>
                     </div>
                   )}

                   {business.employee_count_range && (
                     <div className="flex items-center gap-3">
                       <Users size={18} className="text-blue-400 shrink-0" />
                       <div className="text-sm font-medium text-white/80">{business.employee_count_range} employees</div>
                     </div>
                   )}
                </div>
              </div>

              {/* Credibility & Trust */}
              <div className="wac-card p-6 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)]">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-5">Trust & Reputation</h3>
                <div className="space-y-6">
                  {business.google_maps_url && typeof business.google_rating === 'number' && (
                    <div>
                      <div className="text-xs text-white/50 mb-2 font-medium">Google Reviews</div>
                      <GoogleRatingBadge rating={business.google_rating} reviewsCount={business.google_reviews_count || 0} mapsUrl={business.google_maps_url} />
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-white/50 mb-2 font-medium">WAC Member Rating</div>
                    <WacReviewTrigger entityId={business.id} entityName={business.name} entityType="business" rating={business.wac_rating || 0} reviewsCount={business.wac_reviews_count || 0} />
                  </div>
                </div>
              </div>

              {/* WAC Platform Context */}
              <div className="wac-card p-6 rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-900/[0.05] to-transparent">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400/70 mb-5">Network Context</h3>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <Users size={18} className="text-blue-400 shrink-0 opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white/90 leading-tight block mb-1">Diaspora Built</p>
                      <p className="text-xs text-white/40 leading-snug">Providing trusted connections back to shared roots.</p>
                    </div>
                  </div>
                  
                  {(business.hiring_status === "hiring" || business.hiring_status === "actively_hiring") && (
                  <div className="flex gap-3">
                    <Briefcase size={18} className="text-blue-400 shrink-0 opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white/90 leading-tight block mb-1">Actively Hiring</p>
                      <p className="text-xs text-white/40 leading-snug">Connecting WAC talent with new opportunities.</p>
                    </div>
                  </div>
                  )}

                  <div className="flex gap-3">
                    <Calendar size={18} className="text-blue-400 shrink-0 opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white/90 leading-tight block mb-1">WAC Directory</p>
                      <p className="text-xs text-white/40 leading-snug">Network member since {new Date(business.created_at).getFullYear()}.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Utility — only renders if a real record exists */}
              <CommunityUtilityBadge entityType="business" entityId={business.id} variant="full" />

           </div>

           {/* MAIN / RIGHT COLUMN (Pulse Feed / Content) */}
           <div className="w-full flex-col gap-6 flex">
             
             {activeTab === "Overview" || activeTab === "Pulse" ? (
               <div className="flex flex-col gap-6">
                 {/* Create Post Input / Fake Feed Prompt */}
                 {isAdmin && (
                   <button
                     onClick={handleCompose}
                     className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-4 border border-white/[0.06] flex items-center gap-4"
                   >
                     <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        {business.logo_url ? (
                          <img src={business.logo_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Briefcase size={16} className="text-blue-400" strokeWidth={2} />
                        )}
                     </div>
                     <span className="text-[14.5px] font-medium text-white/40">Write an update on behalf of this business...</span>
                   </button>
                 )}

                 <EntityFeed
                   entityType="business"
                   entityId={business.id}
                   emptyStateTitle="No updates yet"
                   emptyStateDesc="When this business shares updates, announcements, or asks, they'll appear here."
                   refreshKey={feedRefreshKey}
                 />
               </div>
             ) : activeTab === "Services" ? (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-12 text-center">
                 <h3 className="text-xl font-bold text-white mb-2">Services & Offerings</h3>
                 <p className="text-white/50">Services catalog is currently empty.</p>
               </div>
             ) : activeTab === "Reviews" ? (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-12 text-center">
                 <h3 className="text-xl font-bold text-white mb-2">Community Reviews</h3>
                 <p className="text-white/50">Be the first to leave a review for this business.</p>
               </div>
             ) : (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-12 text-center">
                 <h3 className="text-xl font-bold text-white mb-4">Detailed Info</h3>
                 <p className="text-white/50">More detailed information will appear here.</p>
               </div>
             )}

           </div>

        </div>
      </div>
    </main>
  );
}
