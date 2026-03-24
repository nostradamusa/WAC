"use client";

import { useState } from "react";
import { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  UserPlus,
  Share2,
  Globe,
  Calendar,
  MessageCircle,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Circle,
  Globe2,
  Award,
  Heart,
  Repeat2,
  Send,
  X,
  Activity
} from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FollowButton from "@/components/ui/FollowButton";

export default function PublicProfile({ profile }: { profile: EnrichedDirectoryPerson }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus("submitting");
    setTimeout(() => {
      setBookingStatus("success");
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingStatus("idle");
      }, 3000);
    }, 1500);
  };

  const displayName = profile.full_name || profile.username || "WAC Member";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  // Determine Location
  const locationParts = [profile.city, profile.state, profile.country]
    .map((p) => p?.trim())
    .filter(Boolean);
  const locationString = locationParts.join(", ");

  // Roots
  const rootsParts = [profile.ancestry_village, profile.ancestry_city, profile.ancestry_country]
    .map((p) => p?.trim())
    .filter(Boolean);
  const rootsString = rootsParts.join(", ");

  return (
    <article className="w-full mx-auto max-w-[1024px] pb-32 px-4 sm:px-6 lg:px-8">
      
      {/* 1) HERO SECTION - The Largest / Most Premium Surface */}
      <section className="bg-[#050505] rounded-[24px] border border-white/5 overflow-hidden flex flex-col relative shadow-2xl mb-8">
        {/* Banner */}
        <div className="h-44 md:h-56 w-full relative bg-gradient-to-br from-[#101214] to-[#0A0A0A]">
          {/* @ts-ignore banner_url might exist in raw db occasionally */}
          {profile.banner_url && (
            <img
              // @ts-ignore
              src={profile.banner_url}
              alt={`${displayName} banner`}
              className="w-full h-full object-cover opacity-70 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="px-6 md:px-8 pb-8 relative -mt-[84px] md:-mt-[96px]">
          
          <div className="flex justify-between items-start">
             {/* Avatar (overlapping banner) */}
             <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full border-[6px] border-[#050505] bg-[#111] overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
                {profile.avatar_url ? (
                   <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                   <span className="text-5xl md:text-6xl font-bold tracking-tight text-[#b08d57]">{initials}</span>
                )}
             </div>
          </div>

          {/* Identity Hierarchy */}
          <div className="mt-4 max-w-3xl">
             <div className="flex flex-col gap-1.5">
                {/* 1. Name & Verification */}
                <div className="flex items-center gap-2.5">
                   <h1 className="text-[28px] md:text-[34px] font-serif font-black tracking-tight text-white drop-shadow-sm leading-none">
                      {displayName}
                   </h1>
                   {profile.is_verified && <VerifiedBadge size="md" />}
                </div>

                {/* 2. Headline */}
                <p className="text-[17px] md:text-[18px] text-white/90 font-medium leading-relaxed mt-1">
                   {profile.headline || profile.current_title || profile.profession_name || "Professional"}
                </p>
             </div>

             {/* 3. Company & Title */}
             {(profile.current_title || profile.company) && (
                <div className="flex items-center gap-2 text-[15px] font-bold text-white/70 mt-3 mb-3">
                   <Briefcase size={16} className="text-[#b08d57]" />
                   <span>{profile.current_title || "Professional"} {profile.company ? `at ${profile.company}` : ""}</span>
                </div>
             )}

             {/* 4. Location, Roots & Mutuals (Supporting Context) */}
             <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/50 mt-4 mb-7">
                {locationString && (
                   <div className="flex items-center gap-1.5 cursor-default text-white/70">
                      <MapPin size={15} className="text-white/40" />
                      <span>{locationString}</span>
                   </div>
                )}
                {rootsString && (
                   <div className="flex items-center gap-1.5 font-medium text-white/70 cursor-default">
                      <Globe2 size={15} className="text-white/40" />
                      <span>Roots: {rootsString}</span>
                   </div>
                )}
                <Link href={`/people/${profile.username}/mutuals`} className="flex items-center gap-1.5 font-bold text-[#b08d57] cursor-pointer hover:text-[#c2a16d] transition-colors">
                   <Users size={15} />
                   <span>14 Mutual Connections</span>
                </Link>
             </div>

             {/* 5. CTA Row */}
             <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 mt-5 w-full">
                {/* Primary Action */}
                <div className="col-span-2 sm:w-[140px] shadow-lg shadow-[#b08d57]/15 rounded-xl overflow-hidden">
                   <FollowButton followingType="person" followingId={profile.id} className="w-full h-full min-h-[46px] bg-[#b08d57] text-black border-none font-bold rounded-xl hover:bg-[#c2a16d] active:scale-[0.98] transition-all text-[15px]" />
                </div>
                
                {/* Secondary Actions */}
                <Link href="/messages" className="col-span-1 sm:w-auto flex items-center justify-center gap-2 px-5 py-[11px] min-h-[46px] bg-white/[0.04] border border-white/5 text-white font-semibold rounded-xl hover:bg-white/[0.08] active:scale-[0.98] transition-all text-[14.5px]">
                   <MessageCircle size={18} className="text-white/60 shrink-0" strokeWidth={2} /> Message
                </Link>
                {profile.open_to_mentor && (
                   <button onClick={() => setIsBookingModalOpen(true)} className="col-span-1 sm:w-auto flex items-center justify-center gap-2 px-5 py-[11px] min-h-[46px] bg-white/[0.04] border border-white/5 text-white font-semibold rounded-xl hover:border-[#b08d57]/50 hover:bg-[#b08d57]/10 hover:text-[#b08d57] active:scale-[0.98] transition-all text-[14.5px] whitespace-nowrap group">
                      <Calendar size={18} className="text-white/60 group-hover:text-[#b08d57] shrink-0" strokeWidth={2} /> Request Intro
                   </button>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* ── DESKTOP GRID LAYOUT ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
        
        {/* ── MAIN COLUMN (col-span-8) - Layer A: Professional Identity ───────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-10 w-full pb-10">
          
          {/* 2. ABOUT SUMMARY (Light separator treatment, less boxed) */}
          {(profile.bio || (profile as any).bio_coalesced) && (
            <section className="pb-8 border-b border-white/5">
               <h2 className="text-[19px] font-serif font-black tracking-tight text-white mb-4">
                 About
               </h2>
               <div className="text-[15.5px] leading-relaxed text-white/80 whitespace-pre-wrap font-medium">
                  {profile.bio || (profile as any).bio_coalesced}
               </div>
            </section>
          )}

          {/* 3. EXPERIENCE (Clean Chronological Stack) */}
          <section className="pb-8 border-b border-white/5">
             <h2 className="text-[19px] font-serif font-black tracking-tight text-white mb-6">
               Experience
             </h2>
             <div className="space-y-8">
                {/* Current Role */}
                <div className="flex gap-4 group">
                   <div className="w-12 h-12 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                      <Briefcase className="text-white/40" strokeWidth={1.5} size={20} />
                   </div>
                   <div className="flex-1">
                      <h3 className="text-[17px] font-bold text-white mb-1 tracking-tight">{profile.current_title || profile.profession_name || "Professional"}</h3>
                      <p className="text-[15px] font-medium text-white/70 mb-1">{profile.company || "Company Name"}</p>
                      <p className="text-[13.5px] font-medium text-white/40 mb-3">Jan 2021 - Present • 3 yrs 3 mos</p>
                      <p className="text-[14.5px] text-white/80 leading-relaxed font-medium">
                         Driving strategic growth and operational excellence within the organization. Overseeing cross-functional teams and leading major initiatives to scale company presence globally.
                      </p>
                   </div>
                </div>

                {/* Past Role */}
                <div className="flex gap-4 group">
                   <div className="w-12 h-12 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center shrink-0">
                      <Briefcase className="text-white/40" strokeWidth={1.5} size={20} />
                   </div>
                   <div className="flex-1">
                      <h3 className="text-[17px] font-bold text-white mb-1 tracking-tight">Senior Strategist</h3>
                      <p className="text-[15px] font-medium text-white/70 mb-1">Global Enterprise Solutions</p>
                      <p className="text-[13.5px] font-medium text-white/40 mb-3">Aug 2017 - Dec 2020 • 3 yrs 5 mos</p>
                   </div>
                </div>
             </div>
          </section>

          {/* 6. PULSE ACTIVITY (Layer C - Threads-Style Fluid Social Signal) */}
          <section className="bg-transparent mt-2">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15] shrink-0">
                     <Activity size={18} className="text-rose-400" strokeWidth={2} />
                   </div>
                   <div>
                      <h2 className="font-serif text-[22px] font-normal text-white leading-none mb-1">
                        <span className="italic text-rose-400">Pulse</span>
                      </h2>
                      <p className="text-[12px] text-white/50 leading-none">
                         Recent social activity
                      </p>
                   </div>
                </div>
                <Link href={`/people/${profile.username}/activity`} className="px-4 py-1.5 rounded-full border border-white/10 text-[13px] font-bold text-white/70 hover:text-white hover:bg-white/5 active:scale-95 transition-all">
                   View all
                </Link>
             </div>
             
             {/* Threads-Style Feed Container */}
             <div className="flex flex-col">
               
               {/* Item 1 */}
               <div className="flex gap-3 md:gap-4 relative pb-6 group cursor-pointer">
                  {/* Thread Line connecting avatars */}
                  <div className="absolute top-[44px] bottom-0 left-[20px] md:left-[24px] w-[1.5px] bg-white/5 group-hover:bg-white/10 transition-colors" />
                  
                  {/* Left Column (Avatar) */}
                  <div className="flex flex-col shrink-0 z-10 w-10 md:w-12 items-center">
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10 bg-[#151515] flex items-center justify-center shrink-0 shadow-sm">
                        {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[14px] font-bold text-[#b08d57]">{initials}</span>}
                     </div>
                  </div>
                  
                  {/* Right Column (Content) */}
                  <div className="flex-1 pb-2">
                     <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-[15px] text-white hover:underline">{displayName}</span>
                        {profile.is_verified && <VerifiedBadge size="sm" />}
                        <span className="text-[13px] text-white/40 ml-auto font-medium">2h</span>
                     </div>
                     <p className="text-[15px] text-white/80 leading-relaxed font-medium mb-3 pr-2">
                        Incredible insights on the emerging tech scene in the Balkans. Looking forward to seeing this ecosystem grow and collaborating with the local founders. 🚀
                     </p>
                     
                     {/* Interaction Row (Threads Style) */}
                     <div className="flex items-center gap-6 text-white/40">
                        <button className="hover:text-red-400 hover:bg-red-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><Heart size={18} strokeWidth={2}/> <span className="text-[12px] font-semibold">12</span></button>
                        <button className="hover:text-blue-400 hover:bg-blue-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><MessageCircle size={18} strokeWidth={2}/> <span className="text-[12px] font-semibold">3</span></button>
                        <button className="hover:text-green-400 hover:bg-green-500/10 p-1.5 -ml-1.5 rounded-full transition-colors"><Repeat2 size={18} strokeWidth={2}/></button>
                        <button className="hover:text-white hover:bg-white/10 p-1.5 -ml-1.5 rounded-full transition-colors"><Send size={18} strokeWidth={2}/></button>
                     </div>
                  </div>
               </div>

               {/* Item 2 */}
               <div className="flex gap-3 md:gap-4 relative group cursor-pointer">
                  {/* Left Column (Avatar) */}
                  <div className="flex flex-col shrink-0 z-10 w-10 md:w-12 items-center">
                     <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10 bg-[#151515] flex items-center justify-center shrink-0 shadow-sm">
                        {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[14px] font-bold text-[#b08d57]">{initials}</span>}
                     </div>
                  </div>
                  
                  {/* Right Column (Content) */}
                  <div className="flex-1 pb-2">
                     <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-[15px] text-white hover:underline">{displayName}</span>
                        {profile.is_verified && <VerifiedBadge size="sm" />}
                        <span className="text-[13px] text-white/40 ml-auto font-medium">1d</span>
                     </div>
                     <p className="text-[15px] text-white/80 leading-relaxed font-medium mb-3 pr-2">
                        Just wrapped up an amazing panel on Diaspora Networking in NYC. If you missed it, the key takeaway was...
                     </p>
                     
                     {/* Interaction Row */}
                     <div className="flex items-center gap-6 text-white/40">
                        <button className="hover:text-red-400 hover:bg-red-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><Heart size={18} strokeWidth={2}/> <span className="text-[12px] font-semibold">48</span></button>
                        <button className="hover:text-blue-400 hover:bg-blue-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><MessageCircle size={18} strokeWidth={2}/> <span className="text-[12px] font-semibold">15</span></button>
                        <button className="hover:text-green-400 hover:bg-green-500/10 p-1.5 -ml-1.5 rounded-full transition-colors"><Repeat2 size={18} strokeWidth={2}/></button>
                        <button className="hover:text-white hover:bg-white/10 p-1.5 -ml-1.5 rounded-full transition-colors"><Send size={18} strokeWidth={2}/></button>
                     </div>
                  </div>
               </div>

             </div>
          </section>

        </div>

        {/* ── SIDE COLUMN (col-span-4) - Layers B & C ───────────────────────────────────────────── */}
        <aside className="lg:col-span-4 flex flex-col gap-6 w-full lg:sticky lg:top-24">
          
          {/* 4. OPPORTUNITIES / OPEN TO (High Signal Layer C) */}
          {(profile.open_to_work || profile.open_to_hire || profile.open_to_mentor) && (
             <div className="bg-[#111111] rounded-[20px] border border-white/5 p-[22px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none">
                   <Sparkles size={120} strokeWidth={1} />
                </div>
                
                <h2 className="text-[12px] tracking-widest uppercase font-black text-[#b08d57] mb-[18px]">Opportunity Signal</h2>
                
                <div className="space-y-4 relative z-10">
                   {profile.open_to_work && (
                      <div className="flex items-start gap-3.5">
                         <div className="p-2 rounded-full bg-white/5 text-green-400 mt-0.5 shadow-sm border border-transparent group-hover:border-green-500/20 transition-colors">
                            <Briefcase size={16} strokeWidth={2.5} />
                         </div>
                         <div>
                            <h3 className="text-[14.5px] font-bold text-white mb-0.5">Exploring Roles</h3>
                            <p className="text-[13px] font-medium text-white/50 leading-snug">Actively looking for new career opportunities and contracts.</p>
                         </div>
                      </div>
                   )}
                   {profile.open_to_hire && (
                      <div className="flex items-start gap-3.5">
                         <div className="p-2 rounded-full bg-white/5 text-purple-400 mt-0.5 shadow-sm border border-transparent group-hover:border-purple-500/20 transition-colors">
                            <UserPlus size={16} strokeWidth={2.5} />
                         </div>
                         <div>
                            <h3 className="text-[14.5px] font-bold text-white mb-0.5">Hiring Talent</h3>
                            <p className="text-[13px] font-medium text-white/50 leading-snug">Looking to expand their team with top global talent.</p>
                         </div>
                      </div>
                   )}
                   {profile.open_to_mentor && (
                      <div className="flex items-start gap-3.5">
                         <div className="p-2 rounded-full bg-white/5 text-blue-400 mt-0.5 shadow-sm border border-transparent group-hover:border-blue-500/20 transition-colors">
                            <TrendingUp size={16} strokeWidth={2.5} />
                         </div>
                         <div>
                            <h3 className="text-[14.5px] font-bold text-white mb-0.5">Mentorship</h3>
                            <p className="text-[13px] font-medium text-white/50 leading-snug">Available to guide and advise emerging professionals.</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}

          {/* 5. WAC IDENTITY (Layer B - Unified Rich Section) */}
          <div className="bg-[#050505] rounded-[20px] border border-white/5 p-[22px] shadow-xl relative">
             <h2 className="text-[18px] font-serif font-black text-white mb-6 flex items-center gap-2">
                <Shield size={18} className="text-[#b08d57]" /> 
                WAC Identity
             </h2>
             <div className="space-y-6">
                
                {/* Unified Context: Shared Communities & Groups */}
                <div>
                   <h3 className="text-[12px] font-bold text-white/80 mb-3 px-1 flex items-center gap-1.5">
                      <Users size={14} className="text-white/50" /> Communities & Groups
                   </h3>
                   <div className="flex flex-col gap-3 px-1">
                      <Link href="/groups/albanian-professionals" className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all group">
                         <div className="w-10 h-10 rounded-md border border-white/10 bg-zinc-900 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors">
                            <span className="text-[11px] font-bold text-white">AP</span>
                         </div>
                         <div>
                            <p className="text-[14px] font-bold text-white leading-none group-hover:text-[#b08d57] transition-colors">Albanian Professionals</p>
                            <p className="text-[12.5px] text-[#b08d57] font-medium mt-1">Shared Community</p>
                         </div>
                      </Link>
                      <Link href="/groups/tech-professionals-assoc" className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.04] active:scale-[0.98] transition-all group">
                         <div className="w-10 h-10 rounded-md border border-white/10 bg-zinc-900 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors">
                            <span className="text-[11px] font-bold text-white">TPA</span>
                         </div>
                         <div>
                            <p className="text-[14px] font-bold text-white leading-none group-hover:text-[#b08d57] transition-colors">Tech Professionals Assoc</p>
                            <p className="text-[12.5px] text-white/40 font-medium mt-1 group-hover:text-white/60 transition-colors">Member</p>
                         </div>
                      </Link>
                   </div>
                </div>
                
                {/* Diaspora Context */}
                <div className="pt-5 border-t border-white/5">
                   <h3 className="text-[12px] font-bold text-white/80 mb-2 px-1 flex items-center gap-1.5">
                      <Globe size={14} className="text-white/50" /> Diaspora Influence
                   </h3>
                   <p className="text-[14px] font-medium text-white/60 leading-relaxed px-1">
                      Prominent community voice bridging network gaps for Albanian Professionals across the Tri-State area. Active participant in local culturally-driven real estate mixers.
                   </p>
                </div>
                
                {/* Merged Skills Preview */}
                <div className="pt-5 border-t border-white/5">
                   <h3 className="text-[12px] font-bold text-white/80 mb-3 px-1 flex items-center gap-1.5">
                      <Award size={14} className="text-white/50" /> Highlighted Expertise
                   </h3>
                   <div className="flex flex-wrap gap-2 px-1">
                      {["Strategic Planning", "Leadership", "Venture Capital", "Architecture"].map(skill => (
                         <Link key={skill} href={`/directory?q=${encodeURIComponent(skill)}`} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/5 text-[13px] font-medium text-white/70 hover:bg-[#b08d57]/10 hover:border-[#b08d57]/30 hover:text-[#b08d57] active:scale-95 transition-all">
                            {skill}
                         </Link>
                      ))}
                   </div>
                </div>

             </div>
          </div>
        </aside>
      </div>

      {/* ── FOOTER / PLATFORM CONTEXT ───────────────────────────────────────────── */}
      <footer className="mt-16 pt-8 border-t border-white/5 text-center">
         <p className="text-[12.5px] font-medium text-white/20">
            WAC Member since 2023 • Profile views: Public
         </p>
      </footer>

      {/* ── BOOKING MODAL (PRESERVED) ───────────────────────────────────────────── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-xl p-4 pt-24 sm:pt-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-serif font-bold text-white mb-2">Request Introduction</h2>
              <p className="text-sm text-white/60 mb-6">
                Send a brief request to {displayName} to schedule a mentorship session or direct introduction.
              </p>
              <form onSubmit={handleBookSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Your Message</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none"
                    placeholder="Hi! I admire your career trajectory and would love a brief chat about..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={bookingStatus !== "idle"}
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-[var(--accent)] text-black font-bold hover:bg-[#c2a16d] transition-colors disabled:opacity-70"
                >
                  {bookingStatus === "idle" && "Send Request"}
                  {bookingStatus === "submitting" && "Sending..."}
                  {bookingStatus === "success" && "Sent Successfully!"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
