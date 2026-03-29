"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GlobalSearchOverlay from "@/components/layout/GlobalSearchOverlay";
import {
  Activity,
  Compass,
  CalendarDays,
  Network,
  Map,
  Briefcase,
  Building2,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

// ── Proof strip data ─────────────────────────────────────────────────────────

const LIVE_ITEMS = [
  { label: "Directory" },
  { label: "Pulse" },
  { label: "Events" },
  { label: "Groups" },
  { label: "Diaspora Map" },
];

const COMING_ITEMS = [
  { label: "Properties" },
  { label: "COUSIN" },
  { label: "Verified" },
  { label: "Resources" },
];

// ── Mobile quick-nav data ────────────────────────────────────────────────────

const MOBILE_NAV_ITEMS = [
  { href: "/directory",          icon: Compass,      label: "Directory",    color: "text-[#b08d57]" },
  { href: "/pulse",              icon: Activity,     label: "Pulse",        color: "text-rose-400" },
  { href: "/events",             icon: CalendarDays,  label: "Events",       color: "text-teal-400" },
  { href: "/groups",             icon: Network,       label: "Groups",       color: "text-violet-400" },
  { href: "/directory?view=map", icon: Map,           label: "Map",          color: "text-[#b08d57]" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Hero() {
  const [isSignCheckComplete, setIsSignCheckComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setIsSignCheckComplete(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <GlobalSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── Mobile Hero ──────────────────────────────────────────────────── */}
      <section className="md:hidden px-4 pt-6 pb-5 space-y-6">

        {/* ── 1. Hero headline ──────────────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400/70">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400/80" />
            </span>
            Live Now
          </p>

          <h1 className="font-serif text-[26px] leading-[1.15] tracking-tight text-white">
            The operating system for{" "}
            <span className="text-[#b08d57] italic font-light">Albanian</span>{" "}
            momentum.
          </h1>

          <p className="text-[13px] font-light text-white/38 leading-relaxed max-w-[320px]">
            A network for Albanian trust, visibility, opportunity, and coordination across borders.
          </p>
        </div>

        {/* ── 2. Dual CTAs ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/directory"
            className="flex-1 flex items-center justify-center py-3 rounded-xl bg-[#b08d57] text-black text-[13px] font-bold tracking-wide transition-colors hover:bg-[#9a7545] active:scale-[0.97]"
          >
            Explore Directory
          </Link>
          <Link
            href="/directory?view=map"
            className="flex-1 flex items-center justify-center py-3 rounded-xl border border-[#b08d57]/30 text-[#d5bf92] text-[13px] font-semibold tracking-wide transition-colors hover:bg-[#b08d57]/10 active:scale-[0.97]"
          >
            Diaspora Map
          </Link>
        </div>

        {/* ── 3. Compact quick-nav strip ─────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          {MOBILE_NAV_ITEMS.map(({ href, icon: Icon, label, color }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-1.5 py-1 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-active:scale-90 transition-transform">
                <Icon className={`w-[18px] h-[18px] ${color} opacity-70`} strokeWidth={1.6} />
              </div>
              <span className="text-[10px] font-medium text-white/35">{label}</span>
            </Link>
          ))}
        </div>

        {/* ── 4. Join CTA — only when logged out ─────────────────────── */}
        {isSignCheckComplete && !isLoggedIn && (
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white/50 text-[12px] font-semibold tracking-wide transition hover:bg-white/[0.07] active:scale-[0.98]"
          >
            Join the Network
          </Link>
        )}

      </section>

      {/* ── Desktop: Full Editorial Hero ──────────────────────────────── */}
      <section className="relative hidden md:flex flex-col items-center justify-center pt-28 pb-20 text-center px-4 min-h-0">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,87,0.12)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl w-full">
          {/* Logo */}
          <div className="flex justify-center mb-7">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] drop-shadow-[0_0_20px_rgba(176,141,87,0.25)] animate-in zoom-in duration-700 relative border-[3px] border-[#b08d57]/60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_60%)] mix-blend-overlay pointer-events-none" />
              <img
                src="/images/wac-logo.jpg"
                alt="WAC Eagle Globe"
                className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-[42px] md:text-[52px] lg:text-[58px] font-serif tracking-tight mb-5 leading-[1.1] text-white animate-in slide-in-from-bottom-4 duration-700 delay-100">
            The operating system for{" "}
            <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
            momentum.
          </h1>

          {/* Support line */}
          <p className="mx-auto max-w-2xl text-[16px] md:text-[18px] font-serif font-light text-white/48 leading-relaxed tracking-wide mb-10">
            A network built for Albanian trust, visibility, opportunity, and coordination across borders.
          </p>

          {/* Search bar */}
          <div className="mx-auto max-w-2xl w-full mb-6">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="group relative w-full flex items-center gap-5 rounded-full border border-[var(--border)] bg-[rgba(0,0,0,0.4)] py-5 pl-7 pr-7 shadow-2xl backdrop-blur-xl outline-none transition hover:border-[var(--accent)]/60 hover:bg-[rgba(0,0,0,0.55)] cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b08d57] opacity-50" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#b08d57]" />
              </span>
              <span className="flex-1 text-left select-none">
                <span className="font-serif text-white/40 group-hover:text-white/60 transition text-lg tracking-wide">
                  Search with{" "}
                </span>
                <span className="font-serif italic font-light opacity-90 text-[#b08d57] transition text-lg tracking-wide">
                  Alban Intelligence
                </span>
              </span>
            </button>
          </div>

          {/* Search helper text */}
          <p className="text-[11px] text-white/22 mb-10 tracking-wide">
            Find people, businesses, and organizations across the global Albanian network.
          </p>

          {/* Dual CTAs */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Link
              href="/directory"
              className="rounded-full bg-[#b08d57] px-6 py-3 text-[14px] font-semibold text-black tracking-wide transition-colors hover:bg-[#9a7545] whitespace-nowrap"
            >
              Explore the Directory
            </Link>
            <Link
              href="/directory?view=map"
              className="rounded-full border border-[#b08d57]/35 px-6 py-3 text-[14px] font-semibold text-[#d5bf92] tracking-wide transition-colors hover:bg-[#b08d57]/10 whitespace-nowrap"
            >
              Open Diaspora Map
            </Link>
          </div>

          {/* ── Proof strip ─────────────────────────────────────────────── */}
          <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-5 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            {/* Live now */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400/60 shrink-0">
                Live Now
              </span>
              {LIVE_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                  {item.label}
                </span>
              ))}
            </div>

            {/* Divider */}
            <span className="hidden sm:block w-px h-5 bg-white/[0.08]" />

            {/* Coming next */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/25 shrink-0">
                Coming
              </span>
              {COMING_ITEMS.map((item) => (
                <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/22 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/15" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Sign-in prompt */}
          <div className="h-7 mt-6">
            {isSignCheckComplete && !isLoggedIn && (
              <div className="text-sm text-white/40 animate-in fade-in duration-500">
                Not part of the network yet?{" "}
                <Link href="/login" className="text-[#b08d57] hover:underline opacity-90 transition font-medium">
                  Create your profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
