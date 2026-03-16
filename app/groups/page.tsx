import GroupsHub from "@/components/groups/GroupsHub";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Network Groups | World Albanian Congress",
  description: "Join professional, cultural, and life-stage networks.",
};

export default function GroupsPage() {
  return (
    <main className="min-h-screen flex flex-col pt-16 bg-[var(--background)]">
      {/* PAGE HERO */}
      <section className="relative overflow-hidden bg-[var(--background)] py-20 px-4 border-b border-[var(--foreground)]/10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent,transparent_28px,rgba(200,16,46,0.02)_28px,rgba(200,16,46,0.02)_29px)] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="max-w-[75rem] mx-auto relative z-10">
          <div className="wac-eyebrow mb-4 opacity-80 text-[var(--accent)]">
            <span className="inline-block w-6 h-[2px] bg-[var(--accent)] mr-3 align-middle"></span>
            Network Groups
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif tracking-tight mb-6 text-white leading-tight">
            <span className="text-[#D4AF37] italic font-light opacity-90">
              For Every
            </span>{" "}
            Generation.
            <br />
            <span className="text-[var(--accent)] font-extrabold tracking-tight text-3xl md:text-4xl mt-2 block">
              All Under One Roof.
            </span>
          </h1>
          <p className="text-lg md:text-xl opacity-70 max-w-3xl leading-relaxed">
            From toddlers in daycare to teens planning their futures, and
            professionals building their careers — the WAC Network Groups
            connect Albanian families with the programs, mentors, and resources
            they need, all rooted in shared culture and identity.
          </p>
        </div>
      </section>

      {/* HUB CONTENT */}
      <Suspense
        fallback={
          <div className="p-12 text-center opacity-50">Loading Groups...</div>
        }
      >
        <GroupsHub />
      </Suspense>
    </main>
  );
}
