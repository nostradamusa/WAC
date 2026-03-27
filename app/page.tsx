"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import Hero from "@/components/home/Hero";
import WhyItExists from "@/components/home/WhyItExists";
import EcosystemHub from "@/components/home/EcosystemHub";
import MembersPreview from "@/components/home/MembersPreview";
import NetworkIntelligence from "@/components/home/NetworkIntelligence";
import Vision from "@/components/home/Vision";
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
        <Hero />
        {/*
          Desktop editorial sections.
          Order: purpose → product → social proof → personalization → future → join.
        */}
        <WhyItExists />
        <EcosystemHub />
        <MembersPreview />
        <NetworkIntelligence userId={userId} />
        <Vision />
        <JoinNetwork userId={userId} />
      </main>
    </div>
  );
}
