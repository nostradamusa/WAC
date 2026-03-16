"use client";

import RecommendedProfiles from "@/components/dashboard/RecommendedProfiles";

export default function NetworkIntelligence({
  userId,
}: {
  userId: string | null;
}) {
  return (
    <section
      id="opportunity-graph"
      className="py-24 px-4 bg-[var(--background)]"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="grid gap-12 lg:grid-cols-[1fr_450px] items-center">
          <div className="max-w-xl">
            <h2 className="text-4xl font-serif tracking-tight sm:text-6xl leading-tight mb-6 text-white">
              <span className="text-[#D4AF37] italic font-light opacity-90">
                Opportunity
              </span>{" "}
              Graph
            </h2>
            <div className="space-y-6 text-xl opacity-80 leading-relaxed font-medium">
              <p>
                A directory stores profiles. A living network{" "}
                <span className="italic font-serif text-white/90">
                  connects
                </span>{" "}
                them.
              </p>
              <p>
                Our intelligence engine analyzes your industry, location, and
                roots to map meaningful opportunities across the diaspora,
                actively surfacing the people who matter most.
              </p>
            </div>

            {!userId && (
              <button
                onClick={() => {
                  const loginBtn = document.getElementById("wac-global-login");
                  if (loginBtn) loginBtn.click();
                }}
                className="mt-10 wac-button-primary rounded-full px-8 py-3 text-[1.1rem] font-bold"
              >
                Sign In to See Your Matches
              </button>
            )}
          </div>

          <div className="relative">
            {/* Soft background glow */}
            <div className="absolute inset-0 bg-[var(--accent)]/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10">
              {userId ? (
                <div className="wac-heritage-glow rounded-[24px]">
                  <RecommendedProfiles profileId={userId} />
                </div>
              ) : (
                <div className="wac-card p-8 border-dashed opacity-60 flex flex-col items-center text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-20 mb-6"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                  <h3 className="text-xl font-bold mb-2">Algorithm Sleeping</h3>
                  <p className="opacity-70">
                    Sign in to awaken the matching engine and generate your
                    personalized network recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
