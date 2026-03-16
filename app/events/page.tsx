"use client";

import { Suspense, useState, useEffect } from "react";
import EventsResults from "@/components/events/EventsResults";
import { Search, Calendar, MapPin, Users, Building, ChevronRight, Compass } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";

function EventsDirectoryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Only URL update if state changes locally
    const params = new URLSearchParams(searchParams);
    if (debouncedSearchTerm) {
      params.set("q", debouncedSearchTerm);
    } else {
      params.delete("q");
    }
    // ensure we only replace if different to prevent loop with navbar search
    if (initialQuery !== debouncedSearchTerm) {
        router.replace(`/events?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, initialQuery, searchParams]);

  // Sync state if navbar search changes URL
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const q = initialQuery;

  return (
    <div className="wac-page pb-24">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-8">
          <span className="text-emerald-400 italic font-light opacity-90">
            Events
          </span>
        </h1>

        {/* Global Event Search (Desktop only) */}
        <div className="hidden md:block max-w-xl mx-auto relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-[var(--accent)] transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Events"
            className="w-full bg-[var(--surface)] border border-white/10 rounded-full py-3 pl-12 pr-4 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none text-white placeholder:text-white/40 shadow-xl transition-all"
          />
        </div>
      </div>

      {/* Dynamic Pill Filters */}
      <div className="flex flex-wrap gap-3 pb-4 mb-8 w-full px-4 lg:px-0 max-w-5xl mx-auto">
        <button className="whitespace-nowrap px-5 py-2 rounded-full bg-[var(--accent)] text-black font-bold text-sm shadow-md transition-all flex items-center gap-2">
          <Compass className="w-4 h-4" />
          For You
        </button>
        <button className="whitespace-nowrap px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-medium text-sm transition-all flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          My Network
        </button>
        <button className="whitespace-nowrap px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-medium text-sm transition-all flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-400" />
          Official Orgs
        </button>
        <button className="whitespace-nowrap px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-medium text-sm transition-all flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          This Weekend
        </button>
        <button className="whitespace-nowrap px-5 py-2 rounded-full bg-white/5 border border-white/10 text-amber-500/80 hover:bg-white/10 hover:text-amber-500 font-medium text-sm transition-all flex items-center gap-2 lg:ml-auto">
          My Calendar
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>
      </div>

      {/* Layered Content Hub */}
      <div className="max-w-5xl mx-auto space-y-8 px-4 lg:px-0">
        
        {/* Layer 1: Network Activity (Carousel) */}
        {!q && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                Happening in Your Network
              </h2>
              <button className="text-sm text-[var(--accent)] hover:underline font-bold transition-all">View all</button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Mock Network Event Cards for the initial PR demo */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--surface)] border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-56 relative overflow-hidden group hover:border-[var(--accent)]/50 transition-all cursor-pointer">
                  {/* Background glow hint */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent)]/10 transition-all"></div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-sm">High Activity</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">This Sat, 8 PM</span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-[var(--accent)] transition-colors">
                        {i === 1 ? "Albanian Professionals Summer Gala" : i === 2 ? "Tech Diaspora Networking Meetup" : "Real Estate Investment Seminar"}
                    </h3>
                    <p className="text-sm text-white/50 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {i === 1 ? "Manhattan, NY" : i === 2 ? "Boston, MA" : "Chicago, IL"}
                    </p>
                  </div>

                  {/* Social Proof Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          <img src="https://i.pravatar.cc/150?u=a" className="w-8 h-8 rounded-full border-2 border-[var(--surface)] z-30" />
                          <img src="https://i.pravatar.cc/150?u=q" className="w-8 h-8 rounded-full border-2 border-[var(--surface)] z-20" />
                          <img src="https://i.pravatar.cc/150?u=x" className="w-8 h-8 rounded-full border-2 border-[var(--surface)] z-10" />
                        </div>
                        <span className="text-xs text-white/60"><span className="font-bold text-white">Arben</span> + 12 connections</span>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">
                      RSVP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Layer 2: Official / Featured Events */}
        {/* We reuse EventsResults here to pull the DB objects, but styled in grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">
              Discover Events
            </h2>
          </div>
          
          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="wac-card p-6 h-64 animate-pulse flex flex-col justify-between rounded-2xl"
                  />
                ))}
              </div>
            }
          >
            <EventsResults />
          </Suspense>
        </section>

      </div>
    </div>
  );
}

export default function EventsDirectoryPage() {
  return (
    <Suspense fallback={<div className="wac-page pb-24 animate-pulse h-screen" />}>
      <EventsDirectoryPageInner />
    </Suspense>
  );
}
