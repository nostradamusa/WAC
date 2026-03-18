"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

import Hero from "@/components/home/Hero";
import WhyItExists from "@/components/home/WhyItExists";
import EcosystemHub from "@/components/home/EcosystemHub";
import HomeFeedPreview from "@/components/home/HomeFeedPreview";
import NetworkIntelligence from "@/components/home/NetworkIntelligence";
import LivingNetwork from "@/components/home/LivingNetwork";
import MembersPreview from "@/components/home/MembersPreview";
import Vision from "@/components/home/Vision";
import JoinNetwork from "@/components/home/JoinNetwork";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email ?? null);
        setUserId(data.user.id ?? null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserId(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <main className="flex-1 w-full flex flex-col pt-10">
        <Hero />
        {/* Editorial sections — desktop only */}
        <div className="hidden md:contents">
          <EcosystemHub />
          <HomeFeedPreview />
          <NetworkIntelligence userId={userId} />
          <LivingNetwork />
          <MembersPreview />
          <WhyItExists />
          <Vision />
          <JoinNetwork userId={userId} />
        </div>
      </main>
    </div>
  );
}
