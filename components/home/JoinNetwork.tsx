"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function JoinNetwork({ userId }: { userId: string | null }) {
  if (userId) return null; // Hide this huge CTA if they are already in the network

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <section id="join-network" className="py-24 px-4 mb-20 text-center">
      <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-12">
        We are building the <br />
        <span className="text-[var(--accent)]">
          digital infrastructure
        </span>{" "}
        <br />
        of the Albanian diaspora.
      </h2>

      <div className="mx-auto max-w-4xl wac-card wac-heritage-glow p-12 text-center rounded-[32px] overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(176,141,87,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/login"
            className="wac-button-primary inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-full shadow-2xl transition-transform hover:-translate-y-1"
          >
            Create Your Profile
          </Link>
          <Link
            href="/login"
            className="wac-button-secondary inline-flex items-center justify-center px-10 py-5 text-xl font-bold rounded-full transition hover:bg-[rgba(255,255,255,0.05)] border border-[var(--border)]"
          >
            Join the Network
          </Link>
        </div>
      </div>
    </section>
  );
}
