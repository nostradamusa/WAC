"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Clock, TrendingUp, Newspaper, BadgeCheck, Users, Building2, User, Landmark, Flame, CalendarDays } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { searchMentionSuggestions, MentionSuggestion } from "@/lib/services/feedService";

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES = [
  { id: 1, name: "Driton Hoxha", avatar: "https://i.pravatar.cc/150?img=11", type: "profile", verified: true },
  { id: 2, name: "Illyrian Brains", avatar: null, type: "business", verified: true },
  { id: 3, name: "Liria Berisha", avatar: "https://i.pravatar.cc/150?img=5", type: "profile", verified: false },
  { id: 4, name: "Albanian American Culture Center", avatar: null, type: "organization", verified: true },
  { id: 5, name: "Albanian Roots", avatar: null, type: "organization", verified: true },
  { id: 6, name: "Agim Cana", avatar: "https://i.pravatar.cc/150?img=33", type: "profile", verified: false },
];

const RECENT_TERMS = [
  "territory manager in Jobs",
  "software engineer",
  "lawyer"
];

const SUGGESTED_SEARCHES = [
  "Certified Financial Planner who lives near Dallas from Struga and is open to collaborate",
  "Women-owned tech startups hiring software engineers in Prishtina",
  "Personal Injury Lawyer who lives in Jersey and is open to investing",
  "Medical professionals organizing health missions to rural Albania"
];

const NETWORK_PULSE = [
  { 
    id: 1, 
    type: "post", 
    title: "Albanian Roots just announced the official route for the 2026 NYC Parade! 🎉", 
    author: "Driton Hoxha", 
    meta: "1.4k Likes • 145 Comments",
    icon: Flame,
    color: "text-orange-400",
    href: "/community"
  },
  { 
    id: 2, 
    type: "event", 
    title: "Global Albanian Professionals Tech Summit 2026", 
    author: "Prishtina Tech Hub", 
    meta: "This Friday • 850 Attending",
    icon: CalendarDays,
    color: "text-purple-400",
    href: "/events"
  },
  { 
    id: 3, 
    type: "news", 
    title: "Historic Direct Flights from NY to Tirana officially open for summer booking.", 
    author: "Illyrian Travel", 
    meta: "Published 2h ago • 5.2k views",
    icon: Newspaper,
    color: "text-blue-400",
    href: "/community"
  }
];

