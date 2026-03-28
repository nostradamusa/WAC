"use client";

import { useState, useEffect } from "react";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacReviewTrigger from "@/components/reviews/WacReviewTrigger";
import { 
  Landmark, MapPin, Globe, Users, CheckCircle,
  MessageCircle, MoreHorizontal, ExternalLink, Calendar, HeartHandshake,
  Megaphone, Activity, ShieldCheck, AlignLeft, Info,
  Award
} from "lucide-react";
import OrganizationEventsTab from "./OrganizationEventsTab";
import EntityFeed from "@/components/feed/EntityFeed";
import CommunityUtilityBadge from "@/components/ui/CommunityUtilityBadge";
import { useActor } from "@/components/providers/ActorProvider";

type TabType = "Overview" | "Announcements" | "Pulse" | "Events" | "Programs" | "Members" | "About";

export default function OrganizationHubClient({ organization }: { organization: OrganizationDirectoryEntry }) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");
  const [isJoined, setIsJoined] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  const { currentActor } = useActor();
  const isAdmin = currentActor?.type === "person" && currentActor?.id === (organization as any).owner_id;
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
          overrideActorType: "organization",
          overrideActorId: organization.id,
          overrideActorName: organization.name,
          overrideActorAvatarUrl: organization.logo_url,
        },
      })
    );
  };

  const locationPts = [organization.city, organization.state, organization.country].filter(Boolean);
  const locationString = locationPts.length > 0 ? locationPts.join(", ") : "Global";

  const handleJoinToggle = async () => {
    setLoadingJoin(true);
    setIsJoined(!isJoined);
    await new Promise(r => setTimeout(r, 300));
    setLoadingJoin(false);
  };

  return (
    <main className="w-full min-h-screen bg-[var(--background)] pb-20">
      
      {/* ── 1. HERO COVER ──────────────────────────────────────────────────────── */}
      <div className="relative w-full h-48 md:h-72 lg:h-80 bg-[#06140d] border-b border-[var(--border)] overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#059669_0%,transparent_70%)] opacity-30 pointer-events-none" />
      </div>

      {/* ── 2. IDENTITY & CTA ROW ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[85rem] px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-6 relative -mt-16 md:-mt-20 mb-6 md:mb-8">
          
          {/* Avatar Area */}
          <div className="h-28 w-28 md:h-40 md:w-40 rounded-3xl bg-[var(--background)] p-1.5 md:p-2 shadow-2xl shrink-0">
            <div className="h-full w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400">
               <Landmark size={40} className="md:w-12 md:h-12" strokeWidth={1.2} />
            </div>
          </div>
          
          {/* Info Block */}
          <div className="flex-1 flex flex-col lg:flex-row lg:items-end justify-between gap-5 lg:pb-3">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3 leading-tight">
                {organization.name}
                {organization.is_verified && (
                   <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                     <CheckCircle size={11} strokeWidth={2.5} /> Verified
                   </span>
                )}
              </h1>
              <p className="mt-1 md:mt-2 text-base md:text-lg text-white/50 font-medium tracking-wide flex items-center gap-2">
                 {organization.organization_type || "Organization"} 
                 <span className="opacity-40">•</span> 
                 {locationString}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
              <button 
                onClick={handleJoinToggle} 
                disabled={loadingJoin}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 ${
                  isJoined 
                    ? "bg-emerald-800 text-white border border-emerald-700 shadow-emerald-900/40" 
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                }`}>
                {isJoined ? (
                   <><CheckCircle size={18} strokeWidth={2.5} /> Joined</>
                ) : (
                   <><HeartHandshake size={18} strokeWidth={2.5} /> Join</>
                )}
              </button>
              <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-6 rounded-xl transition-all border border-white/5 active:scale-95">
                <MessageCircle size={18} strokeWidth={2} /> Message
              </button>
              {organization.website && (
                <a href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`} target="_blank" rel="noopener noreferrer" 
                   className="hidden sm:flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 px-5 rounded-xl transition-all border border-white/5 active:scale-95">
                   Donate / Support <ExternalLink size={16} className="text-white/40" />
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
            {(['Overview', 'Announcements', 'Pulse', 'Events', 'Programs', 'Members', 'About'] as TabType[]).map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)}
                 className={`py-4 px-2 whitespace-nowrap border-b-2 font-semibold text-[13px] uppercase tracking-widest transition-all ${
                   activeTab === tab ? "border-emerald-400 text-emerald-400" : "border-transparent text-white/50 hover:text-white/80"
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
           
           {/* LEFT RAIL (Details / Trust Signals) - Visible mainly on Overview/About, but we'll conditionally show it everywhere for consistency or hide on deep tabs. Let's keep it global for the hub feel. */}
           <div className={`w-full flex-col gap-6 ${activeTab !== 'Overview' && activeTab !== 'About' ? 'hidden lg:flex' : 'flex'}`}>
              
              {/* Mission & Identity Brief */}
              <div className="wac-card p-6 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft size={16} className="text-emerald-400" />
                  <h2 className="text-base font-bold text-white uppercase tracking-widest">Mission Summary</h2>
                </div>
                <div className="text-white/70 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                  {organization.description || "The organization's core purpose and who it serves."}
                </div>
                <div className="mt-5 space-y-4 pt-5 border-t border-white/5">
                   
                   {(organization.city || organization.country) && (
                     <div className="flex items-start gap-3">
                       <MapPin size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                       <div className="text-sm font-medium text-white/80">{locationString}</div>
                     </div>
                   )}

                   {organization.leader_name && (
                     <div className="flex items-center gap-3">
                       <Users size={18} className="text-emerald-400 shrink-0" />
                       <div>
                         <div className="text-xs text-white/50">Leadership</div>
                         <div className="text-sm font-medium text-white/80">{organization.leader_name}</div>
                       </div>
                     </div>
                   )}
                   
                   {organization.contact_email && (
                     <div className="flex items-center gap-3">
                       <Globe size={18} className="text-emerald-400 shrink-0" />
                       <a href={`mailto:${organization.contact_email}`} className="text-sm font-medium text-white/80 hover:text-emerald-400 transition">
                         {organization.contact_email}
                       </a>
                     </div>
                   )}
                   
                   {organization.website && (
                     <div className="flex items-center gap-3">
                       <ExternalLink size={18} className="text-emerald-400 shrink-0" />
                       <a href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/80 hover:text-emerald-400 transition truncate block max-w-[200px]">
                         {organization.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                       </a>
                     </div>
                   )}
                </div>
              </div>

              {/* Trust & Reputation */}
              <div className="wac-card p-6 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Trust & Reputation</h3>
                </div>
                <div className="space-y-6">
                  {organization.google_maps_url && typeof organization.google_rating === 'number' && (
                    <div>
                      <div className="text-xs text-white/50 mb-2 font-medium">Google Reviews</div>
                      <GoogleRatingBadge rating={organization.google_rating} reviewsCount={organization.google_reviews_count || 0} mapsUrl={organization.google_maps_url} />
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-white/50 mb-2 font-medium">WAC Member Rating</div>
                    <WacReviewTrigger entityId={organization.id} entityName={organization.name} entityType="organization" rating={organization.wac_rating || 0} reviewsCount={organization.wac_reviews_count || 0} />
                  </div>
                </div>
              </div>

              {/* Network Context */}
              <div className="wac-card p-6 rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-900/[0.05] to-transparent">
                <div className="flex items-center gap-2 mb-5">
                  <Globe size={16} className="text-emerald-400/80" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Network Context</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <HeartHandshake size={18} className="text-emerald-400 shrink-0 opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white/90 leading-tight block mb-1">Ecosystem Role</p>
                      <p className="text-[13px] text-white/50 leading-snug">Mobilizing the Albanian diaspora through shared civic, cultural, and professional initiatives.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Calendar size={18} className="text-emerald-400 shrink-0 opacity-80" />
                    <div>
                      <p className="text-sm font-semibold text-white/90 leading-tight block mb-1">WAC Directory</p>
                      <p className="text-[13px] text-white/50 leading-snug">Network member since {new Date(organization.created_at).getFullYear()}.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Utility — only renders if a real record exists */}
              <CommunityUtilityBadge entityType="organization" entityId={(organization as any).id} variant="full" />

           </div>

           {/* MAIN / RIGHT COLUMN */}
           <div className="w-full flex-col gap-6 flex">
             
             {activeTab === "Overview" && (
               <div className="flex flex-col gap-8">
                 {/* Overview Empty State */}
                 <div className="wac-card bg-[var(--surface)]/30 border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 text-white/40 flex items-center justify-center mb-5 border border-white/10">
                       <Info size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Organization Overview</h3>
                    <p className="text-white/50 text-base max-w-md mx-auto">
                      Featured updates, recent milestones, and trust signals will automatically populate here as the organization expands its presence.
                    </p>
                 </div>
               </div>
             )}

             {activeTab === "Announcements" && (
               <div className="flex flex-col gap-6">
                 {/* Announcement Composer (Admin) */}
                 <div className="wac-card bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <Megaphone size={16} />
                      <span className="text-sm font-bold uppercase tracking-widest">Post Official Announcement</span>
                    </div>
                    <div className="flex gap-4 items-center opacity-60 pointer-events-none text-left">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Landmark size={18} strokeWidth={2} />
                      </div>
                      <div className="flex-1 text-emerald-400/50 text-sm font-medium">Broadcast an official update, deadline, or registration link...</div>
                    </div>
                 </div>

                 {/* Official Announcements Empty State */}
                 <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-lg">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-transparent text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
                       <Megaphone size={32} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">No official announcements yet.</h3>
                    <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
                      Major updates, platform launches, application deadlines, and official statements from this organization will appear here.
                    </p>
                 </div>
               </div>
             )}

             {activeTab === "Pulse" && (
               <div className="flex flex-col gap-6">
                 {/* Pulse Social Composer (Admin) */}
                 {isAdmin && (
                   <button 
                     onClick={handleCompose}
                     className="w-full text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-6 border border-white/[0.06] flex flex-col gap-3"
                   >
                      <div className="flex items-center gap-2 text-white/50 mb-1">
                        <Activity size={16} />
                        <span className="text-sm font-bold uppercase tracking-widest">Share to Pulse Feed</span>
                      </div>
                      <div className="flex gap-4 items-center text-left">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          {organization.logo_url ? (
                            <img src={organization.logo_url} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Landmark size={18} className="text-emerald-400" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex-1 text-white/40 text-[14.5px] font-medium">Share an event recap, member highlight, or behind-the-scenes photo...</div>
                      </div>
                   </button>
                 )}

                 <EntityFeed
                   entityType="organization"
                   entityId={organization.id}
                   emptyStateTitle="No Pulse updates yet."
                   emptyStateDesc="Recaps, community highlights, photos, and live social updates from this organization will appear here."
                   refreshKey={feedRefreshKey}
                 />
               </div>
             )}

             {activeTab === "Events" && (
               <div className="flex flex-col gap-6">
                 <div className="wac-card bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
                    <OrganizationEventsTab organizationId={organization.id} />
                 </div>
                 {/* Assuming OrganizationEventsTab handles its own empty states, but we can explicitly wrap it if needed */}
               </div>
             )}

             {activeTab === "Programs" && (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                   <Award size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">No active programs listed yet.</h3>
                 <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
                   Mentorship tracks, structured initiatives, scholarships, accelerator cohorts, and recurring organizational offerings will appear here.
                 </p>
               </div>
             )}

             {activeTab === "Members" && (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                   <Users size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">No members or leadership roles displayed yet.</h3>
                 <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
                   Admins, board members, key ecosystem contributors, and ambassadors for this organization will appear here.
                 </p>
               </div>
             )}

             {activeTab === "About" && (
               <div className="wac-card bg-[var(--surface)]/50 border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center justify-center text-center text-left">
                 <div className="w-20 h-20 rounded-2xl bg-white/5 text-white/50 flex items-center justify-center mx-auto mb-6 border border-white/10">
                   <AlignLeft size={32} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-4">This organization has not added its full mission yet.</h3>
                 <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
                   The complete founding context, geographic scope, bounding purpose, and details regarding who this organization serves will appear here.
                 </p>
               </div>
             )}

           </div>

        </div>
      </div>
    </main>
  );
}
