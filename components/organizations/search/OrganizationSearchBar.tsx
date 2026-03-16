"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OrganizationSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/organizations?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/organizations");
    }
  }

  return (
    <form
      onSubmit={handleSearch}
      className="relative w-full max-w-2xl mx-auto mb-12"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-60"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for nonprofits, student groups, chambers..."
        className="w-full rounded-2xl border border-[var(--border)] bg-[rgba(0,0,0,0.2)] py-4 pl-12 pr-32 text-lg shadow-xl outline-none transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-[var(--foreground)]"
      />
      <button
        type="submit"
        className="absolute right-2 top-2 bottom-2 rounded-xl bg-emerald-500/20 px-6 font-bold text-emerald-400 border border-emerald-500/30 transition hover:bg-emerald-500/30"
      >
        Search
      </button>
    </form>
  );
}
