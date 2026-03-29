"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CalendarDays, Compass, Network, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const PILLARS = [
  { label: "Directory", icon: Compass,      color: "text-[#b08d57]", ring: "border-[#b08d57]/25",  bg: "bg-[#b08d57]/[0.08]"  },
  { label: "Pulse",     icon: Activity,     color: "text-rose-400",  ring: "border-rose-500/25",   bg: "bg-rose-500/[0.07]"   },
  { label: "Events",   icon: CalendarDays, color: "text-teal-400",  ring: "border-teal-500/25",   bg: "bg-teal-500/[0.07]"   },
  { label: "Groups",   icon: Network,      color: "text-amber-400", ring: "border-amber-500/25",  bg: "bg-amber-500/[0.07]"  },
];

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const markSeen = () => {
    document.cookie = "wac_welcome_seen=true; path=/; max-age=31536000";
  };

  const handleEnter = () => {
    markSeen();
    router.push(isLoggedIn ? "/pulse" : "/vision");
  };

  if (!mounted) return null;

  return (
    <div className="relative flex flex-col min-h-[100dvh] bg-[var(--background)] overflow-hidden">

      {/* ── Atmospheric glow ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(176,141,87,0.13)_0%,transparent_65%)]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[var(--background)] to-transparent" />

      <main className="relative z-10 flex flex-col flex-1 items-center justify-between px-6 pt-20 pb-14 max-w-xs mx-auto w-full md:max-w-sm">

        {/* ── 1. Brand ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-3 duration-700">

          <div className="w-[84px] h-[84px] rounded-full overflow-hidden bg-[var(--accent)] border-2 border-[#b08d57]/50 shadow-[0_0_40px_rgba(176,141,87,0.22),0_0_80px_rgba(176,141,87,0.07)]">
            <img
              src="/images/wac-logo.jpg"
              alt="WAC"
              className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
            />
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <p className="font-serif text-[21px] tracking-tight text-white leading-none">
              World{" "}
              <span className="italic font-light text-[#b08d57] opacity-90">Albanian</span>{" "}
              Congress
            </p>
            <p className="text-[8px] tracking-[0.44em] text-white/28 uppercase">
              Connect · Build · Rise
            </p>
          </div>
        </div>

        {/* ── 2. Statement ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">

          <h2 className="font-serif text-[34px] leading-[1.12] tracking-tight text-[var(--warm-ivory)]">
            Your home in<br />
            <span className="italic font-light text-[#d5bf92]">the Albanian network.</span>
          </h2>

          <p className="text-[13px] leading-[1.85] text-white/42 max-w-[252px]">
            One platform for a community that spans borders, industries, and generations.
          </p>

          {/* Pillar pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {PILLARS.map(({ label, icon: Icon, color, ring, bg }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-3 py-[5px] rounded-full border ${ring} ${bg}`}
              >
                <Icon size={11} className={color} strokeWidth={1.8} />
                <span className={`text-[11px] font-medium tracking-wide ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. CTA ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-4 w-full animate-in fade-in zoom-in-95 duration-700 delay-400 fill-mode-both">

          <button
            onClick={handleEnter}
            className="w-full flex items-center justify-center gap-2.5 bg-[#b08d57] hover:bg-[#9a7545] text-black font-bold text-[15px] py-[14px] rounded-2xl shadow-[0_0_28px_rgba(176,141,87,0.28)] transition-all active:scale-[0.98] group"
          >
            Enter the Network
            <ArrowRight size={16} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {!isLoggedIn && (
            <p className="text-[12px] text-white/34">
              No account?{" "}
              <Link
                href="/login"
                onClick={markSeen}
                className="text-[#d5bf92] hover:text-[#b08d57] transition-colors"
              >
                Join the network
              </Link>
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
