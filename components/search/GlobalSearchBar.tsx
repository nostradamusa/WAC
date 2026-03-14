"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, useRef, useTransition } from "react";
import Link from "next/link";

type GlobalSearchBarProps = {
  initialQuery?: string;
  autoFocus?: boolean;
};

type SearchResult = {
  id: string;
  full_name: string;
  headline?: string;
  profession_name?: string;
  avatar_url?: string;
  username: string;
};

export default function GlobalSearchBar({
  initialQuery = "",
  autoFocus = false,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const flyoutRef = useRef<HTMLDivElement>(null);

  // Sync URL query state
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery !== null && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams]);

  // Handle clicking outside to close flyout
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch instant results
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() || query.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/instant?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error("Flyout search error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q")?.toString().trim();

    setIsFocused(false);
    
    startTransition(() => {
      if (q) {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      } else {
        router.push(`/search`);
      }
    });
  }

  const showFlyout = isFocused && query.trim().length >= 2;

  return (
    <div className="relative w-full" ref={flyoutRef}>
      <form
        onSubmit={handleSubmit}
        className={`flex w-full items-center rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.03)] transition-all ${
          isFocused ? "border-[var(--accent)] bg-[rgba(255,255,255,0.05)] shadow-[0_0_15px_rgba(200,16,46,0.15)]" : ""
        } ${showFlyout ? "rounded-b-none border-b-transparent" : ""}`}
      >
        <div className="flex h-12 w-12 items-center justify-center opacity-50">
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
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          autoFocus={autoFocus}
          placeholder="Search people, professions, locations..."
          className="h-12 w-full bg-transparent pr-5 text-sm outline-none placeholder:text-[var(--foreground)] placeholder:opacity-50"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={isPending}
          className="mr-1 hidden h-10 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:opacity-90 sm:flex disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Flyout Results Dropdown */}
      {showFlyout && (
        <div className="absolute left-0 right-0 top-full z-50 flex max-h-[400px] flex-col overflow-y-auto rounded-b-2xl border border-t-0 border-[var(--border)] bg-[var(--background)] shadow-2xl backdrop-blur-xl">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 opacity-50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col gap-1">
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  People
                </div>
                {results.slice(0, 5).map((person) => (
                  <Link
                    key={person.id}
                    href={`/people/${person.username}`}
                    onClick={() => setIsFocused(false)}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--border)]">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--accent)] to-rose-900 text-sm font-bold text-white">
                          {person.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {person.full_name}
                      </span>
                      <span className="truncate text-xs opacity-60">
                        {person.headline || person.profession_name || "Community Member"}
                      </span>
                    </div>
                  </Link>
                ))}
                
                {results.length > 5 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      document.forms[0]?.requestSubmit();
                    }}
                    className="mt-2 w-full rounded-lg p-2 text-center text-xs font-medium text-[var(--accent)] transition hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    View all {results.length} results
                  </button>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-sm opacity-50">
                No results found for "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
