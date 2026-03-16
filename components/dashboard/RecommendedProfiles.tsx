"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type RecommendedProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_verified: boolean;
  match_score: number;
  match_reasons: string[];
};

export default function RecommendedProfiles({
  profileId,
}: {
  profileId: string;
}) {
  const [profiles, setProfiles] = useState<RecommendedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        // Call the Supabase RPC function for the matching-engine
        const { data, error: rpcError } = await supabase.rpc(
          "get_recommended_profiles",
          {
            current_profile_id: profileId,
          },
        );

        if (rpcError) {
          throw rpcError;
        }

        setProfiles((data || []) as RecommendedProfile[]);
      } catch (err: any) {
        console.error("Error fetching recommendations:", err);
        setError(err.message || "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    }

    if (profileId) {
      fetchRecommendations();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="wac-card animate-pulse p-6">
        <div className="mb-4 h-6 w-1/3 rounded bg-[rgba(255,255,255,0.05)]"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-[rgba(255,255,255,0.05)]"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-[rgba(255,255,255,0.05)]"></div>
                <div className="h-3 w-1/3 rounded bg-[rgba(255,255,255,0.05)]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wac-card border-red-900/50 bg-red-900/10 p-6 text-sm text-red-400">
        Unable to load recommendations at this time.
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="wac-card p-6 text-center opacity-70">
        Complete your profile to see connection recommendations!
      </div>
    );
  }

  return (
    <div className="wac-card p-6">
      <h2 className="mb-6 text-xl font-bold">Who Should I Know?</h2>
      <div className="space-y-6">
        {profiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/people/${profile.username}`}
            className="group flex flex-col gap-4 rounded-xl border border-transparent p-3 transition hover:border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] sm:flex-row sm:items-center"
          >
            {/* Avatar */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--border)]">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[var(--accent)] text-lg font-bold text-white">
                  {profile.full_name?.charAt(0) || "?"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-[var(--accent)]">
                  {profile.full_name}
                </h3>
                {profile.is_verified && <VerifiedBadge type="person" />}
              </div>

              {profile.headline ? (
                <p className="text-sm opacity-90">{profile.headline}</p>
              ) : (
                <p className="text-sm opacity-90">
                  {profile.company || "Professional"}
                </p>
              )}

              {/* Location & Score */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60">
                {(profile.city || profile.state || profile.country) && (
                  <span>
                    {[profile.city, profile.state, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
                {profile.match_score > 0 && (
                  <span className="flex items-center gap-1 font-medium text-[var(--accent)]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Match Score: {profile.match_score}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