export default function GlobalSearchOverlay({ isOpen, onClose }: GlobalSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [liveResults, setLiveResults] = useState<MentionSuggestion[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    // Debounced search for live results as they type
    const searchTimer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await searchMentionSuggestions(query);
        setLiveResults(results);
      } else {
        setLiveResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/directory?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleResultClick = (result: MentionSuggestion) => {
    const basePath = result.type === 'business' ? '/businesses' 
                   : result.type === 'organization' ? '/organizations' 
                   : '/people';
    router.push(`${basePath}/${result.username_or_slug || result.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex items-start justify-center pt-0 md:pt-24 p-0 md:p-4">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-[#111] md:bg-[#1a1a1a] w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl md:border md:border-white/10 overflow-hidden flex flex-col h-[100dvh] md:h-auto md:max-h-[80vh] relative z-10 animate-in slide-in-from-bottom-2 md:slide-in-from-top-4">
        {/* Header / Search Bar */}
        <div className="flex items-center gap-2 px-3 md:px-5 py-3 md:py-4 border-b border-white/5 bg-[#1a1a1a] md:bg-transparent">
          <button onClick={onClose} className="p-2 -ml-2 md:hidden text-white/70 hover:text-white transition rounded-full hover:bg-white/5">
            <ArrowLeft size={20} />
          </button>
          <Search size={20} className="hidden md:block text-white/40 shrink-0" />
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the network globally..."
            className="w-full bg-white/5 md:bg-transparent md:border-none border border-white/10 rounded-full pl-4 md:pl-2 pr-4 py-2 md:py-1 text-sm md:text-lg focus:outline-none transition-colors text-white placeholder:text-white/40"
          />
        </form>
        <button onClick={onClose} className="hidden md:block text-xs font-medium px-2 py-1 rounded bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition ml-3">
          ESC
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {query.trim().length >= 2 ? (
          /* Live Search Results View */
          <div className="flex flex-col">
            {liveResults.length > 0 ? (
               liveResults.map(result => (
                 <button 
                   key={result.id} 
                   onClick={() => handleResultClick(result)}
                   className="flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition"
                 >
                   <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                     {result.avatar_url ? (
                       <Image src={result.avatar_url} alt={result.name} fill className="object-cover" />
                     ) : (
                       <div className="w-full h-full bg-black/40 flex items-center justify-center font-bold text-[#D4AF37] text-sm">
                         {result.name.charAt(0)}
                       </div>
                     )}
                   </div>
                   <div className="flex flex-col items-start gap-1 min-w-0">
                     <span className="font-semibold text-sm truncate w-full text-left">{result.name}</span>
                     <span className="text-[10px] uppercase tracking-wider opacity-60 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                       {result.type}
                     </span>
                   </div>
                 </button>
               ))
            ) : (
               <div className="p-8 text-center text-white/50 text-sm">
                 No results found for &quot;{query}&quot;
               </div>
            )}
            <button 
              onClick={handleSearchSubmit} 
              className="p-4 text-center text-[var(--accent)] font-semibold text-sm hover:bg-white/5 transition border-b border-white/5"
            >
              See all results for &quot;{query}&quot;
            </button>
          </div>
        ) : (
          /* Discovery Hub View (LinkedIn style) */
          <div className="flex flex-col pb-8">
            
            {/* Recent Avatars - Horizontal Scroll */}
            <div className="pt-6 pb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <h3 className="font-semibold text-sm text-white/90">Recent</h3>
                <button className="text-[12px] font-medium text-white/60 hover:text-white">Show all</button>
              </div>
              <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x hide-scrollbar">
                {RECENT_SEARCHES.map(item => {
                  const isProfile = item.type === "profile";
                  const isBusiness = item.type === "business";
                  const isOrg = item.type === "organization";
                  
                  // Color configuration specific to entity type
                  const ringColor = isProfile ? "border-[#D4AF37]" : isBusiness ? "border-blue-500" : isOrg ? "border-green-500" : "border-white/10";
                  const textColor = isProfile ? "text-[#D4AF37]" : isBusiness ? "text-blue-400" : isOrg ? "text-green-400" : "text-white/80";
                  const bgColor = isProfile ? "bg-[#D4AF37]/10" : isBusiness ? "bg-blue-500/10" : isOrg ? "bg-green-500/10" : "bg-white/5";

                  return (
                    <button key={item.id} className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] snap-start relative group">
                      <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 ${ringColor} shrink-0`}>
                        {item.avatar ? (
                           <Image src={item.avatar} alt={item.name} fill className="object-cover" />
                        ) : (
                           <div className={`w-full h-full ${bgColor} flex items-center justify-center text-xs font-bold ${textColor}`}>
                              {isProfile && <User size={20} />}
                              {isBusiness && <Building2 size={20} />}
                              {isOrg && <Landmark size={18} />}
                           </div>
                        )}
                      </div>
                      <div className="w-full relative px-1 flex flex-col items-center">
                        <span className={`text-[10px] text-center font-medium leading-tight line-clamp-2 overflow-hidden ${textColor} group-hover:underline w-full max-h-[28px]`}>
                          {item.name}
                        </span>
                        {item.verified && (
                          <div className="mt-0.5 shrink-0">
                            <BadgeCheck size={10} className="text-blue-400" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Search Terms */}
            <div className="flex flex-col mb-4">
              {RECENT_TERMS.map((term, i) => (
                <button key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition group">
                  <Clock size={16} className="text-white/40 shrink-0 group-hover:text-white/80 transition" />
                  <span className="text-sm font-medium text-white/80 text-left line-clamp-1">
                    {term}
                  </span>
                </button>
              ))}
            </div>

            {/* Suggested Searches */}
            <div className="pt-4 border-t border-white/5">
              <div className="px-4 mb-3">
                <h3 className="font-semibold text-sm text-[#D4AF37]">Tap into the Network</h3>
              </div>
              <div className="flex flex-col">
                {SUGGESTED_SEARCHES.map((term, i) => (
                  <button key={i} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition group">
                    <Search size={16} className="text-[var(--accent)] shrink-0 opacity-70 group-hover:opacity-100 transition" />
                    <span className="text-sm font-medium text-white/80 text-left line-clamp-2">
                      {term}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Network Pulse */}
            <div className="pt-4 border-t border-white/5 pb-20">
              <div className="px-4 mb-3">
                <h3 className="font-semibold text-sm text-[#D4AF37]">The Network Pulse</h3>
              </div>
              <div className="flex flex-col">
                {NETWORK_PULSE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.id} 
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className="flex gap-4 px-4 py-3 hover:bg-white/5 transition text-left group items-start"
                    >
                      <div className={`mt-0.5 opacity-80 group-hover:opacity-100 transition ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white/90 leading-snug mb-1.5 group-hover:text-[var(--accent)] transition line-clamp-2">
                          {item.title}
                        </h4>
                        <div className="flex items-center text-[11px] text-white/50 gap-1.5">
                          <span className="font-semibold text-white/70 truncate max-w-[100px]">{item.author}</span>
                          <span className="text-white/30">•</span>
                          <span className="truncate">{item.meta}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  </div>
);
}
