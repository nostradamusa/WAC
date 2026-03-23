import { notFound } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/services/profileService";
import PublicProfile from "@/components/people/PublicProfile";

// Note: Next.js 15 route parameters are Promises!
export default async function PersonProfilePage({
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
    <main className="w-full overflow-x-hidden relative min-h-screen bg-[var(--background)] pt-24 md:pt-32">
      <PublicProfile profile={profile} />
    </main>
  );
}
