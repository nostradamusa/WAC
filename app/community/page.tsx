import CommunityHub from "@/components/community/CommunityHub";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Community Hub | World Albanian Congress",
  description: "For Every Generation. All Under One Roof.",
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen flex flex-col pt-14 bg-[var(--background)]">

      {/* Page Identity Header — desktop only */}
      <div className="hidden md:block sticky top-14 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              The Pulse
            </h1>
            <p className="text-[11px] text-white/35 mt-0.5 leading-none">
              What the Albanian world is talking about
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="p-12 text-center opacity-50">Loading Hub...</div>}>
        <CommunityHub />
      </Suspense>
    </main>
  );
}
