"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import GlobalSearchOverlay from "@/components/layout/GlobalSearchOverlay";
import {
  Activity,
  Search,
  Compass,
  CalendarDays,
  Users,
  Network,
  Briefcase,
  HeartHandshake,
  Building2,
  ArrowRight,
} from "lucide-react";

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

      {/* ── Mobile: Compact Launchpad ──────────────────────────────────── */}
      <section className="md:hidden px-4 pt-5 pb-6 space-y-3.5">

        {/* 1. Brand mark */}
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[var(--accent)] flex items-center justify-center shadow-[0_0_14px_rgba(176,141,87,0.28)] border-2 border-[#b08d57]/60">
            <img
              src="/images/wac-logo.jpg"
              alt="WAC"
              className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
            />
          </div>
          <div>
            <h1 className="font-serif text-[17px] leading-none text-white mb-[3px]">
              World{" "}
              <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
              Congress
            </h1>
            <p className="text-[8.5px] tracking-[0.38em] text-white/28 uppercase">
              Connect · Build · Rise
            </p>
          </div>
        </div>

        {/* 2. Primary CTA — The Pulse */}
        <Link
          href="/community"
          className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/[0.07] border border-rose-500/[0.14] transition-colors active:scale-[0.98] group"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/[0.14] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-rose-400" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white leading-none mb-1">The Pulse</p>
            <p className="text-[11px] text-white/38 truncate">Community feed · latest from the diaspora</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-rose-400/50 transition shrink-0" />
        </Link>

        {/* 3. Quick-access grid — Directory · Events · People */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              href: "/directory",
              icon: Compass,
              label: "Directory",
              iconColor: "text-[#b08d57]",
              bg: "bg-[#b08d57]/[0.08]",
              border: "border-[#b08d57]/[0.13]",
            },
            {
              href: "/events",
              icon: CalendarDays,
              label: "Events",
              iconColor: "text-emerald-400",
              bg: "bg-emerald-400/[0.08]",
              border: "border-emerald-400/[0.13]",
            },
            {
              href: "/people",
              icon: Users,
              label: "People",
              iconColor: "text-sky-400",
              bg: "bg-sky-400/[0.08]",
              border: "border-sky-400/[0.13]",
            },
          ].map(({ href, icon: Icon, label, iconColor, bg, border }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl ${bg} border ${border} transition-colors active:scale-95`}
            >
              <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.8} />
              </div>
              <span className={`text-[11px] font-semibold ${iconColor} leading-none`}>
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* 4. Discovery pills — horizontal scroll */}
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {[
            { href: "/jobs", icon: Briefcase, label: "Jobs" },
            { href: "/businesses", icon: Building2, label: "Businesses" },
            { href: "/organizations", icon: HeartHandshake, label: "Organizations" },
            { href: "/groups", icon: Network, label: "Groups" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/45 hover:text-white/70 hover:border-white/[0.13] transition-colors whitespace-nowrap"
            >
              <Icon className="w-3 h-3 opacity-60" strokeWidth={1.7} />
              {label}
            </Link>
          ))}
        </div>

        {/* 5. Join CTA — only when logged out */}
        {isSignCheckComplete && !isLoggedIn && (
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3 rounded-2xl bg-[var(--accent)] text-black text-sm font-bold tracking-wide transition hover:bg-[#F2D06B] active:scale-[0.98]"
          >
            Join the Network
          </Link>
        )}
      </section>

      {/* ── Desktop: Full Editorial Hero ──────────────────────────────── */}
      <section className="relative hidden md:flex flex-col items-center justify-center pt-32 pb-24 text-center px-4 min-h-0">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,87,0.12)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl">
          <div className="flex justify-center mb-8">
            <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] drop-shadow-[0_0_20px_rgba(176,141,87,0.25)] animate-in zoom-in duration-700 relative border-[3px] border-[#b08d57]/60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_60%)] mix-blend-overlay pointer-events-none" />
              <img
                src="/images/wac-logo.jpg"
                alt="WAC Eagle Globe"
                className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
              />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif tracking-tight mb-12 leading-tight text-white animate-in slide-in-from-bottom-4 duration-700 delay-100">
            World{" "}
            <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span>{" "}
            Congress
          </h1>

          <div className="mx-auto max-w-3xl px-2 mb-16">
            <p className="text-lg md:text-xl font-serif font-light text-white/55 mb-5 leading-relaxed tracking-wide">
              The global network for{" "}
              <span className="text-[#b08d57] italic font-light opacity-90">Albanians</span>.
            </p>
            <p className="text-[10px] tracking-[0.45em] font-sans font-light text-white/35 uppercase">
              Connect&nbsp;&nbsp;·&nbsp;&nbsp;Build&nbsp;&nbsp;·&nbsp;&nbsp;Rise
            </p>
          </div>

          {/* Desktop search bar */}
          <div className="mx-auto max-w-2xl w-full">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="group relative w-full flex items-center gap-5 rounded-full border border-[var(--border)] bg-[rgba(0,0,0,0.4)] py-5 pl-7 pr-7 shadow-2xl backdrop-blur-md outline-none transition hover:border-[var(--accent)]/60 hover:bg-[rgba(0,0,0,0.55)] cursor-pointer"
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

          <div className="h-8 mt-6">
            {isSignCheckComplete && !isLoggedIn && (
              <div className="text-sm text-white/50 animate-in fade-in duration-500">
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
