"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type OwnedEntity = {
  id: string;
  name: string;
  is_verified: boolean;
  type: "business" | "organization" | "group";
  slug: string;
};

export default function ManagedEntitiesTab({ userId }: { userId: string }) {
  const [entities, setEntities] = useState<OwnedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntities() {
      if (!userId) return;

      const [businessesRes, orgsRes, groupsRes] = await Promise.all([
        supabase
          .from("businesses")
          .select("id, name, is_verified, slug")
          .eq("owner_id", userId),
        supabase
          .from("organizations")
          .select("id, name, is_verified, slug")
          .eq("owner_id", userId),
        supabase
          .from("groups")
          .select("id, name, is_verified, slug, group_members!inner(profile_id, role, status)")
          .eq("group_members.profile_id", userId)
          .in("group_members.role", ["owner", "admin"])
          .eq("group_members.status", "active"),
      ]);

      const loadedEntities: OwnedEntity[] = [];

      if (businessesRes.data) {
        loadedEntities.push(
          ...businessesRes.data.map((b) => ({
            ...b,
            type: "business" as const,
          })),
        );
      }

      if (orgsRes.data) {
        loadedEntities.push(
          ...orgsRes.data.map((o) => ({ ...o, type: "organization" as const })),
        );
      }

      if (groupsRes.data) {
        loadedEntities.push(
          ...groupsRes.data.map((g) => ({ 
            id: g.id, 
            name: g.name, 
            is_verified: g.is_verified, 
            slug: g.slug, 
            type: "group" as const 
          })),
        );
      }

      setEntities(loadedEntities);
      setLoading(false);
    }

    fetchEntities();
  }, [userId]);

  if (loading)
    return (
      <div className="p-8 text-center opacity-60">Loading entities...</div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Managed Entities</h2>
          <p className="opacity-70 text-sm">
            Businesses and Organizations owned by your account.
          </p>
        </div>
        <Link
          href="/profile/entities/new"
          className="wac-button-primary text-sm font-bold shadow-lg px-4 py-2 inline-block"
        >
          + Add New Entity
        </Link>
      </div>

      {entities.length === 0 ? (
        <div className="wac-card p-12 text-center border-dashed border-[var(--border)] border-2">
          <div className="w-16 h-16 bg-[var(--foreground)]/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="12" x2="12" y1="8" y2="16" />
              <line x1="8" x2="16" y1="12" y2="12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold mb-2">No entities yet</h3>
          <p className="opacity-60 text-sm max-w-sm mx-auto mb-6">
            You don't manage any businesses or organizations. Create one to get
            started and interact with the network on behalf of your brand.
          </p>
          <Link
            href="/profile/entities/new"
            className="wac-button-secondary text-sm font-bold inline-block"
          >
            Create an Entity
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="wac-card p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded inline-block ${
                      entity.type === "business"
                        ? "bg-blue-900/40 text-blue-400"
                        : entity.type === "group"
                        ? "bg-purple-900/40 text-purple-400"
                        : "bg-emerald-900/40 text-emerald-400"
                    }`}
                  >
                    {entity.type}
                  </div>
                  {entity.is_verified && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-emerald-500"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-2 truncate">
                  {entity.name}
                </h3>
                <p className="opacity-60 text-sm truncate">
                  {entity.type === "group" ? `/groups/${entity.slug}` : `/${entity.type}s/${entity.slug}`}
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <Link 
                  href={entity.type === "group" ? `/groups/${entity.slug}/settings` : `/profile/entities/${entity.id}`} 
                  className="flex-1 wac-button-secondary py-2 text-xs text-center font-bold inline-block"
                >
                  Edit
                </Link>
                <Link 
                  href={entity.type === "group" ? `/groups/${entity.slug}` : `/${entity.type}s/${entity.slug}`} 
                  className="flex-1 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-white transition rounded-xl py-2 text-xs text-center font-bold inline-block"
                >
                  View Public
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
