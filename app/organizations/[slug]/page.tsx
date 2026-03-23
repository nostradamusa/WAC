import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import OrganizationHubClient from "./OrganizationHubClient";

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

  return <OrganizationHubClient organization={data as OrganizationDirectoryEntry} />;
}
