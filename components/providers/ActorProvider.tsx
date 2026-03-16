"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ActorIdentity = {
  id: string;
  type: "person" | "business" | "organization";
  name: string;
  slug?: string;
  avatar_url?: string;
};

type ActorContextType = {
  currentActor: ActorIdentity | null;
  setCurrentActor: (actor: ActorIdentity) => void;
  ownedEntities: ActorIdentity[];
  isLoading: boolean;
};

const ActorContext = createContext<ActorContextType>({
  currentActor: null,
  setCurrentActor: () => {},
  ownedEntities: [],
  isLoading: true,
});

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [currentActor, setCurrentActor] = useState<ActorIdentity | null>(null);
  const [ownedEntities, setOwnedEntities] = useState<ActorIdentity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // We expose a unified list that ALWAYS includes the personal account first, followed by entities
  const [allIdentities, setAllIdentities] = useState<ActorIdentity[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadIdentity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setIsLoading(false);
        return;
      }

      // Fetch personal profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .single();

      const personActor: ActorIdentity = {
        id: user.id,
        type: "person",
        name: profile?.full_name || user.email || "Unknown User",
        slug: profile?.username || undefined,
        avatar_url: profile?.avatar_url || undefined,
      };

      // Fetch managed entities
      const [businessesRes, orgsRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, slug, logo_url")
          .eq("owner_id", user.id),
        supabase
          .from("organizations")
          .select("id, name, slug, logo_url")
          .eq("owner_id", user.id),
      ]);

      const entities: ActorIdentity[] = [];
      if (businessesRes.data) {
        entities.push(
          ...businessesRes.data.map((b) => ({
            id: b.id,
            type: "business" as const,
            name: b.name,
            slug: b.slug,
            avatar_url: b.logo_url || undefined,
          })),
        );
      }
      if (orgsRes.data) {
        entities.push(
          ...orgsRes.data.map((o) => ({
            id: o.id,
            type: "organization" as const,
            name: o.name,
            slug: o.slug,
            avatar_url: o.logo_url || undefined,
          })),
        );
      }

      const all = [personActor, ...entities];

      if (mounted) {
        setOwnedEntities(entities);
        setAllIdentities(all);

        // Determine initial actor. Read from localStorage or default to person
        const savedActorId = localStorage.getItem("wac_active_actor_id");
        if (savedActorId) {
          const match = all.find((e) => e.id === savedActorId);
          if (match) {
            setCurrentActor(match);
          } else {
            setCurrentActor(personActor);
          }
        } else {
          setCurrentActor(personActor);
        }
        setIsLoading(false);
      }
    }

    loadIdentity();

    // Listen to sign in/out boundary
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setCurrentActor(null);
        setOwnedEntities([]);
        setAllIdentities([]);
        localStorage.removeItem("wac_active_actor_id");
      } else if (event === "SIGNED_IN") {
        loadIdentity();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSetActor = (actor: ActorIdentity) => {
    setCurrentActor(actor);
    localStorage.setItem("wac_active_actor_id", actor.id);
  };

  return (
    <ActorContext.Provider
      value={{
        currentActor,
        setCurrentActor: handleSetActor,
        ownedEntities: allIdentities, // Pass the combined list for easier UI rendering
        isLoading,
      }}
    >
      {children}
    </ActorContext.Provider>
  );
}

export const useActor = () => useContext(ActorContext);
