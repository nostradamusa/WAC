"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BusinessProfile } from "@/lib/types/business-directory";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import BusinessCard from "@/components/businesses/results/BusinessCard";
import OrganizationCard from "@/components/organizations/results/OrganizationCard";

export default function EntitiesTab() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() || "";
  const filter = searchParams.get("filter") || "all";
  const location = searchParams.get("location")?.toLowerCase() || "";

  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [organizations, setOrganizations] = useState<
    OrganizationDirectoryEntry[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntities() {
      setLoading(true);

      const [bizRes, orgRes] = await Promise.all([
        supabase.from("businesses_directory_v1").select("*").order("name"),
        supabase.from("organizations_directory_v1").select("*").order("name"),
      ]);

      if (bizRes.data) setBusinesses(bizRes.data as BusinessProfile[]);
      if (orgRes.data)
        setOrganizations(orgRes.data as OrganizationDirectoryEntry[]);

      setLoading(false);
    }

    loadEntities();
  }, []);

  const combinedEntities = useMemo(() => {
    let result: Array<{ type: "business" | "organization"; data: any }> = [];

    if (filter === "all" || filter === "businesses") {
      const bFiltered = businesses.filter((b) => {
        let matches = true;
        if (q) {
          const searchString =
            `${b.name || ""} ${b.description || ""} ${b.industry_name || ""} ${b.city || ""} ${b.country || ""}`.toLowerCase();
          matches = searchString.includes(q);
        }
        if (matches && location) {
          const locString = `${b.city || ""} ${b.country || ""}`.toLowerCase();
          matches = locString.includes(location);
        }
        return matches;
      });
      bFiltered.forEach((b) => result.push({ type: "business", data: b }));
    }

    if (filter === "all" || filter === "organizations") {
      const oFiltered = organizations.filter((o) => {
        let matches = true;
        if (q) {
          const searchString =
            `${o.name || ""} ${o.description || ""} ${o.organization_type || ""} ${o.city || ""} ${o.country || ""}`.toLowerCase();
          matches = searchString.includes(q);
        }
        if (matches && location) {
          const locString = `${o.city || ""} ${o.country || ""}`.toLowerCase();
          matches = locString.includes(location);
        }
        return matches;
      });
      oFiltered.forEach((o) => result.push({ type: "organization", data: o }));
    }

    // Sort alphabetically by name
    return result.sort((a, b) =>
      (a.data.name || "").localeCompare(b.data.name || ""),
    );
  }, [businesses, organizations, q, filter]);

  return (
    <div className="w-full">
      {/* Search and Filters are now handled globally by GlobalDirectoryFilters and PeopleSearchBar */}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="wac-card p-6 h-48 animate-pulse flex flex-col justify-between"
            />
          ))}
        </div>
      ) : combinedEntities.length === 0 ? (
        <div className="wac-card p-16 text-center border-dashed border-white/10 opacity-70">
          <h3 className="text-xl font-bold text-white mb-2">
            No entities found.
          </h3>
          <p>Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-24">
          {combinedEntities.map((entity, idx) => (
            <div
              key={`${entity.type}-${entity.data.id}-${idx}`}
              className="relative group"
            >
              {entity.type === "business" ? (
                <BusinessCard business={entity.data as BusinessProfile} />
              ) : (
                <OrganizationCard
                  organization={entity.data as OrganizationDirectoryEntry}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
