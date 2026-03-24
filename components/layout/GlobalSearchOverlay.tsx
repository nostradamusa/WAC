"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Clock, Newspaper, BadgeCheck, Building2, User, Landmark, Flame, CalendarDays, X } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { searchMentionSuggestions, MentionSuggestion } from "@/lib/services/feedService";
import {
  getRecentlyViewed,
  saveRecentlyViewed,
  getSearchHistory,
  saveSearchTerm,
  deleteSearchTerm,
  RecentlyViewedItem,
  SearchHistoryItem,
} from "@/lib/services/searchService";

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Page-specific search context ─────────────────────────────────────────────

const PAGE_CONTEXT = {
  directory: {
    placeholder: "Search people, businesses, organizations…",
    label: "Try searching for",
    suggestions: [
      "Find Albanian dentists in New Jersey",
      "Construction businesses in Detroit",
      "Albanian cultural organizations",
      "Financial advisors open to mentoring",
    ],
    route: (q: string) => `/directory?q=${encodeURIComponent(q)}`,
  },
  events: {
    placeholder: "Search events, hosts, cities…",
    label: "Try searching for",
    suggestions: [
      "Networking events in NYC",
      "Events hosted by Albanian Roots",
      "Tech meetups this month",
      "Cultural events in Prishtina",
    ],
    route: (q: string) => `/events?q=${encodeURIComponent(q)}`,
  },
  groups: {
    placeholder: "Search groups, interests, communities…",
    label: "Try searching for",
    suggestions: [
      "Parenting groups",
      "Finance communities",
      "Travel groups in Europe",
      "Career & professional circles",
    ],
    route: (q: string) => `/groups?q=${encodeURIComponent(q)}`,
  },
  pulse: {
    placeholder: "Search posts, people, topics…",
    label: "Try searching for",
    suggestions: [
      "Posts about tech summit",
      "People talking about investing",
      "Discussions on Albanian business",
      "News about diaspora communities",
    ],
    route: (q: string) => `/pulse?q=${encodeURIComponent(q)}`,
  },
  default: {
    placeholder: "Search with Alban Intelligence...",
    label: "Alban Suggests",
    suggestions: [
      "Certified Financial Planner who lives near Dallas from Struga and is open to collaborate",
      "Women-owned tech startups hiring software engineers in Prishtina",
      "Personal Injury Lawyer who lives in Jersey and is open to investing",
      "Medical professionals organizing health missions to rural Albania",
    ],
    route: (q: string) => `/directory?q=${encodeURIComponent(q)}`,
  },
} as const;

const THE_BRIEF = [
  {
    id: 1,
    title: "Albanian Roots just announced the official route for the 2026 NYC Parade! 🎉",
    meta: "1.4k Likes · 145 Comments",
    icon: Flame,
    color: "text-orange-400",
    href: "/community",
  },
  {
    id: 2,
    title: "Global Albanian Professionals Tech Summit 2026",
    meta: "This Friday · 850 Attending",
    icon: CalendarDays,
    color: "text-purple-400",
    href: "/events",
  },
  {
    id: 3,
    title: "Historic Direct Flights from NY to Tirana officially open for summer booking.",
    meta: "Published 2h ago · 5.2k views",
    icon: Newspaper,
    color: "text-blue-400",
    href: "/community",
  },
];

const RECENT_AVATAR_DEFAULT = 6;

