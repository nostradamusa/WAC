"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Search } from "lucide-react";

export default function EventsNavbarSearch({ isMobile }: { isMobile?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set("q", debouncedSearchTerm);
    } else {
      params.delete("q");
    }
    router.replace(`/events?${params.toString()}`);
  }, [debouncedSearchTerm, router, searchParams]);

  if (isMobile) {
    return (
      <div className="flex-1 relative">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search Events" 
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-3 py-1.5 text-sm transition-colors text-white placeholder:text-white/40 cursor-text focus:border-[var(--accent)] outline-none" 
        />
      </div>
    );
  }

  return (
    <div className="relative w-48 sm:w-64 mr-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Events"
        className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none text-white placeholder:text-white/40 transition-all shadow-inner"
      />
    </div>
  );
}
