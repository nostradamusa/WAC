import Link from "next/link";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacRatingBadge from "@/components/ui/WacRatingBadge";
import { Landmark } from "lucide-react";

export default function OrganizationCard({
  organization,
}: {
  organization: OrganizationDirectoryEntry;
}) {
  // Format location string cleanly
  const locationParts = [
    organization.city,
    organization.state,
    organization.country,
  ].filter(Boolean);
  const locationString =
    locationParts.length > 0 ? locationParts.join(", ") : "Global";

  return (
    <Link
      href={`/organizations/${organization.slug}`}
      className="wac-card group flex flex-col justify-between p-6 transition hover:border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] h-full min-h-[300px]"
    >
      <div>
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
            <Landmark size={26} strokeWidth={1.5} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 w-full">
              <h3 className="text-xl font-bold group-hover:text-[var(--accent)] transition-colors truncate">
                {organization.name}
              </h3>
              {organization.is_verified && (
                <div className="shrink-0 flex items-center">
                  <VerifiedBadge type="organization" />
                </div>
              )}
            </div>

            {(organization.google_maps_url && typeof organization.google_rating === 'number') || (typeof organization.wac_rating === 'number') ? (
              <div className="mt-1.5 mb-2 flex items-center gap-2 flex-wrap">
                {organization.google_maps_url && typeof organization.google_rating === 'number' && (
                  <GoogleRatingBadge 
                    rating={organization.google_rating} 
                    reviewsCount={organization.google_reviews_count || 0} 
                    mapsUrl={organization.google_maps_url} 
                  />
                )}
                {typeof organization.wac_rating === 'number' && (
                  <WacRatingBadge 
                    rating={organization.wac_rating || 0} 
                    reviewsCount={organization.wac_reviews_count || 0} 
                  />
                )}
              </div>
            ) : null}

            <p className="text-sm opacity-60 flex items-center gap-1.5 mt-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
            </p>
          </div>
        </div>

        <p className="text-[15px] opacity-80 leading-relaxed line-clamp-3">
          {organization.description ||
            "Connecting the community through initiatives and events."}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
            Association
          </span>
        </div>

        {organization.website && (
          <div className="text-xs opacity-50 flex items-center gap-1 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            {organization.website
              .replace(/^https?:\/\//, "")
              .replace(/\/$/, "")}
          </div>
        )}
      </div>
    </Link>
  );
}
