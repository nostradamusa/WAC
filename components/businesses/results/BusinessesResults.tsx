"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BusinessProfile } from "@/lib/types/business-directory";
import BusinessCard from "./BusinessCard";

export default function BusinessesResults({
  businesses,
}: {
  businesses: BusinessProfile[];
}) {
  const searchParams = useSearchParams();

  const filteredBusinesses = useMemo(() => {
    let result = [...businesses];

    // Read filters from URL
    const q = searchParams.get("q")?.toLowerCase();
    const industry = searchParams.get("industry");
    const businessType = searchParams.get("business_type");
    const verifiedOnly = searchParams.get("verified_only");
    const hiringOnly = searchParams.get("hiring_only");

    if (q) {
      result = result.filter((business) => {
        const haystack = [
          business.name,
          business.description,
          business.business_type,
          business.industry_name,
          business.city,
          business.state,
          business.country,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    if (industry) {
      result = result.filter(
        (b) => b.industry_slug === industry || b.industry_id === industry,
      );
    }

    if (businessType) {
      result = result.filter(
        (b) => b.business_type?.toLowerCase() === businessType.toLowerCase(),
      );
    }

    if (verifiedOnly === "true") {
      result = result.filter((b) => b.is_verified);
    }

    if (hiringOnly === "true") {
      result = result.filter(
        (b) =>
          b.hiring_status === "hiring" || b.hiring_status === "actively_hiring",
      );
    }

    return result;
  }, [businesses, searchParams]);

  if (filteredBusinesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-[var(--border)] border-dashed p-12 text-center opacity-70">
        <h3 className="text-xl font-bold">No businesses found</h3>
        <p className="mt-2 text-sm max-w-sm">
          Try adjusting your search criteria or modifying your active filters to
          find what you are looking for.
        </p>
        <a
          href="/businesses"
          className="mt-6 font-semibold text-[var(--accent)] hover:underline"
        >
          Clear all filters
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredBusinesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  );
}
