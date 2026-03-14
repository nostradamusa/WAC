import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type PersonProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  headline: string | null;
  profession: string | null;
  profession_name: string | null;
  profession_slug: string | null;
  specialty_name: string | null;
  specialty_slug: string | null;
  company: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  linkedin: string | null;
  is_verified: boolean;
  open_to_work: boolean;
  open_to_hire: boolean;
  open_to_mentor: boolean;
  open_to_invest: boolean;
  open_to_collaborate: boolean;
  industry_name: string | null;
  industry_slug: string | null;
  skills: string[] | null;
};

function buildLocation(person: PersonProfile) {
  return [person.city, person.state, person.country].filter(Boolean).join(", ");
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data, error } = await supabase
    .from("people_directory_v1")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    notFound();
  }

  const person = data as PersonProfile;
  const location = buildLocation(person);

  return (
    <main className="wac-page">
      <section className="wac-card p-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              {person.full_name || person.username}
            </h1>

            {person.is_verified && (
              <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                Verified
              </p>
            )}
          </div>

          {person.headline && (
            <p className="text-lg opacity-90">{person.headline}</p>
          )}

          <div className="grid gap-2 text-sm opacity-90">
            {person.profession_name && (
              <p>
                <strong>Profession:</strong> {person.profession_name}
              </p>
            )}

            {person.company && (
              <p>
                <strong>Company:</strong> {person.company}
              </p>
            )}

            {person.specialty_name && (
              <p>
                <strong>Specialty:</strong> {person.specialty_name}
              </p>
            )}

            {person.industry_name && (
              <p>
                <strong>Industry:</strong> {person.industry_name}
              </p>
            )}

            {location && (
              <p>
                <strong>Location:</strong> {location}
              </p>
            )}
          </div>
        </div>

        {person.bio && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">About</h2>
            <p className="mt-3 leading-7 opacity-90">{person.bio}</p>
          </div>
        )}

        {person.skills && person.skills.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {person.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Open To</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {person.open_to_work && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs">
                Open to Work
              </span>
            )}
            {person.open_to_hire && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs">
                Hiring
              </span>
            )}
            {person.open_to_mentor && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs">
                Mentoring
              </span>
            )}
            {person.open_to_invest && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs">
                Investing
              </span>
            )}
            {person.open_to_collaborate && (
              <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs">
                Collaborating
              </span>
            )}
          </div>
        </div>

        {(person.website || person.linkedin) && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold">Links</h2>
            <div className="mt-4 space-y-2 text-sm">
              {person.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a className="underline" href={person.website}>
                    {person.website}
                  </a>
                </p>
              )}

              {person.linkedin && (
                <p>
                  <strong>LinkedIn:</strong>{" "}
                  <a className="underline" href={person.linkedin}>
                    {person.linkedin}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}