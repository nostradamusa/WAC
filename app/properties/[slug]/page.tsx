import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PropertyDetail from "@/components/properties/PropertyDetail";
import type { EnrichedProperty } from "@/lib/types/property-directory";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) notFound();

  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      media:property_media(*),
      features:property_features(feature_tag),
      owner:profiles!properties_owner_user_id_fkey(id, full_name, avatar_url, username, is_verified, headline, city, country),
      business:businesses!properties_representing_business_id_fkey(id, name, logo_url, slug, is_verified, industry:industries(name))
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) notFound();

  // Block hidden/draft unless owner (would need auth check; for now just block non-active)
  if (data.status !== "active" || data.moderation_status !== "approved") {
    notFound();
  }

  if (data.business && (data.business as any).industry) {
    (data.business as any).industry_name = (data.business as any).industry.name || (data.business as any).industry[0]?.name;
    delete (data.business as any).industry;
  }

  const property = data as unknown as EnrichedProperty;

  return (
    <main className="w-full overflow-x-hidden relative min-h-screen bg-[var(--background)] pt-20 md:pt-24 pb-24">
      <PropertyDetail property={property} />
    </main>
  );
}
