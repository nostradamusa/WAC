import { notFound } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/services/profileService";
import ProfileActivityClient from "@/components/people/ProfileActivityClient";
import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata(
  props: { params: Promise<{ username: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const p = await props.params;
  const username = p.username;
  if (!username) return { title: "Not Found" };
  const profile = await getPublicProfileByUsername(username);
  if (!profile) return { title: "Not Found" };
  
  const displayName = profile.full_name || profile.username || "WAC Member";
  return {
    title: `Activity | ${displayName} | The Pulse`,
  };
}

export default async function ProfileActivityPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const p = await params;
  const username = p.username;

  if (!username) {
    notFound();
  }

  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="bg-[#050505] min-h-screen pt-14 pb-20">
      <div className="max-w-[800px] mx-auto w-full">
         <ProfileActivityClient profile={profile} />
      </div>
    </div>
  );
}
