"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type ActorIdentity = {
  id: string;
  type: "person" | "business" | "organization";
  name: string;
  slug?: string;
  avatar_url?: string;
  role?: string;
};

type ActorContextType = {
  /** The authenticated user — never changes while signed in */
  loggedInUserId: string | null;
  /** Currently active identity (person, business, or org) */
  currentActor: ActorIdentity | null;
  setCurrentActor: (actor: ActorIdentity) => void;
  /** All identities this user can act as (personal + owned entities) */
  ownedEntities: ActorIdentity[];
  isLoading: boolean;
};

const ActorContext = createContext<ActorContextType>({
  loggedInUserId: null,
  currentActor: null,
  setCurrentActor: () => {},
  ownedEntities: [],
  isLoading: true,
});

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [currentActor, setCurrentActor] = useState<ActorIdentity | null>(null);
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
      if (mounted) setLoggedInUserId(user.id);

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

      // Load entity access via role/membership table — not owner_id.
      // Falls back to owner_id queries if entity_roles table doesn't exist yet
      // (i.e. add_entity_roles.sql has not been run in this environment).
      const { data: roles, error: rolesError } = await supabase
        .from("entity_roles")
        .select("entity_type, entity_id, role")
        .eq("user_id", user.id);

      const entities: ActorIdentity[] = [];

      const roleMigrationReady = !rolesError;

      if (roleMigrationReady && roles && roles.length > 0) {
        // ── Post-migration path: use entity_roles as source of truth ──────────
        const businessIds = roles.filter((r) => r.entity_type === "business").map((r) => r.entity_id);
        const orgIds      = roles.filter((r) => r.entity_type === "organization").map((r) => r.entity_id);

        const [businessesRes, orgsRes] = await Promise.all([
          businessIds.length > 0
            ? supabase.from("businesses").select("id, name, slug, logo_url").in("id", businessIds)
            : Promise.resolve({ data: [] as any[] }),
          orgIds.length > 0
            ? supabase.from("organizations").select("id, name, slug, logo_url").in("id", orgIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);

        if (businessesRes.data) {
          entities.push(...businessesRes.data.map((b) => ({
            id: b.id, type: "business" as const,
            name: b.name, slug: b.slug, avatar_url: b.logo_url || undefined,
            role: roles.find(r => r.entity_id === b.id)?.role || "member"
          })));
        }
        if (orgsRes.data) {
          entities.push(...orgsRes.data.map((o) => ({
            id: o.id, type: "organization" as const,
            name: o.name, slug: o.slug, avatar_url: o.logo_url || undefined,
            role: roles.find(r => r.entity_id === o.id)?.role || "member"
          })));
        }
      } else if (!roleMigrationReady) {
        // ── Pre-migration fallback: query owner_id directly ───────────────────
        // Remove this branch after add_entity_roles.sql is run in all environments.
        const [businessesRes, orgsRes] = await Promise.all([
          supabase.from("businesses").select("id, name, slug, logo_url").eq("owner_id", user.id),
          supabase.from("organizations").select("id, name, slug, logo_url").eq("owner_id", user.id),
        ]);

        if (businessesRes.data) {
          entities.push(...businessesRes.data.map((b) => ({
            id: b.id, type: "business" as const,
            name: b.name, slug: b.slug, avatar_url: b.logo_url || undefined,
            role: "owner"
          })));
        }
        if (orgsRes.data) {
          entities.push(...orgsRes.data.map((o) => ({
            id: o.id, type: "organization" as const,
            name: o.name, slug: o.slug, avatar_url: o.logo_url || undefined,
            role: "owner"
          })));
        }
      }

      const all = [personActor, ...entities];

      if (mounted) {
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
        setLoggedInUserId(null);
        setCurrentActor(null);
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
        loggedInUserId,
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
