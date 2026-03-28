"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Building2, Landmark } from "lucide-react";
import FeedList from "@/components/feed/FeedList";
import SuggestedPeopleWidget from "./SuggestedPeopleWidget";
import { useActor } from "@/components/providers/ActorProvider";

export default function CommunityHub() {
  const { currentActor } = useActor();
  const isEntityContext = currentActor && currentActor.type !== "person";

  // ── Scroll event relay ────────────────────────────────────────────────────
  // Dispatches wac-feed-scroll so Navbar and FeedList can hide their chrome.
  //
  // RAF-throttled: collapses rapid scroll events to one dispatch per frame.
  // Mobile only — window.innerWidth >= 768 bails out immediately so the
  // desktop nav is never affected.

  const lastScrollY  = useRef(0);
  const rafPending   = useRef<number | null>(null);

  useEffect(() => {
    const handleRefresh = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("wac-refresh-feed", handleRefresh);
    return () => window.removeEventListener("wac-refresh-feed", handleRefresh);
  }, []);

  useEffect(() => {
    function handleWindowScroll() {
      if (window.innerWidth >= 768) return;

      if (rafPending.current !== null) return;

      rafPending.current = requestAnimationFrame(() => {
        rafPending.current = null;

        const y     = window.scrollY;
        const delta = y - lastScrollY.current;

        if (Math.abs(delta) < 5) return;

        lastScrollY.current = y;

        window.dispatchEvent(
          new CustomEvent("wac-feed-scroll", {
            detail: { direction: delta > 0 ? "down" : "up", y },
          })
        );
      });
    }

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      if (rafPending.current !== null) cancelAnimationFrame(rafPending.current);
    };
  }, []);

  return (
    <div className="w-full bg-[var(--background)]">
      <div className="max-w-[80rem] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">

        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div className="col-span-1 lg:col-span-8 pb-32">

          {/* Acting-as banner */}
          {isEntityContext && (
            <div className="flex items-center gap-2.5 mb-6 py-2.5 px-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
                {currentActor.avatar_url
                  ? <img src={currentActor.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[var(--accent)] text-[10px] font-bold">{currentActor.name.charAt(0)}</span>
                }
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                {currentActor.type === "organization"
                  ? <Landmark size={11} className="text-[var(--accent)]/60 shrink-0" />
                  : <Building2 size={11} className="text-[var(--accent)]/60 shrink-0" />
                }
                <span className="text-[11px] text-white/40">Acting as</span>
                <span className="text-[11px] font-semibold text-[var(--accent)] truncate">{currentActor.name}</span>
              </div>
            </div>
          )}

          <div className="max-w-2xl w-full mx-auto lg:ml-auto lg:mr-8 xl:mx-auto">
            <FeedList />
          </div>
        </div>

        {/* ── RIGHT COLUMN — desktop only, sticky ────────────── */}
        <div className="hidden lg:flex lg:col-span-4 sticky top-24 self-start h-[calc(100vh-7rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-col">
          <div className="space-y-4 pb-12 pt-2 pr-4">

            {/* Suggested people — real data from follows + profiles */}
            <SuggestedPeopleWidget />

            {/* Build Your Network */}
            <div className="wac-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1.5">Build Your Network</h3>
              <p className="text-xs text-white/45 mb-4 leading-relaxed">
                Keep your profile current so the right people can find and connect with you.
              </p>
              <Link
                href="/profile"
                className="flex w-full items-center justify-center py-2 rounded-full border border-rose-500/30 text-sm font-medium text-rose-400/70 hover:bg-rose-500/10 transition-colors"
              >
                Update Profile
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
