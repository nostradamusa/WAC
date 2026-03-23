import { NextResponse } from "next/server";
import { getPeopleDirectory } from "@/lib/services/searchService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // In actual prod, we might pass a 'limit: 6' down into searchService for efficiency
    // But since JS filtering is happening here currently for text arrays, we pull it and slice
    const { data, error } = await getPeopleDirectory({ q });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return sparse subset tailored to flyout UI to save bandwidth
    const sparseResults = data.slice(0, 6).map(person => ({
      id: person.id,
      full_name: person.full_name,
      username: person.username,
      avatar_url: person.avatar_url,
      headline: person.headline,
      profession_name: person.profession_name
    }));

    return NextResponse.json({ results: sparseResults });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
