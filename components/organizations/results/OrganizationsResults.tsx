"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import OrganizationCard from "./OrganizationCard";

export default function OrganizationsResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() || "";

  const [organizations, setOrganizations] = useState<
    OrganizationDirectoryEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from("organizations_directory_v1")
          .select("*")
          .order("name");

        if (sbError) throw sbError;

        // Client-side text filtering logic equivalent to what we did in Businesses
        const filtered = (data as OrganizationDirectoryEntry[]).filter(
          (org) => {
            if (!q) return true;
            const searchString = `
            ${org.name || ""} 
            ${org.description || ""} 
            ${org.organization_type || ""} 
            ${org.city || ""} 
            ${org.state || ""}
            ${org.country || ""}
          `.toLowerCase();

            return searchString.includes(q);
          },
        );

        setOrganizations(filtered);
      } catch (err: unknown) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load organizations.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [q]);

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="wac-card p-6 h-48 animate-pulse flex flex-col justify-between"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="wac-card p-12 text-center text-red-400 border-red-500/20">
        <p>{error}</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="wac-card p-16 text-center border-dashed border-white/10 opacity-70">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 2v10m0 0L14.5 9.5M17 12l2.5-2.5" />
            <path d="M7 22v-10m0 0L4.5 14.5M7 12l2.5 2.5" />
            <path d="M22 17a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5v5h14v-5Z" />
            <path d="M2 7a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5V2H2v5Z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          No organizations found.
        </h3>
        <p>
          Try adjusting your search criteria or checking back soon as the
          network grows.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <OrganizationCard key={org.id} organization={org} />
      ))}
    </div>
  );
}
