import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import { OrganizationTabs } from "./OrganizationTabs";
import { OrganizationActionButtons } from "./OrganizationActionButtons";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacReviewTrigger from "@/components/reviews/WacReviewTrigger";
import { Landmark } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export async function generateStaticParams() {
  const { data } = await supabase
    .from("organizations_directory_v1")
    .select("slug");
  return data?.map((org) => ({ slug: org.slug })) || [];
}

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const { data, error } = await supabase
    .from("organizations_directory_v1")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const organization = data as OrganizationDirectoryEntry;
  const locationParts = [
    organization.city,
    organization.state,
    organization.country,
  ].filter(Boolean);
  const locationString =
    locationParts.length > 0 ? locationParts.join(", ") : "Global";

  return (
    <div className="wac-page pb-24 pt-24 md:pt-32">
      <div className="mx-auto max-w-[90rem] px-4">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 hover:text-emerald-400 transition mb-8"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Directory
      </Link>

      <div className="wac-card overflow-hidden">
        {/* Header Hero */}
        <div className="bg-emerald-950/20 px-8 py-12 relative border-b border-[var(--border)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl">
              <Landmark size={40} strokeWidth={1.5} />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2 py-1">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {organization.name}
                </h1>
                {organization.is_verified && (
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
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
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    Verified
                  </span>
                )}
                {organization.google_maps_url && typeof organization.google_rating === 'number' && (
                   <div className="ml-2">
                      <GoogleRatingBadge 
                         rating={organization.google_rating} 
                         reviewsCount={organization.google_reviews_count || 0} 
                         mapsUrl={organization.google_maps_url} 
                      />
                   </div>
                )}
                <div className="ml-2">
                  <WacReviewTrigger
                    entityId={organization.id}
                    entityName={organization.name}
                    entityType="organization"
                    rating={organization.wac_rating || 0}
                    reviewsCount={organization.wac_reviews_count || 0}
                  />
                </div>
              </div>

              <div className="text-lg opacity-80 font-medium flex items-center gap-2 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {locationString}
              </div>

              <div className="flex flex-wrap gap-3">
                {organization.organization_type && (
                  <span className="wac-button-chip-primary bg-emerald-500/10 border-[var(--border)] text-emerald-300 pointer-events-none">
                    {organization.organization_type}
                  </span>
                )}
              </div>

              <OrganizationActionButtons organization={organization} />
            </div>
          </div>
        </div>

        {/* Organization Tabs */}
        <OrganizationTabs organization={organization} />
      </div>
      </div>
    </div>
  );
}
