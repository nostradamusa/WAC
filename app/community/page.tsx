import CommunityHub from "@/components/community/CommunityHub";
import type { Metadata } from "next";
import { Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "The Pulse | World Albanian Congress",
  description: "What the Albanian world is talking about.",
};

export default function PulsePage() {
  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">
        
        {/* ── Page Shell Header ────────────────────────────────────────────── */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          <span className="italic font-light opacity-90 text-rose-400">Pulse</span>
        </h1>
        
        <p className="mt-2 text-sm text-white/50">
          What the Albanian world is talking about
        </p>

        {/* ── Page Content ─────────────────────────────────────────────────── */}
        <div className="mt-4">
          <CommunityHub />
        </div>
        
      </div>
    </div>
  );
}
