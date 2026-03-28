"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type SuggestedPerson = {
  id: string;
  full_name: string;
  username: string | null;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export default function SuggestedPeopleWidget() {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;

      // Fetch profiles that have posted recently, ordered by most recent post
      let query = supabase
        .from("profiles")
        .select("id, full_name, username, headline, avatar_url, is_verified")
        .not("full_name", "is", null)
        .limit(5);

      // If logged in, exclude self and already-followed
      if (user) {
        const { data: followData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .eq("following_type", "person");

        const followedIds = (followData || []).map((f: any) => f.following_id);
        const exclude = [user.id, ...followedIds];
        query = query.not("id", "in", `(${exclude.join(",")})`);
      }

      const { data } = await query;
      if (mounted && data) setPeople(data as SuggestedPerson[]);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleFollow(personId: string, name: string) {
    setFollowed(prev => new Set([...prev, personId]));
    await supabase.rpc("toggle_follow", {
      p_following_type: "person",
      p_following_id: personId,
    });
  }

  if (!loading && people.length === 0) return null;

  return (
    <div className="wac-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={11} className="text-white/30 shrink-0" />
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/45">
          People to follow
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 size={16} className="animate-spin text-white/20" />
        </div>
      ) : (
        <div className="space-y-3.5">
          {people.map((person, i) => {
            const isFollowed = followed.has(person.id);
            const profileLink = person.username ? `/people/${person.username}` : "#";
            return (
              <div key={person.id}>
                {i > 0 && <div className="border-t border-white/[0.05] mb-3.5" />}
                <div className="flex items-center gap-2.5">
                  <Link href={profileLink} className="shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                      {person.avatar_url
                        ? <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
                        : <span className="text-[11px] font-bold text-white/30">{person.full_name.charAt(0)}</span>
                      }
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={profileLink} className="flex items-center gap-1 leading-none">
                      <span className="text-[12.5px] font-semibold text-white/80 truncate hover:text-white transition-colors">
                        {person.full_name}
                      </span>
                      {person.is_verified && <VerifiedBadge size={11} />}
                    </Link>
                    {person.headline && (
                      <p className="text-[10.5px] text-white/35 truncate mt-0.5">{person.headline}</p>
                    )}
                  </div>
                  {!isFollowed ? (
                    <button
                      onClick={() => handleFollow(person.id, person.full_name)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#b08d57]/25 text-[10.5px] font-semibold text-[#b08d57]/70 hover:bg-[#b08d57]/10 hover:border-[#b08d57]/40 transition-colors"
                    >
                      <UserPlus size={10} strokeWidth={2.2} />
                      Follow
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] font-medium text-white/25 px-2">Following</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/directory"
        className="mt-4 block text-center text-[10.5px] font-medium text-white/28 hover:text-white/50 transition-colors pt-3 border-t border-white/[0.05]"
      >
        Browse the full directory
      </Link>
    </div>
  );
}
