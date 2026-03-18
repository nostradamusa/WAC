"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, MessageCircle, Users, CalendarDays, Activity, UsersRound, Telescope } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useActor } from "@/components/providers/ActorProvider";
import type { ActorIdentity } from "@/components/providers/ActorProvider";
import GlobalSearchOverlay from "./GlobalSearchOverlay";
import { useUnreadMessageCount } from "@/lib/hooks/useUnreadCounts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profileUrl(actor: ActorIdentity | null): string {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function Navbar() {
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [userId, setUserId]         = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { currentActor, setCurrentActor, ownedEntities } = useActor();
  const unreadMessages = useUnreadMessageCount(currentActor?.id, userId);

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

    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);

    // Desktop only — mobile uses backdrop click to close
    const handleClickOutside = (e: MouseEvent) => {
      if (window.innerWidth >= 768 &&
          desktopMenuRef.current &&
          !desktopMenuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("open-global-search", handleOpenSearch);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setIsMenuOpen(false);
  }

  if (pathname === "/post") return null;

  // ── Shared menu content (desktop dropdown + mobile sheet) ──────────────────

  const menuContent = currentActor ? (
    <>
      {/* Current identity */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
        <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-white/25 mb-2.5">Acting as</p>
        <div className="flex items-center gap-3">
          <Avatar actor={currentActor} size={38} />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">{currentActor.name}</p>
            <p className="text-[11px] text-white/40 capitalize mt-0.5">
              {currentActor.type === "person" ? "Personal account" : currentActor.type}
            </p>
          </div>
        </div>
      </div>

      {/* Switch identity (only if multiple exist) */}
      {ownedEntities.length > 1 && (
        <div className="py-1.5 border-b border-white/[0.07]">
          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-white/25 px-4 pt-2 pb-1.5">Switch to</p>
          {ownedEntities
            .filter((e) => e.id !== currentActor.id)
            .map((entity) => (
              <button
                key={entity.id}
                onClick={() => { setCurrentActor(entity); setIsMenuOpen(false); }}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.04]"
              >
                <Avatar actor={entity} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/75 truncate">{entity.name}</div>
                  <div className="text-[10px] text-white/30 capitalize mt-0.5">
                    {entity.type === "person" ? "Personal account" : entity.type}
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="py-1.5">
        <Link
          href={profileUrl(currentActor)}
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          My Profile
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-white/40 hover:text-red-400 hover:bg-white/[0.03] transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </>
  ) : null;

  // ── Avatar trigger button ──────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <button id="wac-global-login" onClick={signInWithGoogle} className="hidden" aria-hidden="true" />

      <header className="fixed left-0 right-0 top-0 z-[60] bg-[var(--background)]/90 backdrop-blur-md border-b border-white/5">

        {/* ── DESKTOP ────────────────────────────────────────────────────── */}
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--accent)]/50 shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-[var(--accent)]">
                <img src="/images/wac-logo.jpg" alt="World Albanian Congress Logo" className="h-full w-full object-cover scale-[1.4] mix-blend-multiply opacity-95" />
              </div>
              <div className="hidden sm:flex items-center">
                <span className="text-lg font-serif tracking-tight text-white whitespace-nowrap">
                  World{" "}
                  <span className="text-[#D4AF37] italic font-light opacity-90">Albanian</span>{" "}
                  Congress
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {([
                { href: "/directory", label: "Directory", icon: Users },
                { href: "/events",    label: "Events",    icon: CalendarDays },
                { href: "/community", label: "The Pulse", icon: Activity },
                { href: "/groups",    label: "Groups",    icon: UsersRound },
                { href: "/#vision",   label: "Vision",    icon: Telescope },
              ] as const).map(({ href, label, icon: Icon }) => {
                const isActive = href.startsWith("/#")
                  ? false
                  : pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      isActive
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                        : "border-transparent text-white/60 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37]"
                    }`}
                  >
                    <Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: actions + avatar */}
          <div className="flex items-center gap-2">
            <Link
              href={pathname.startsWith("/events") ? "/events/create" : "/post"}
              className="rounded-full bg-[var(--accent)] text-black p-1.5 transition-all duration-300 hover:bg-[#F3E5AB] shadow-md shadow-[var(--accent)]/20 flex items-center justify-center"
              aria-label={pathname.startsWith("/events") ? "Create Event" : "Create Post"}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white/35 hover:bg-white/[0.08] hover:border-[#D4AF37]/30 hover:text-white/60 transition-all duration-200 group"
            >
              <Search size={13} className="shrink-0 group-hover:text-[#D4AF37] transition-colors" />
              <span className="text-xs whitespace-nowrap hidden lg:block">
                {pathname === "/events" || pathname.startsWith("/events/")
                  ? "Search events, hosts, cities…"
                  : <>Search with <span className="text-[#D4AF37]/70 italic font-light">Alban Intelligence</span></>
                }
              </span>
            </button>

            <LanguageToggle />

            {userEmail ? (
              /* Avatar → dropdown */
              <div className="relative" ref={desktopMenuRef}>
                <AvatarButton className="w-8 h-8" />

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/[0.09] bg-[#0d0d0d] shadow-2xl overflow-hidden z-[100]">
                    {menuContent}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-[#D4AF37] border border-white/10 transition hover:bg-white/10 hover:border-[#D4AF37]/50"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* ── MOBILE ─────────────────────────────────────────────────────── */}
        <div className="flex md:hidden items-center justify-between p-3 gap-3">
          {/* Avatar → bottom sheet */}
          {userEmail ? (
            <AvatarButton className="shrink-0 w-8 h-8" />
          ) : (
            <Link
              href="/login"
              className="shrink-0 w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#D4AF37]/60 text-xs font-bold"
            >
              ?
            </Link>
          )}

          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={
                pathname === "/events" || pathname.startsWith("/events/")
                  ? "Search events, hosts, cities…"
                  : "Search with AI..."
              }
              onFocus={(e) => { e.preventDefault(); setIsSearchOpen(true); e.target.blur(); }}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-4 py-1.5 text-sm text-white placeholder:text-white/40 cursor-text"
              readOnly
            />
          </div>

          <Link
            href={pathname.startsWith("/events") ? "/events/create" : "/post"}
            aria-label={pathname.startsWith("/events") ? "Create Event" : "Create Post"}
            className="shrink-0 flex items-center justify-center p-1.5 rounded-full bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/20 transition-all duration-300"
          >
            <Plus size={20} strokeWidth={2.5} />
          </Link>

          <Link
            href="/messages"
            className="shrink-0 text-white/60 hover:text-[var(--accent)] hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] transition-all duration-300 relative"
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

      {/* ── Mobile bottom sheet ─────────────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sheet panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0d0d0d] rounded-t-2xl border-t border-white/[0.09] shadow-2xl overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>
            {menuContent}
            {/* iOS safe area */}
            <div className="h-8" />
          </div>
        </div>
      )}

      <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
