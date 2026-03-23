import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BusinessProfile } from "@/lib/types/business-directory";
import BusinessHubClient from "./BusinessHubClient";

export const revalidate = 60; // Revalidate every minute

export async function generateStaticParams() {
  const { data } = await supabase.from("businesses_directory_v1").select("slug");
  return data?.map((biz) => ({ slug: biz.slug })) || [];
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  // Fetch the specific business
  const { data, error } = await supabase
    .from("businesses_directory_v1")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single();

  if (error || !data) {
    notFound();
  }

  return <BusinessHubClient business={data as BusinessProfile} />;
}
