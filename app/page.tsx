"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Hero from "@/components/home/Hero";
import WhyItExists from "@/components/home/WhyItExists";
import EcosystemHub from "@/components/home/EcosystemHub";
import Differentiator from "@/components/home/Differentiator";
import ComingNext from "@/components/home/ComingNext";
import MembersPreview from "@/components/home/MembersPreview";
import LongHorizon from "@/components/home/LongHorizon";
import JoinNetwork from "@/components/home/JoinNetwork";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <main className="flex-1 w-full flex flex-col pt-10">
        {/* 1. Hero — thesis, search, proof strip */}
        <Hero />
        {/* 2. Purpose — the gap this fills */}
        <WhyItExists />
        {/* 3. Live network — 5 surfaces already in motion */}
        <EcosystemHub />
        {/* 4. Differentiator — system, not pages */}
        <Differentiator />
        {/* 5. Coming next — intelligence, trust, orientation */}
        <ComingNext />
        {/* 6. Social proof — early members */}
        <MembersPreview />
        {/* 7. Long horizon — future layers */}
        <LongHorizon />
        {/* 8. Closing CTA — join early */}
        <JoinNetwork userId={userId} />
      </main>
    </div>
  );
}
