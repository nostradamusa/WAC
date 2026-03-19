import CommunityHub from "@/components/community/CommunityHub";
import type { Metadata } from "next";
import { Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "The Pulse | World Albanian Congress",
  description: "What the Albanian world is talking about.",
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen flex flex-col pt-14 bg-[var(--background)]">

      {/*
        Sticky page identity header — desktop only.
        Height ~76px (py-5 + content). CommunityHub accounts for this
        in its viewport height calc: h-[calc(100vh-8.25rem)].
        backdrop-blur-md + solid bg ensures posts scrolling beneath
        don't bleed through.
      */}
      <div className="hidden md:block sticky top-14 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-[80rem] mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15] shrink-0">
            <Activity size={16} className="text-rose-400" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-serif text-[15px] font-normal text-white leading-none mb-0.5">
              The{" "}
              <span className="italic text-rose-400">Pulse</span>
            </h1>
            <p className="text-[10px] text-white/35 leading-none">
              What the Albanian world is talking about
            </p>
          </div>
        </div>
      </div>

      {/* CommunityHub owns its own full-viewport scrollable layout */}
      <CommunityHub />

    </main>
  );
}
