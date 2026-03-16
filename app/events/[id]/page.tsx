"use client";

import { use } from "react";
import Link from "next/link";
import { useState } from "react";

// Mock data for the detailed event view
const mockEvent = {
  id: "1",
  title: "Real Estate Networking Gala",
  description: "Join top Albanian real estate professionals for an evening of networking, deal-making, and discussing the future of diaspora investing. Open bar and hors d'oeuvres provided.",
  start_time: "2026-04-15T18:00:00Z",
  end_time: "2026-04-15T22:00:00Z",
  location_name: "The Plaza Hotel",
  city: "New York",
  state: "NY",
  country: "USA",
  event_type: "Networking",
  organizer: {
    name: "Albanian Professionals Network",
    avatar: null
  },
  attendees: 42,
  capacity: 100
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  // In a real app, resolvedParams.id would fetch the event
  
  const [rsvpStatus, setRsvpStatus] = useState<"none" | "going" | "interested">("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRSVP = async (status: "going" | "interested") => {
    setIsSubmitting(true);
    // Simulate API call to `event_rsvps` table
    await new Promise(resolve => setTimeout(resolve, 800));
    setRsvpStatus(status);
    setIsSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const startDate = new Date(mockEvent.start_time);
  const displayDate = startDate.toLocaleDateString("en-US", { weekday: 'long', month: "long", day: "numeric", year: "numeric" });
  const displayTime = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="wac-page pb-24 pt-24 md:pt-32">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Events
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="w-full h-64 md:h-96 rounded-3xl bg-amber-500/10 border border-amber-500/20 overflow-hidden relative flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/40"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>

          <div>
             <div className="flex items-center gap-3 mb-4">
                <span className="wac-button-chip-primary bg-amber-500/10 text-amber-300 pointer-events-none py-1.5">{mockEvent.event_type}</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-bold mb-6">{mockEvent.title}</h1>
             
             <div className="flex flex-wrap items-center gap-6 opacity-80 font-medium mb-8 pb-8 border-b border-white/10">
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                   {displayDate} • {displayTime}
                </div>
                <div className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                   {mockEvent.location_name}, {mockEvent.city}
                </div>
             </div>

             <h2 className="text-2xl font-serif font-bold mb-4">About this Event</h2>
             <p className="opacity-80 leading-relaxed text-lg">{mockEvent.description}</p>
          </div>

        </div>

        {/* Sticky Sidebar Column */}
        <div className="lg:col-span-1 border border-white/10 rounded-3xl p-6 bg-[rgba(255,255,255,0.02)] sticky top-24">
           <h3 className="font-bold text-xl mb-6">Registration</h3>
           
           <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                 <span className="opacity-60">Price</span>
                 <span className="font-bold text-emerald-400">Free</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                 <span className="opacity-60">Spots Left</span>
                 <span className="font-bold">{mockEvent.capacity - mockEvent.attendees}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                 <span className="opacity-60">Hosted By</span>
                 <span className="font-bold text-[var(--accent)] text-right">{mockEvent.organizer.name}</span>
              </div>
           </div>

           {showSuccess && (
              <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                 RSVP Confirmed!
              </div>
           )}

           <div className="space-y-3">
              <button 
                 onClick={() => handleRSVP("going")}
                 disabled={isSubmitting || rsvpStatus === "going"}
                 className={`w-full py-4 rounded-full font-bold transition flex items-center justify-center gap-2 ${rsvpStatus === "going" ? "bg-emerald-600 text-white cursor-default" : "bg-[var(--accent)] text-black hover:bg-[#ffe17d]"}`}
              >
                 {isSubmitting ? "Processing..." : rsvpStatus === "going" ? "You're Going!" : "RSVP - Going"}
                 {rsvpStatus === "going" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              
              <button 
                 onClick={() => handleRSVP("interested")}
                 disabled={isSubmitting || rsvpStatus === "going" || rsvpStatus === "interested"}
                 className={`w-full py-3 rounded-full font-bold transition border ${rsvpStatus === "interested" ? "border-[var(--accent)] text-[var(--accent)] cursor-default" : "border-white/20 hover:border-white/50 bg-[rgba(255,255,255,0.02)]"}`}
              >
                 {rsvpStatus === "interested" ? "Marked as Interested" : "Interested"}
              </button>
           </div>
           
           <p className="text-center text-xs opacity-40 mt-6">
              You will receive an email reminder 24 hours before the event starts.
           </p>
        </div>
      </div>
    </div>
  );
}
