"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

type BusinessSearchBarProps = {
  initialQuery?: string;
};

export default function BusinessSearchBar({
  initialQuery = "",
}: BusinessSearchBarProps) {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q")?.toString().trim();

    // Since we are doing client-side filtering via searchParams,
    // we want to preserve existing filters and just push the new query.
    const searchParams = new URLSearchParams(window.location.search);
    if (q) {
      searchParams.set("q", q);
    } else {
      searchParams.delete("q");
    }

    router.push(`/businesses?${searchParams.toString()}`);
  }

  return (
    <section className="wac-card mb-6 p-5">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"
      >
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search business name, category, city..."
          className="rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            className="wac-button-primary border border-transparent bg-[var(--accent)] rounded-2xl px-6 py-2 pb-2.5 font-semibold text-white transition hover:opacity-90"
          >
            Search
          </button>

          <a
            href="/businesses"
            className="wac-button-secondary border border-[var(--border)] rounded-2xl px-6 py-2 pt-2.5 font-semibold transition hover:bg-[rgba(255,255,255,0.05)]"
          >
            Clear
          </a>
        </div>
      </form>
    </section>
  );
}
