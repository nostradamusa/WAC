import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BusinessProfile } from "@/lib/types/business-directory";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacReviewTrigger from "@/components/reviews/WacReviewTrigger";
import { Briefcase } from "lucide-react";

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the specific business
  const { data, error } = await supabase
    .from("businesses_directory_v1")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const business = data as BusinessProfile;

  return (
    <main className="wac-page pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-[90rem] px-4">
        {/* Back Link */}
        <a
          href="/businesses"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] opacity-80 transition hover:opacity-100"
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
        </a>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="space-y-6">
            <section className="wac-card overflow-hidden">
              <div className="p-8">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg">
                    <Briefcase size={36} strokeWidth={1.5} />
                  </div>
                  {business.is_verified && (
                    <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-8.1 8.1z" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

                <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
                  {business.name}
                </h1>

                <p className="mb-6 text-xl font-medium text-[var(--accent)]">
                  {business.business_type ||
                    business.industry_name ||
                    "Business"}
                </p>

                {business.google_maps_url && typeof business.google_rating === 'number' && (
                  <div className="mb-6">
                    <GoogleRatingBadge
                      rating={business.google_rating}
                      reviewsCount={business.google_reviews_count || 0}
                      mapsUrl={business.google_maps_url}
                    />
                  </div>
                )}
                <div className="mb-6">
                  <WacReviewTrigger
                    entityId={business.id}
                    entityName={business.name}
                    entityType="business"
                    rating={business.wac_rating || 0}
                    reviewsCount={business.wac_reviews_count || 0}
                  />
                </div>

                {(business.city || business.state || business.country) && (
                  <div className="mb-8 flex items-center gap-2 text-sm opacity-80">
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
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {[business.city, business.state, business.country]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  {business.description ? (
                    <p className="whitespace-pre-wrap leading-relaxed opacity-90">
                      {business.description}
                    </p>
                  ) : (
                    <p className="italic opacity-50">
                      No description provided.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="wac-card p-6">
              <h2 className="mb-4 text-lg font-bold">Details</h2>

              <dl className="space-y-4 text-sm">
                {business.google_maps_url && typeof business.google_rating === 'number' && (
                  <div>
                    <dt className="text-xs opacity-60 mb-1">Google Rating</dt>
                    <dd className="font-medium">
                      <GoogleRatingBadge
                        rating={business.google_rating}
                        reviewsCount={business.google_reviews_count || 0}
                        mapsUrl={business.google_maps_url}
                      />
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs opacity-60 mb-1">WAC Member Rating</dt>
                  <dd className="font-medium">
                    <WacReviewTrigger
                      entityId={business.id}
                      entityName={business.name}
                      entityType="business"
                      rating={business.wac_rating || 0}
                      reviewsCount={business.wac_reviews_count || 0}
                    />
                  </dd>
                </div>
                {(business.hiring_status === "hiring" ||
                  business.hiring_status === "actively_hiring") && (
                  <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
                    <dt className="mb-1 font-semibold text-green-400">
                      Hiring Status
                    </dt>
                    <dd className="font-medium text-green-300">
                      Actively Hiring
                    </dd>
                  </div>
                )}

                {business.employee_count_range && (
                  <div>
                    <dt className="text-xs opacity-60">Company Size</dt>
                    <dd className="font-medium">
                      {business.employee_count_range}
                    </dd>
                  </div>
                )}

                {business.founded_year && (
                  <div>
                    <dt className="text-xs opacity-60">Founded</dt>
                    <dd className="font-medium">{business.founded_year}</dd>
                  </div>
                )}
              </dl>
            </section>

            {(business.website ||
              business.linkedin ||
              business.instagram ||
              business.email ||
              business.phone) && (
              <section className="wac-card p-6">
                <h2 className="mb-4 text-lg font-bold">Contact & Links</h2>
                <ul className="space-y-4 text-sm">
                  {business.website && (
                    <li>
                      <a
                        href={
                          business.website.startsWith("http")
                            ? business.website
                            : `https://${business.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 transition hover:text-[var(--accent)]"
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
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                          <path d="M2 12h20" />
                        </svg>
                        Website
                      </a>
                    </li>
                  )}
                  {business.linkedin && (
                    <li>
                      <a
                        href={business.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 transition hover:text-[var(--accent)]"
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
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                          <rect width="4" height="12" x="2" y="9" />
                          <circle cx="4" cy="4" r="2" />
                        </svg>
                        LinkedIn
                      </a>
                    </li>
                  )}
                  {business.instagram && (
                    <li>
                      <a
                        href={business.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 transition hover:text-[var(--accent)]"
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
                          <rect
                            width="20"
                            height="20"
                            x="2"
                            y="2"
                            rx="5"
                            ry="5"
                          />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                        Instagram
                      </a>
                    </li>
                  )}
                  {business.email && (
                    <li>
                      <a
                        href={`mailto:${business.email}`}
                        className="flex items-center gap-3 transition hover:text-[var(--accent)]"
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
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        Email
                      </a>
                    </li>
                  )}
                  {business.phone && (
                    <li className="flex items-center gap-3 opacity-80">
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
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {business.phone}
                    </li>
                  )}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
