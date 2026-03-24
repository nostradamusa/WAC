"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search, Plus, MessageCircle, Compass, CalendarDays, Activity, Network, Telescope,
  ChevronDown, ChevronRight, User, Settings, Building2, LogOut, Briefcase, Landmark, Globe, Check, MessageSquarePlus,
} from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useActor } from "@/components/providers/ActorProvider";
import type { ActorIdentity } from "@/components/providers/ActorProvider";
import GlobalSearchOverlay from "./GlobalSearchOverlay";
import { useUnreadMessageCount } from "@/lib/hooks/useUnreadCounts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPublicProfileUrl(actor: ActorIdentity | null): string {
  if (!actor) return "/profile";
  if (actor.type === "person") {
    return actor.slug ? `/people/${actor.slug}` : `/people/${actor.id}`;
  }
  if (actor.type === "business") return `/businesses/${actor.slug || actor.id}`;
  if (actor.type === "organization") return `/organizations/${actor.slug || actor.id}`;
  return `/${actor.type}s/${actor.slug || actor.id}`;
}

function getEditProfileUrl(actor: ActorIdentity | null): string {
  if (!actor) return "/profile";
  if (actor.type === "person") return "/profile";
  return `/profile/entities/${actor.id}`;
}

function Avatar({ actor, size }: { actor: ActorIdentity | null; size: number }) {
  const cls = `rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-[var(--accent)]/10`;
  const style = { width: size, height: size };
  if (!actor) {
    return (
      <div style={style} className={`${cls} border border-white/10`}>
        <span className="text-white/30 text-[11px]">?</span>
      </div>
    );
  }
  return (
    <div style={style} className={`${cls} border border-[var(--accent)]/30`}>
      {actor.avatar_url
        ? <img src={actor.avatar_url} alt={actor.name} className="w-full h-full object-cover" />
        : <span className="text-[var(--accent)] font-bold" style={{ fontSize: size * 0.38 }}>
            {actor.name.charAt(0).toUpperCase()}
          </span>
      }
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [userEmail, setUserEmail]       = useState<string | null>(null);
  const [userId, setUserId]             = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen]     = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCreateTip,  setShowCreateTip]  = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [lang,           setLang]           = useState<"en" | "sq">("en");
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Drag-to-dismiss state for mobile sheet
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);

  const longPressRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkMenuRef  = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router   = useRouter();

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      setIsMenuOpen(false);
      setTimeout(() => setDragY(0), 300);
    } else {
      setDragY(0);
    }
  };

  // Fires the context-aware create action for the current page
  const handleComposeTap = () => {
    // If we're strictly on directory/events/groups, show the desktop popover or go to context-create page.
    if (pathname.startsWith("/messages")) {
      window.dispatchEvent(new CustomEvent("wac-new-message"));
      return;
    }
    if (pathname.startsWith("/directory")) {
      setShowNetworkMenu((v) => !v);
      return;
    }
    if (pathname.startsWith("/events")) {
      // Dispatch a context-aware compose event; EventsPage/CalendarModeView handle it
      window.dispatchEvent(new CustomEvent("events-compose"));
      return;
    }
    if (pathname.startsWith("/groups")) {
      router.push("/groups/new");
      return;
    }
    if (pathname === "/community" || pathname.startsWith("/community/")) {
      window.dispatchEvent(new CustomEvent("open-compose-sheet"));
      return;
    }
    router.push("/community");
  }
  const { currentActor, setCurrentActor, ownedEntities } = useActor();
  const unreadMessages = useUnreadMessageCount(currentActor?.id, userId);

  const managedEntities = ownedEntities.filter((e) => e.type !== "person");


  useEffect(() => {
    setLang(document.cookie.includes("googtrans=/en/sq") ? "sq" : "en");
  }, []);

  function switchLang(target: "en" | "sq") {
    if (target === lang) return;
    document.cookie = `googtrans=/en/${target}; path=/`;
    document.cookie = `googtrans=/en/${target}; path=/; domain=${window.location.hostname}`;
    window.location.reload();
  }

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email ?? null);
        setUserId(data.user.id);
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    const handleOpenSearch    = () => setIsSearchOpen(true);
    const handleStoryCreator  = () => router.push("/stories/new");
    window.addEventListener("open-global-search",   handleOpenSearch);
    window.addEventListener("open-story-creator",   handleStoryCreator);


    // Desktop only — mobile closes via backdrop click
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth >= 768) {
        if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
          setIsMenuOpen(false);
        }
        if (networkMenuRef.current && !networkMenuRef.current.contains(e.target as Node)) {
          setShowNetworkMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("open-global-search",  handleOpenSearch);
      window.removeEventListener("open-story-creator",  handleStoryCreator);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function signInWithGoogle() {
    const nextPath = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setIsMenuOpen(false);
  }

  if (pathname === "/post" || pathname === "/stories/new" || pathname === "/welcome") return null;

  // ── Derived create label (context-aware) ─────────────────────────────────
  const createLabel = pathname.startsWith("/directory") ? "Add to Network"
    : pathname.startsWith("/events") ? "Create Event"
    : pathname.startsWith("/groups") ? "Create Group"
    : pathname.startsWith("/messages") ? "New Message"
    : "Create Post";

  // ── Add to Network menu items ─────────────────────────────────────────────
  const NETWORK_ITEMS = [
    { label: "Add Business",     sub: "Register your business",          href: "/profile/entities/new?type=business",     Icon: Briefcase,    accent: "text-[#b08d57]",  ring: "border-[#b08d57]/25 group-hover:border-[#b08d57]/50" },
    { label: "Add Organization", sub: "Create an org or association",    href: "/profile/entities/new?type=organization", Icon: Landmark,     accent: "text-[#b08d57]",  ring: "border-[#b08d57]/25 group-hover:border-[#b08d57]/50" },
    { label: "Create Event",     sub: "Host an event for your network",  href: "/events/new",                             Icon: CalendarDays, accent: "text-teal-400",   ring: "border-teal-400/20  group-hover:border-teal-400/40"  },
  ] as const;

  // ── Inner components (close over state) ───────────────────────────────────

  /**
   * Mobile top-left: composite pill merging WAC logo mark + actor avatar.
   * Communicates brand identity + current acting persona + switchability.
   */
  function BrandedIdentityTrigger() {
    return (
      <button
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label="Account and identity menu"
        className={`shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] transition-all duration-200 border-2 border-[#b08d57]/60 ${
          isMenuOpen
            ? "shadow-[0_0_16px_rgba(176,141,87,0.5)]"
            : "shadow-[0_0_10px_rgba(176,141,87,0.25)] hover:shadow-[0_0_16px_rgba(176,141,87,0.4)]"
        }`}
      >
        <img
          src="/images/wac-logo.jpg"
          alt="WAC"
          aria-hidden="true"
          className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
        />
      </button>
    );
  }

  /** Desktop-only avatar trigger — keeps the compact right-rail feel */
  function AvatarButton({ className }: { className?: string }) {
    return (
      <button
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label="Account menu"
        className={`rounded-full overflow-hidden border-2 transition-all duration-200 ${
          isMenuOpen
            ? "border-[var(--accent)]/60"
            : "border-transparent hover:border-[var(--accent)]/35"
        } ${className}`}
      >
        {currentActor?.avatar_url
          ? <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-xs">
              {currentActor?.name.charAt(0).toUpperCase() ?? "?"}
            </div>
        }
      </button>
    );
  }

  // ── Desktop dropdown content ───────────────────────────────────────────────

  const desktopDropdownContent = currentActor ? (
    <>
      {/* ── 0. Brand Header (Clickable to Vision) ────────────────────────── */}
      <Link 
        href="/vision"
        onClick={() => setIsMenuOpen(false)}
        className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-3 transition-colors hover:bg-white/[0.03] group"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] shadow-[0_0_10px_rgba(176,141,87,0.15)] group-hover:shadow-[0_0_16px_rgba(176,141,87,0.3)] border-2 border-[#b08d57]/60 shrink-0 transition-shadow">
          <img
            src="/images/wac-logo.jpg"
            alt="WAC"
            className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[14px] tracking-tight text-white leading-none mb-1 group-hover:text-white/90 transition-colors">
            World{" "}
            <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
            Congress
          </p>
          <p className="text-[8.5px] tracking-[0.3em] text-[#b08d57]/50 uppercase group-hover:text-[#b08d57]/80 transition-colors">Our Vision &amp; Mission</p>
        </div>
        <ChevronRight size={14} strokeWidth={2} className="text-white/10 group-hover:text-[#b08d57]/60 transition-colors" />
      </Link>

      {/* ── 1. The Premium Identity Header ──────────────────────────────────────── */}
      <div className="p-4 border-b border-white/[0.07] bg-white/[0.015]">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative shrink-0">
             <Avatar actor={currentActor} size={42} />
             <span className="absolute bottom-0 right-[-2px] w-[11px] h-[11px] rounded-full bg-emerald-400 border-2 border-[#121212]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-[15px] leading-tight truncate">{currentActor.name}</p>
            <p className="text-[11.5px] font-semibold text-[#b08d57] capitalize mt-0.5">
              {currentActor.type === "person" ? "Personal Account" : currentActor.type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={getPublicProfileUrl(currentActor)}
            onClick={() => setIsMenuOpen(false)}
            className="flex-1 flex justify-center items-center py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-[12px] font-bold text-white/90 transition-all shadow-sm active:scale-[0.98]"
          >
            View Profile
          </Link>
          <Link
            href={getEditProfileUrl(currentActor)}
            onClick={() => setIsMenuOpen(false)}
            className="flex-1 flex justify-center items-center py-1.5 bg-transparent hover:bg-white/[0.04] border border-white/5 rounded-lg text-[12px] font-bold text-white/60 hover:text-white/90 transition-all active:scale-[0.98]"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* ── 2. Switch identity ────────────────────────────────────────────────── */}
      {ownedEntities.length > 1 && (
        <div className="py-2 border-b border-white/[0.07]">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/30 px-4 pt-1 mb-1">Switch to</p>
          {ownedEntities
            .filter((e) => e.id !== currentActor.id)
            .map((entity) => (
              <button
                key={entity.id}
                onClick={() => { setCurrentActor(entity); setIsMenuOpen(false); }}
                className="w-full text-left flex items-center gap-3 px-4 py-2 transition hover:bg-white/[0.04] group"
              >
                <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                   <Avatar actor={entity} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white/60 group-hover:text-white/90 truncate transition-colors">{entity.name}</div>
                </div>
                <ChevronRight size={14} strokeWidth={2} className="text-white/10 group-hover:text-white/40 shrink-0 transition-colors" />
              </button>
            ))}
        </div>
      )}

      {/* ── 3. Entities ─────────────────────────────────────── */}
      {(managedEntities.length > 0) && (
        <div className="py-2 border-b border-white/[0.07]">
          <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/30 px-4 pt-1 mb-1">Entities</p>
          {managedEntities.map((entity) => (
             <Link
               key={entity.id}
               href={`/profile/entities/${entity.id}`}
               onClick={() => setIsMenuOpen(false)}
               className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition group"
             >
               <div className="w-[20px] h-[20px] rounded overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                 {entity.avatar_url
                   ? <img src={entity.avatar_url} alt="" className="w-full h-full object-cover" />
                   : <Building2 size={11} strokeWidth={1.8} className="text-[#b08d57]/70" />
                 }
               </div>
               <div className="flex flex-col min-w-0 flex-1">
                 <span className="truncate text-[13px] leading-tight group-hover:text-white transition-colors">{entity.name}</span>
                 <span className="text-[10px] text-white/40 capitalize leading-tight mt-0.5 group-hover:text-white/60 transition-colors">
                   {entity.type === "business" ? "Business" : entity.type === "organization" ? "Organization" : "Entity"} • {entity.role || "Admin"}
                 </span>
               </div>
               <span className="text-[10px] text-[#b08d57] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Manage</span>
             </Link>
          ))}
        </div>
      )}

      {/* ── 4. Utilities & Sign Out ───────────────────────────────────────────── */}
      <div className="py-2">
        <Link
          href="/settings"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-white/40 hover:text-white/80 hover:bg-white/[0.03] transition group"
        >
          <Settings size={14} strokeWidth={1.8} className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-white/30 hover:text-red-400 hover:bg-red-400/5 transition group"
        >
          <LogOut size={14} strokeWidth={1.8} className="shrink-0 opacity-40 group-hover:text-red-400 group-hover:opacity-100 transition-colors" />
          Sign out
        </button>
      </div>
    </>
  ) : null;

  // ── Mobile bottom sheet content ────────────────────────────────────────────

  const mobileSheetContent = currentActor ? (
    <div className="pb-2 flex flex-col">
    
      {/* ── 0. Brand Header (Clickable to Vision) ────────────────────────── */}
      <Link 
        href="/vision"
        onClick={() => setIsMenuOpen(false)}
        className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-3.5 transition-colors active:bg-white/[0.04] group"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] shadow-[0_0_14px_rgba(176,141,87,0.2)] border-2 border-[#b08d57]/60 shrink-0 transition-shadow">
          <img
            src="/images/wac-logo.jpg"
            alt="WAC"
            className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[17px] tracking-tight text-white leading-none mb-1">
            World{" "}
            <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
            Congress
          </p>
          <p className="text-[9px] tracking-[0.3em] text-[#b08d57]/50 uppercase">Our Vision &amp; Mission</p>
        </div>
        <ChevronRight size={16} strokeWidth={2} className="text-white/10 shrink-0" />
      </Link>

      {/* ── 1. The Premium Identity Header ──────────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-white/[0.07] bg-white/[0.015]">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
             <Avatar actor={currentActor} size={50} />
             <span className="absolute bottom-[-1px] right-[-1px] w-[14px] h-[14px] rounded-full bg-emerald-400 border-[3px] border-[#121212]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-[17px] leading-tight truncate">{currentActor.name}</p>
            <p className="text-[12.5px] font-semibold text-[#b08d57] capitalize mt-0.5">
              {currentActor.type === "person" ? "Personal Account" : currentActor.type}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={getPublicProfileUrl(currentActor)}
            onClick={() => setIsMenuOpen(false)}
            className="flex-1 flex justify-center items-center py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-[13px] font-bold text-white/90 transition-all shadow-sm active:scale-[0.98]"
          >
            View Profile
          </Link>
          <Link
            href={getEditProfileUrl(currentActor)}
            onClick={() => setIsMenuOpen(false)}
            className="flex-1 flex justify-center items-center py-2.5 bg-transparent hover:bg-white/[0.05] border border-white/5 rounded-xl text-[13px] font-bold text-white/60 hover:text-white/90 transition-all active:scale-[0.98]"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* ── 2. Switch identity ────────────────────────────────────────────────── */}
      {ownedEntities.length > 1 && (
        <div className="py-2 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-5 pt-2 mb-1">Switch to</p>
          {ownedEntities
            .filter((e) => e.id !== currentActor.id)
            .map((entity) => (
              <button
                key={entity.id}
                onClick={() => { setCurrentActor(entity); setIsMenuOpen(false); }}
                className="w-full text-left flex items-center gap-4 px-5 py-3 transition active:bg-white/[0.06]"
              >
                <div className="opacity-50">
                   <Avatar actor={entity} size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-white/60 truncate">{entity.name}</div>
                </div>
                <ChevronRight size={16} strokeWidth={2} className="text-white/10 shrink-0" />
              </button>
            ))}
        </div>
      )}

      {/* ── 3. Entities ─────────────────────────────────────── */}
      {(managedEntities.length > 0) && (
        <div className="py-2 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-5 pt-2 mb-1">Entities</p>
          {managedEntities.map((entity) => (
             <Link
               key={entity.id}
               href={`/profile/entities/${entity.id}`}
               onClick={() => setIsMenuOpen(false)}
               className="flex items-center gap-4 px-5 py-3 text-[14px] font-medium text-white/60 hover:bg-white/[0.04] active:bg-white/[0.06] transition"
             >
               <div className="w-[30px] h-[30px] rounded overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center opacity-70">
                 {entity.avatar_url
                   ? <img src={entity.avatar_url} alt="" className="w-full h-full object-cover" />
                   : <Building2 size={14} strokeWidth={1.8} className="text-[#b08d57]/70" />
                 }
               </div>
               <div className="flex flex-col min-w-0 flex-1">
                 <span className="truncate text-[15px] leading-tight text-white/80">{entity.name}</span>
                 <span className="text-[12px] text-white/40 capitalize leading-tight mt-1">
                   {entity.type === "business" ? "Business" : entity.type === "organization" ? "Organization" : "Entity"} • {entity.role || "Admin"}
                 </span>
               </div>
               <ChevronRight size={16} strokeWidth={2} className="text-white/10 shrink-0" />
             </Link>
          ))}
        </div>
      )}

      {/* ── 4. Utilities & Sign Out ───────────────────────────────────────────── */}
      <div className="py-2 pb-6">
        {/* Language */}
        <button
          onClick={() => setShowLangPicker((v) => !v)}
          className="w-full text-left flex items-center gap-4 px-5 py-3 transition hover:bg-white/[0.04] active:bg-white/[0.06]"
        >
           <Globe size={15} strokeWidth={1.8} className="text-white/40 shrink-0" />
           <span className="text-[15px] font-medium text-white/50 flex-1">Language</span>
           <span className="text-[11px] font-semibold text-[#b08d57]/70 uppercase tracking-wider mr-1">
             {lang === "sq" ? "SQ" : "EN"}
           </span>
           <ChevronDown
             size={14} strokeWidth={2}
             className="text-white/20 transition-transform shrink-0"
             style={{ transform: showLangPicker ? "rotate(180deg)" : "rotate(0deg)" }}
           />
        </button>

        {showLangPicker && (
          <div className="mx-5 mb-1 rounded-xl border border-white/[0.07] overflow-hidden bg-white/[0.02]">
            {(["en", "sq"] as const).map((code) => {
              const label = code === "en" ? "English" : "Shqip";
              const active = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => switchLang(code)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-[14px] font-medium transition-colors ${
                    active
                      ? "text-[#b08d57] bg-[#b08d57]/[0.06]"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {label}
                  {active && <Check size={13} strokeWidth={2.5} className="text-[#b08d57] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-4 px-5 py-3 text-[15px] font-medium text-white/50 active:bg-white/[0.06] transition"
        >
          <Settings size={15} strokeWidth={1.8} className="text-white/40 shrink-0" />
          Settings
        </Link>
        <button
          onClick={() => { signOut(); setIsMenuOpen(false); }}
          className="w-full text-left flex items-center gap-4 px-5 py-3 text-[15px] font-medium text-white/30 hover:text-red-400 hover:bg-red-400/5 active:bg-red-400/10 transition group"
        >
          <LogOut size={15} strokeWidth={1.8} className="text-white/20 group-hover:text-red-400 transition-colors shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  ) : null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <button id="wac-global-login" onClick={signInWithGoogle} className="hidden" aria-hidden="true" />

      {/*
        Mobile header hides on scroll-down inside the Pulse feed.
        Uses translateY so it slides up off-screen; the fixed position means
        the layout below is unaffected — CommunityHub expands into the gap.
      */}
      <header className="fixed left-0 right-0 top-0 z-[60] bg-[var(--background)]/90 backdrop-blur-xl border-b border-white/5">

        {/* ── DESKTOP ──────────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center justify-between px-4 lg:px-10 h-14">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              onClick={(e) => {
                if (pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
              }}
              className="flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#b08d57]/60 shadow-[0_0_15px_rgba(176,141,87,0.4)] bg-[var(--accent)]">
                <img src="/images/wac-logo.jpg" alt="World Albanian Congress Logo" className="h-full w-full object-cover scale-[1.4] mix-blend-multiply opacity-95" />
              </div>
              <div className="hidden sm:flex items-center">
                <span className="text-lg font-serif tracking-tight text-white whitespace-nowrap">
                  World{" "}
                  <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
                  Congress
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {([
                { href: "/directory", label: "Directory", icon: Compass },
                { href: "/events",    label: "Events",    icon: CalendarDays },
                { href: "/community", label: "Pulse", icon: Activity },
                { href: "/groups",    label: "Groups",    icon: Network },
                { href: "/vision",    label: "Vision",    icon: Telescope },
              ] as const).map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={(e) => {
                      if (isActive && href === "/community") {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent("wac-refresh-feed"));
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                      isActive
                        ? "bg-[#b08d57]/10 border-[#b08d57]/30 text-[#b08d57] drop-shadow-[0_0_10px_rgba(176,141,87,0.3)]"
                        : "border-transparent text-white/60 hover:bg-[#b08d57]/5 hover:border-[#b08d57]/20 hover:text-[#b08d57]"
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2.2 : 1.6} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: actions + avatar */}
          <div className="flex items-center gap-2">
            {!pathname.match(/^\/messages\/[a-zA-Z0-9_\-]+$/) && (
              <div
                ref={networkMenuRef}
                className="relative"
                onMouseEnter={() => setShowCreateTip(true)}
                onMouseLeave={() => setShowCreateTip(false)}
              >
                <button
                  onClick={handleComposeTap}
                  className={`rounded-full bg-[var(--accent)] text-black p-1.5 transition-all duration-300 hover:bg-[#F3E5AB] shadow-md shadow-[var(--accent)]/20 flex items-center justify-center ${
                    showNetworkMenu ? "ring-2 ring-[#b08d57]/40" : ""
                  }`}
                  aria-label={createLabel}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>

                {/* Hover tooltip — hidden while menu is open */}
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none transition-all duration-150 ${
                  showCreateTip && !showNetworkMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                }`}>
                  <div className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-white/[0.10] text-[10px] font-semibold text-white/70 tracking-[0.06em] shadow-lg">
                    {createLabel}
                  </div>
                </div>

                {/* Add to Network dropdown — desktop only */}
                {showNetworkMenu && (
                <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl border border-white/[0.09] bg-[#0d0d0d] shadow-2xl overflow-hidden z-[100]">
                  <div className="px-4 pt-3.5 pb-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">Add to Network</p>
                  </div>
                  <div className="pb-2">
                    {NETWORK_ITEMS.map(({ label, sub, href, Icon, accent, ring }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setShowNetworkMenu(false)}
                        className={`group flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.04]`}
                      >
                        <div className={`w-8 h-8 rounded-xl border ${ring} bg-white/[0.03] flex items-center justify-center shrink-0 transition-colors`}>
                          <Icon size={14} strokeWidth={1.8} className={`${accent} opacity-70 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</div>
                          <div className="text-[10px] text-white/28 mt-0.5 leading-none">{sub}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/35 hover:bg-white/[0.08] hover:border-[#b08d57]/30 hover:text-white/60 transition-all duration-200 group"
            >
              <Search size={13} className="shrink-0 group-hover:text-[#b08d57] transition-colors" />
              <span className="text-xs whitespace-nowrap hidden lg:block">
                {pathname === "/directory" || pathname.startsWith("/directory/")
                  ? "Search people, businesses, organizations…"
                  : pathname === "/events" || pathname.startsWith("/events/")
                  ? "Search events, hosts, cities…"
                  : pathname === "/groups" || pathname.startsWith("/groups/")
                  ? "Search groups, interests, communities…"
                  : pathname === "/pulse" || pathname.startsWith("/pulse/")
                  ? "Search posts, people, topics…"
                  : <>Search with <span className="font-serif italic font-light opacity-90 text-[#b08d57]">Alban Intelligence</span></>
                }
              </span>
            </button>

            <LanguageToggle />

            {userEmail ? (
              <div className="relative" ref={desktopMenuRef}>
                <AvatarButton className="w-8 h-8" />
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/[0.09] bg-[#0d0d0d] shadow-2xl overflow-hidden z-[100]">
                    {desktopDropdownContent}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-[#b08d57] border border-white/10 transition hover:bg-white/10 hover:border-[#b08d57]/50"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* ── MOBILE ───────────────────────────────────────────────────────── */}
        <div className="flex md:hidden items-center justify-between p-3 gap-3">

          {/* Left: branded identity control */}
          {userEmail ? (
            <BrandedIdentityTrigger />
          ) : (
            <Link
              href="/login"
              className="shrink-0 flex items-center rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-[#b08d57]/70 hover:border-[var(--accent)]/30 transition whitespace-nowrap"
            >
              Log In
            </Link>
          )}

          {/* Center: AI search bar */}
          <div className="flex-1 min-w-0">
            <input
              id="mobile-ai-search"
              name="mobile-ai-search"
              type="text"
              placeholder={
                pathname === "/directory" || pathname.startsWith("/directory/")
                  ? "Search people, businesses, organizations…"
                  : pathname === "/events" || pathname.startsWith("/events/")
                  ? "Search events, hosts, cities…"
                  : pathname === "/groups" || pathname.startsWith("/groups/")
                  ? "Search groups, interests, communities…"
                  : pathname === "/pulse" || pathname.startsWith("/pulse/")
                  ? "Search posts, people, topics…"
                  : "Search with A.I."
              }
              onFocus={(e) => { e.preventDefault(); setIsSearchOpen(true); e.target.blur(); }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 cursor-text"
              readOnly
            />
          </div>

          {/* Right: create + messages */}
          {!pathname.match(/^\/messages\/[a-zA-Z0-9_\-]+$/) && (
            <div className="relative shrink-0">
              <button
                onClick={handleComposeTap}
                aria-label={createLabel}
                className={`flex items-center justify-center p-1.5 rounded-full bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/20 transition-all duration-300 ${
                  showNetworkMenu ? "ring-2 ring-[#b08d57]/40" : ""
                }`}
                onTouchStart={() => {
                  if (pathname.startsWith("/directory")) return;
                  longPressRef.current = setTimeout(() => setShowCreateTip(true), 400);
                }}
                onTouchEnd={() => {
                  if (longPressRef.current) clearTimeout(longPressRef.current);
                  setTimeout(() => setShowCreateTip(false), 1200);
                }}
                onTouchCancel={() => {
                  if (longPressRef.current) clearTimeout(longPressRef.current);
                  setShowCreateTip(false);
                }}
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
              {/* Long-press tooltip — not shown on Directory (menu opens instead) */}
              <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none transition-all duration-150 z-10 ${
                showCreateTip && !showNetworkMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
              }`}>
                <div className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-white/[0.10] text-[10px] font-semibold text-white/70 tracking-[0.06em] shadow-lg">
                  {createLabel}
                </div>
              </div>
            </div>
          )}

          <Link
            href="/messages"
            className="shrink-0 text-white/60 hover:text-[var(--accent)] hover:drop-shadow-[0_0_12px_rgba(176,141,87,0.8)] transition-all duration-300 relative"
          >
            <MessageCircle size={24} strokeWidth={1.5} />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* ── Mobile bottom sheet ───────────────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity"
            onClick={() => setIsMenuOpen(false)}
            style={{ opacity: Math.max(0, 1 - dragY / 300) }}
          />
          {/* Sheet panel */}
          <div 
            className="relative w-full bg-[#0d0d0d] rounded-t-[1.5rem] border-t border-white/[0.09] shadow-2xl h-[calc(100dvh-16px)] flex flex-col overflow-hidden will-change-transform"
            style={{ 
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition: dragY > 0 ? "none" : "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)"
            }}
          >
            {/* Drag handle & close mechanism */}
            <div 
              className="shrink-0 flex justify-center pt-4 pb-4 bg-[#0d0d0d] z-10 cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto w-full pb-12">
              {mobileSheetContent}
            </div>
          </div>
        </div>
      )}

      {/* ── Add to Network mobile bottom sheet ───────────────────────────────── */}
      {showNetworkMenu && (
        <div className="md:hidden fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={() => setShowNetworkMenu(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#0d0d0d] rounded-t-2xl border-t border-white/[0.09] shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>
            <div className="px-5 pt-3 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">Add to Network</p>
            </div>
            <div className="pb-4">
              {NETWORK_ITEMS.map(({ label, sub, href, Icon, accent, ring }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowNetworkMenu(false)}
                  className="group flex items-center gap-4 px-5 py-3.5 transition active:bg-white/[0.05]"
                >
                  <div className={`w-10 h-10 rounded-2xl border ${ring} bg-white/[0.03] flex items-center justify-center shrink-0 transition-colors`}>
                    <Icon size={16} strokeWidth={1.8} className={`${accent} opacity-70`} />
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-white/85">{label}</div>
                    <div className="text-[11px] text-white/30 mt-0.5">{sub}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="h-6" />
          </div>
        </div>
      )}

      <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
