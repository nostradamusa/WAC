"use client";

import Link from "next/link";

export default function JoinNetwork({ userId }: { userId: string | null }) {
  if (userId) return null;

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-screen-xl">
        <div className="wac-card p-8 md:p-12 text-center relative overflow-hidden">
          {/* Subtle gold glow — premium feel without competing with the hero */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06)_0%,transparent_65%)] pointer-events-none" />

          <div className="relative z-10 max-w-md mx-auto">
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-white mb-3 leading-snug">
              The network is early.{" "}
              <span className="italic text-[#D4AF37]">Join it now.</span>
            </h2>
            <p className="text-sm text-white/45 mb-8 leading-relaxed">
              Create your profile, find your community, and be part of the Albanian
              network as it grows.
            </p>
            {/* Tier 1: gold filled — the terminal conversion action */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#D4AF37] text-black text-sm font-bold hover:bg-[#c9a430] transition-colors"
            >
              Create Your Profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
