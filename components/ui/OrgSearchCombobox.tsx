"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrgResult {
  id:                string;
  name:              string;
  slug:              string;
  organization_type: string | null;
  city:              string | null;
  country:           string | null;
}

type OrgSearchComboboxProps = {
  value:    OrgResult | null;
  onChange: (org: OrgResult | null) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrgSearchCombobox({ value, onChange }: OrgSearchComboboxProps) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Debounced search against organizations_directory_v1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      debounceRef.current = setTimeout(() => {
        setResults([]);
        setOpen(false);
        setLoading(false);
      }, 0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("organizations_directory_v1")
        .select("id, name, slug, organization_type, city, country")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(8);

      if (!error) setResults((data as OrgResult[]) ?? []);
      setLoading(false);
      setOpen(true);
    }, 280);
  }, [query]);

  function handleSelect(org: OrgResult) {
    onChange(org);
    setQuery("");
    setResults([]);
    setLoading(false);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setLoading(false);
    setOpen(false);
  }

  // ── Selected state ────────────────────────────────────────────────────────

  if (value) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#b08d57]/30 bg-[#b08d57]/[0.04]">
        <div className="w-9 h-9 rounded-xl shrink-0 bg-[#b08d57]/15 border border-[#b08d57]/20 flex items-center justify-center text-[10px] font-bold text-[#b08d57]">
          {getInitials(value.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/80 truncate">{value.name}</p>
          {(value.organization_type || value.city) && (
            <p className="text-[11px] text-white/40 truncate">
              {[value.organization_type, value.city, value.country].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/[0.08] text-white/35 hover:text-white/70 transition-colors"
          aria-label="Remove linked organization"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // ── Search input + dropdown ───────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Building2
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
          strokeWidth={1.8}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            setLoading(nextQuery.trim().length > 0);
          }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search WAC organizations by name..."
          autoComplete="off"
          className="w-full rounded-xl border border-[var(--border)] bg-[#111] pl-10 pr-10 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
        />

        {/* Right slot: spinner or clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="w-3.5 h-3.5 border border-white/20 border-t-white/50 rounded-full animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); setLoading(false); setOpen(false); }}
              className="p-1 rounded-full hover:bg-white/[0.08] text-white/25 hover:text-white/55 transition-colors"
              aria-label="Clear search"
            >
              <X size={12} strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/[0.10] bg-[#161616] shadow-2xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-white/35 text-center">
              No organizations found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto">
              {results.map(org => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSelect(org)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg shrink-0 bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-[9px] font-bold text-white/40">
                    {getInitials(org.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{org.name}</p>
                    {(org.organization_type || org.city) && (
                      <p className="text-[11px] text-white/35 truncate">
                        {[org.organization_type, org.city, org.country].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
