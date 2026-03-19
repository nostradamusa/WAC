"use client";

import { Users } from "lucide-react";
import RecommendedProfiles from "@/components/dashboard/RecommendedProfiles";
import SectionLabel from "@/components/ui/SectionLabel";

export default function NetworkIntelligence({
  userId,
}: {
  userId: string | null;
}) {
  return (
    <section className="py-16 px-4 bg-[rgba(255,255,255,0.01)] border-y border-[var(--border)]">
      <div className="mx-auto max-w-screen-xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_420px] items-center">

          {/* Left: context copy */}
          <div className="max-w-lg">
            <SectionLabel label="People You Should Know" variant="standard" className="mb-5" />
            <h2 className="font-serif text-3xl md:text-4xl font-normal text-white leading-[1.2] mb-5">
              A directory stores profiles. A living network{" "}
              <span className="italic text-[#D4AF37]">connects</span> them.
            </h2>
            <p className="text-[15px] text-white/55 leading-[1.75]">
              The platform surfaces Albanian professionals matched to your industry,
              location, and background — people you would otherwise never find.
            </p>
            {!userId && (
              <button
                onClick={() => {
                  const loginBtn = document.getElementById("wac-global-login");
                  if (loginBtn) loginBtn.click();
                }}
                className="mt-8 px-6 py-2.5 rounded-full bg-[#D4AF37] text-black text-sm font-bold hover:bg-[#c9a430] transition-colors"
              >
                Sign In to See Your Matches
              </button>
            )}
          </div>

          {/* Right: personalized recommendations or sign-in prompt */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#D4AF37]/[0.06] blur-[70px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              {userId ? (
                <div className="wac-heritage-glow rounded-[24px]">
                  <RecommendedProfiles profileId={userId} />
                </div>
              ) : (
                /*
                  Logged-out placeholder: communicates what the feature does,
                  not a theatrical "sleeping algorithm" dead state.
                */
                <div className="wac-card p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Users size={20} className="text-[#D4AF37]/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">
                      See your recommended connections
                    </h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Sign in to see Albanian professionals matched to your
                      industry and location.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