function TypeBadge({ type }: { type: string }) {
  const isProfile = type === "profile";
  const isBusiness = type === "business";
  const styles = isProfile
    ? "text-[#b08d57] bg-[#b08d57]/10 border-[#b08d57]/20"
    : isBusiness
    ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
    : "text-green-400 bg-green-500/10 border-green-500/20";
  const label = isProfile ? "Profile" : isBusiness ? "Business" : "Organization";
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles}`}>
      {label}
    </span>
  );
}

function RecentAvatar({ item }: { item: RecentlyViewedItem }) {
  const isProfile = item.entity_type === "profile";
  const isBusiness = item.entity_type === "business";
  const ringColor = isProfile ? "border-[#b08d57]" : isBusiness ? "border-blue-500" : "border-green-500";
  const textColor = isProfile ? "text-[#b08d57]" : isBusiness ? "text-blue-400" : "text-green-400";
  const bgColor   = isProfile ? "bg-[#b08d57]/10"  : isBusiness ? "bg-blue-500/10"  : "bg-green-500/10";

  return (
    <button className="flex flex-col items-center gap-1.5 group w-full">
      <div className={`relative w-11 h-11 rounded-full overflow-hidden border-2 ${ringColor} shrink-0 group-hover:scale-105 transition-transform`}>
        {item.avatar_url ? (
          <Image src={item.avatar_url} alt={item.name} fill sizes="44px" className="object-cover" />
        ) : (
          <div className={`w-full h-full ${bgColor} flex items-center justify-center ${textColor}`}>
            {isProfile && <User size={16} />}
            {isBusiness && <Building2 size={16} />}
            {!isProfile && !isBusiness && <Landmark size={14} />}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className={`text-[10px] text-center font-medium leading-tight line-clamp-2 ${textColor} w-full`}>
          {item.name}
        </span>
        {item.verified && <BadgeCheck size={9} className="text-blue-400 shrink-0" />}
      </div>
    </button>
  );
}

export default function GlobalSearchOverlay({ isOpen, onClose }: GlobalSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [liveResults, setLiveResults] = useState<MentionSuggestion[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const isDirectoryPage = pathname === "/directory"  || pathname.startsWith("/directory");
  const isEventsPage    = pathname === "/events"     || pathname.startsWith("/events/");
  const isGroupsPage    = pathname === "/groups"     || pathname.startsWith("/groups/");
  const isPulsePage     = pathname === "/pulse"      || pathname.startsWith("/pulse/");

  const pageCtx = isDirectoryPage ? PAGE_CONTEXT.directory
    : isEventsPage    ? PAGE_CONTEXT.events
    : isGroupsPage    ? PAGE_CONTEXT.groups
    : isPulsePage     ? PAGE_CONTEXT.pulse
    : PAGE_CONTEXT.default;

  const searchPlaceholder = pageCtx.placeholder;

  // Focus input, lock body scroll, and load data when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      Promise.all([getRecentlyViewed(), getSearchHistory()]).then(([viewed, history]) => {
        setRecentlyViewed(viewed);
        setSearchHistory(history);
      });
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setShowAllRecent(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const results = await searchMentionSuggestions(query);
        setLiveResults(results);
      } else {
        setLiveResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const submitSearch = (term = query) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    saveSearchTerm(trimmed); // fire-and-forget
    // Optimistically prepend to history
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.term.toLowerCase() !== trimmed.toLowerCase());
      return [{ id: Date.now().toString(), term: trimmed, searched_at: new Date().toISOString() }, ...filtered];
    });
    router.push(pageCtx.route(trimmed));
    onClose();
  };

  const handleResultClick = (result: MentionSuggestion) => {
    // Save to recently viewed
    saveRecentlyViewed({
      entity_id: result.id,
      entity_type: result.type as "profile" | "business" | "organization",
      name: result.name,
      avatar_url: result.avatar_url ?? null,
      username_or_slug: result.username_or_slug ?? null,
      verified: false,
    });

    const basePath =
      result.type === "business" ? "/businesses"
      : result.type === "organization" ? "/organizations"
      : "/people";
    router.push(`${basePath}/${result.username_or_slug || result.id}`);
    onClose();
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSearchTerm(id);
    setSearchHistory(prev => prev.filter(h => h.id !== id));
  };

  const visibleRecent = showAllRecent ? recentlyViewed : recentlyViewed.slice(0, RECENT_AVATAR_DEFAULT);
  const hasMoreRecent = recentlyViewed.length > RECENT_AVATAR_DEFAULT;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl animate-in fade-in duration-200 flex items-start justify-center pt-0 md:pt-[72px] p-0 md:px-4">
      <div className="absolute inset-0" onClick={onClose} />

      {/* ─── MOBILE: full-screen sheet ─── */}
      <div className="md:hidden bg-[#111] w-full flex flex-col h-[100dvh] relative z-10 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/8 bg-[#1a1a1a]">
          <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition rounded-full hover:bg-white/5">
            <ArrowLeft size={20} />
          </button>
          <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-4 py-2 text-sm focus:outline-none text-white placeholder:text-white/40 placeholder:italic"
            />
          </form>
        </div>
        <div className="flex-1 overflow-y-auto">
          {query.trim().length >= 2 ? (
            <div className="flex flex-col">
              {liveResults.length > 0 ? liveResults.map(result => (
                <button key={result.id} onClick={() => handleResultClick(result)} className="flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                    {result.avatar_url ? <Image src={result.avatar_url} alt={result.name} fill sizes="40px" className="object-cover" /> : (
                      <div className="w-full h-full bg-black/40 flex items-center justify-center font-bold text-[#b08d57] text-sm">{result.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1 min-w-0">
                    <span className="font-semibold text-sm truncate w-full text-left">{result.name}</span>
                    <TypeBadge type={result.type} />
                  </div>
                </button>
              )) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#b08d57]/20 blur-lg rounded-full" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-sm backdrop-blur-xl">
                      <Search className="w-6 h-6 text-[#b08d57]/70" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1 max-w-[240px] px-4">
                    <h4 className="text-white/90 font-medium text-[14px] tracking-wide">No results found</h4>
                    <p className="text-[12px] text-white/40 leading-relaxed text-balance">
                      No matches for <span className="text-white/70 font-medium">&quot;{query}&quot;</span>.
                    </p>
                  </div>
                </div>
              )}
              <button onClick={() => submitSearch()} className="p-4 text-center text-[var(--accent)] font-semibold text-sm hover:bg-white/5 transition">
                See all results for &quot;{query}&quot;
              </button>
            </div>
          ) : (
            <div className="flex flex-col pb-16">
              {/* Recently viewed avatars — always shown */}
              <div className="pt-5 pb-1">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Recent</h3>
                  {hasMoreRecent && (
                    <button
                      onClick={() => setShowAllRecent(v => !v)}
                      className="text-[11px] text-white/50 hover:text-white transition"
                    >
                      {showAllRecent ? "Show less" : "Show all"}
                    </button>
                  )}
                </div>
                {visibleRecent.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto px-4 pb-3 hide-scrollbar">
                    {visibleRecent.map(item => (
                      <div key={item.id} className="shrink-0 w-[60px]"><RecentAvatar item={item} /></div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 pb-3 text-[12px] text-white/20">Profiles you visit will appear here</p>
                )}
              </div>

              {/* Recent search terms — always shown */}
              <div className="flex flex-col border-t border-white/5 pt-1">
                {searchHistory.length > 0 ? searchHistory.slice(0, 5).map((h) => (
                  <button key={h.id} onClick={() => submitSearch(h.term)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition group">
                    <Clock size={15} className="text-white/30 shrink-0" />
                    <span className="text-sm text-white/70 text-left flex-1">{h.term}</span>
                    <span
                      role="button"
                      onClick={(e) => handleDeleteHistory(e, h.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 -mr-1 rounded-full hover:bg-white/10"
                    >
                      <X size={11} className="text-white/40" />
                    </span>
                  </button>
                )) : (
                  <p className="px-4 py-3 text-[12px] text-white/20">Your recent searches will appear here</p>
                )}
              </div>

              {/* Page-specific suggestions */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-[#b08d57]/80 uppercase tracking-widest">{pageCtx.label}</h3>
                </div>
                {pageCtx.suggestions.map((term, i) => (
                  <button key={i} onClick={() => submitSearch(term)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition group">
                    <Search size={14} className="text-[#b08d57]/50 shrink-0 mt-0.5 group-hover:text-[#b08d57] transition" />
                    <span className="text-sm text-white/65 text-left line-clamp-2">{term}</span>
                  </button>
                ))}
              </div>

              {/* The Brief */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-[#b08d57]/80 uppercase tracking-widest">The Brief</h3>
                </div>
                {THE_BRIEF.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { router.push(item.href); onClose(); }} className="flex gap-4 px-4 py-3 hover:bg-white/5 transition text-left group items-start w-full">
                      <div className={`mt-0.5 opacity-80 group-hover:opacity-100 transition ${item.color}`}><Icon size={15} /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white/85 leading-snug mb-1 group-hover:text-[var(--accent)] transition line-clamp-2">{item.title}</h4>
                        <p className="text-[11px] text-white/40 truncate">{item.meta}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DESKTOP: polished modal ─── */}
      <div className="hidden md:flex bg-[#191919] w-full max-w-[720px] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] border border-white/[0.07] flex-col max-h-[78vh] relative z-10 animate-in slide-in-from-top-3 duration-200 overflow-hidden">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <Search size={17} className="text-white/25 shrink-0" />
          <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex-1 relative">
            {!query && (
              <div className="absolute inset-0 flex items-center pointer-events-none select-none">
                {pageCtx === PAGE_CONTEXT.default ? (
                  <>
                    <span className="text-white/30 text-base">Search with&nbsp;</span>
                    <span className="text-[#b08d57]/60 italic font-light text-base">Alban Intelligence</span>
                    <span className="text-white/20 text-base">...</span>
                  </>
                ) : (
                  <span className="text-white/30 text-base">{pageCtx.placeholder}</span>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder=""
              className="w-full bg-transparent text-base focus:outline-none text-white relative z-10"
            />
          </form>
          {query.trim().length >= 2 && (
            <span className="text-[11px] text-white/25 shrink-0 font-mono">↵</span>
          )}
          <kbd
            onClick={onClose}
            className="flex items-center text-[11px] font-mono px-2 py-1 rounded-md bg-white/[0.05] text-white/30 hover:bg-white/10 hover:text-white/55 transition cursor-pointer select-none border border-white/[0.07]"
          >
            ESC
          </kbd>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {query.trim().length >= 2 ? (
            /* ── Live results ── */
            <div className="flex flex-col py-2">
              {liveResults.length > 0 ? liveResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.04] transition group"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
                    {result.avatar_url ? (
                      <Image src={result.avatar_url} alt={result.name} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center font-bold text-[#b08d57] text-sm">
                        {result.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-white/85 group-hover:text-white transition block truncate">{result.name}</span>
                    <TypeBadge type={result.type} />
                  </div>
                </button>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#b08d57]/20 blur-xl rounded-full" />
                    <div className="relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-lg backdrop-blur-xl">
                      <Search className="w-7 h-7 text-[#b08d57]/70" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-[280px]">
                    <h4 className="text-white/90 font-medium text-[15px] tracking-wide">No results found</h4>
                    <p className="text-[13px] text-white/40 leading-relaxed text-balance">
                      We couldn&apos;t find anything matching <span className="text-white/70 font-medium">&quot;{query}&quot;</span>. Try adjusting your search terms or exploring the directory.
                    </p>
                  </div>
                </div>
              )}
              <div className="px-5 py-3 border-t border-white/[0.06] mt-1">
                <button onClick={() => submitSearch()} className="text-[#b08d57] text-sm font-medium hover:underline">
                  See all results for &quot;{query}&quot; →
                </button>
              </div>
            </div>
          ) : (
            /* ── Discovery panel ── */
            <div className="flex flex-col">

              {/* Recently viewed — avatar grid, always shown */}
              <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Recent</span>
                  {hasMoreRecent && (
                    <button
                      onClick={() => setShowAllRecent(v => !v)}
                      className="text-[11px] text-white/35 hover:text-white/65 transition"
                    >
                      {showAllRecent ? "Show less" : "Show all"}
                    </button>
                  )}
                </div>
                {visibleRecent.length > 0 ? (
                  <div className={`grid gap-2 ${showAllRecent ? "grid-cols-8" : "grid-cols-6"}`}>
                    {visibleRecent.map(item => (
                      <RecentAvatar key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-white/20">Profiles you visit will appear here</p>
                )}
              </div>

              {/* Two-column: Recent searches | Alban Suggests */}
              <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-b border-white/[0.05]">

                {/* Left — Recent search terms */}
                <div className="p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-1 mb-1">Recent Searches</span>
                  {searchHistory.length === 0 ? (
                    <p className="text-[12px] text-white/20 px-1">No recent searches</p>
                  ) : searchHistory.slice(0, 5).map((h) => (
                    <button
                      key={h.id}
                      onClick={() => submitSearch(h.term)}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.09] transition group text-left"
                    >
                      <Clock size={13} className="text-white/25 shrink-0 group-hover:text-white/50 transition" />
                      <span className="text-sm text-white/55 line-clamp-1 group-hover:text-white/85 transition flex-1">{h.term}</span>
                      <span
                        role="button"
                        onClick={(e) => handleDeleteHistory(e, h.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded-full hover:bg-white/10"
                      >
                        <X size={11} className="text-white/40" />
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right — Page-specific suggestions */}
                <div className="p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#b08d57]/55 px-1 mb-1">{pageCtx.label}</span>
                  {pageCtx.suggestions.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => submitSearch(term)}
                      className="flex items-start gap-3 w-full px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-[#b08d57]/[0.04] hover:border-[#b08d57]/[0.12] transition group text-left"
                    >
                      <Search size={12} className="text-[#b08d57]/35 shrink-0 mt-0.5 group-hover:text-[#b08d57]/70 transition" />
                      <span className="text-[13px] text-white/55 line-clamp-2 group-hover:text-white/85 transition leading-snug">{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* The Brief */}
              <div className="px-5 py-4 pb-5">
                <div className="mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">The Brief</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {THE_BRIEF.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { router.push(item.href); onClose(); }}
                        className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition text-left group"
                      >
                        <div className={`${item.color} opacity-65 group-hover:opacity-100 transition`}>
                          <Icon size={14} />
                        </div>
                        <p className="text-[12.5px] font-medium text-white/70 leading-snug line-clamp-3 group-hover:text-white/95 transition">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-white/30 truncate mt-auto">{item.meta}</p>
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
