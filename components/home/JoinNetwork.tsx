"use client";

import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

export default function JoinNetwork({ userId }: { userId: string | null }) {
  if (userId) return null;

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-screen-xl">
        <div className="wac-card border border-white/[0.08] bg-[linear-gradient(180deg,rgba(176,141,87,0.05),rgba(255,255,255,0.02))] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,87,0.08)_0%,transparent_65%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <SectionLabel label="Join Early" variant="standard" className="mb-5" />
              <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.15] tracking-tight text-[var(--warm-ivory)]">
                Help shape the{" "}
                <span className="italic text-[#b08d57]">standard.</span>
              </h2>
              <p className="mt-4 max-w-xl font-serif text-[15px] font-light leading-[1.85] text-white/48">
                Every serious network becomes more valuable when the right people arrive early,
                shape its culture, and give the next layer of growth something real to build on.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="rounded-full bg-[#b08d57] px-6 py-3 text-center text-[14px] font-semibold text-black transition-colors hover:bg-[#9a7545] whitespace-nowrap"
              >
                Join the Network
              </Link>
              <Link
                href="/directory"
                className="rounded-full border border-[#b08d57]/30 px-6 py-3 text-center text-[14px] font-semibold text-[#d5bf92] transition-colors hover:bg-[#b08d57]/10 whitespace-nowrap"
              >
                Explore the Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
