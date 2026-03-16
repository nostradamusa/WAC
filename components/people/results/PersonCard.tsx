"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Share, Briefcase, UserPlus, GraduationCap, HandCoins, Users } from "lucide-react";
import type { PersonDirectoryRow } from "@/lib/types/person-directory";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type DirectoryPerson = PersonDirectoryRow & {
  current_title?: string | null;
  company?: string | null;
};

type PersonCardProps = {
  person: DirectoryPerson;
};

function getInitials(person: DirectoryPerson) {
  const source = person.full_name || person.username || "WAC";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function abbreviateCountry(country: string | null) {
  if (!country) return "";

  const normalized = country.trim().toLowerCase();

  if (
    normalized === "united states" ||
    normalized === "united states of america" ||
    normalized === "usa"
  ) {
    return "USA";
  }

  if (normalized === "united kingdom" || normalized === "uk") {
    return "UK";
  }

  return country;
}

function buildLocation(person: DirectoryPerson) {
  const state = person.state?.trim();
  const country = abbreviateCountry(person.country);
  return [state, country].filter(Boolean).join(", ");
}

function buildPrimaryLine(person: DirectoryPerson) {
  if (person.headline?.trim()) {
    return person.headline.trim();
  }

  if (person.current_title?.trim()) {
    return person.current_title.trim();
  }

  return (
    person.profession_name?.trim() ||
    person.profession?.trim() ||
    person.specialty_name?.trim() ||
    ""
  );
}

function buildSecondaryLine(person: DirectoryPerson) {
  const title = person.current_title?.trim();
  const company = person.company?.trim();

  if (title && company) {
    return `${title} at ${company}`;
  }

  return title || company || "";
}

function buildRoots(person: DirectoryPerson) {
  const parts = [
    person.ancestry_village,
    person.ancestry_city,
    abbreviateCountry(person.ancestry_country),
  ]
    .map((p) => p?.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  // Deduplicate just in case city/village are same
  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.join(", ");
}

export default function PersonCard({ person }: PersonCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const displayName = person.full_name || person.username || "Unnamed Member";
  const profileHref = person.username ? `/people/${person.username}` : "#";
  const initials = getInitials(person);
  const primaryLine = buildPrimaryLine(person);
  const secondaryLine = buildSecondaryLine(person);
  const location = buildLocation(person);
  const roots = buildRoots(person);

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${profileHref}`;
    navigator.clipboard.writeText(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  const badges = [];
  if (person.open_to_work) {
    badges.push({ id: "work", urlParam: "work=true", label: "Open to Work", icon: Briefcase, colorClass: "bg-green-500/10 text-green-400 border-green-500/20" });
  }
  if (person.open_to_hire) {
    badges.push({ id: "hire", urlParam: "hire=true", label: "Hiring", icon: UserPlus, colorClass: "bg-purple-500/10 text-purple-400 border-purple-500/20" });
  }
  if (person.open_to_mentor) {
    badges.push({ id: "mentor", urlParam: "mentor=true", label: "Mentoring", icon: GraduationCap, colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" });
  }
  if (person.open_to_invest) {
    badges.push({ id: "invest", urlParam: "invest=true", label: "Investing", icon: HandCoins, colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" });
  }
  if (person.open_to_collaborate) {
    badges.push({ id: "collab", urlParam: "collab=true", label: "Collaborating", icon: Users, colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20" });
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  }

  return (
    <article className="wac-card group h-full overflow-hidden p-0 transition hover:-translate-y-0.5 relative flex flex-col">
      <div className="relative h-28 shrink-0 overflow-hidden">
        {/* Action Bar (Share/Save) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 transition-opacity opacity-0 group-hover:opacity-100 sm:opacity-100">
          <button
            onClick={handleSave}
            title={isSaved ? "Remove bookmark" : "Save for later"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white transition hover:bg-black/60"
          >
            <Bookmark
              size={15}
              className={
                isSaved ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"
              }
            />
          </button>
          <button
            onClick={handleShare}
            title="Share profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white transition hover:bg-black/60"
          >
            <Share size={15} />
          </button>
        </div>
        {/* @ts-expect-error banner_url isn't in schema but seems to exist in real data sometimes based on previous code */}
        {person.banner_url ? (
          <>
            <img
              /* @ts-expect-error banner_url */
              src={person.banner_url}
              alt={`${displayName} banner`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(190,205,212,0.95)_0%,rgba(190,205,212,0.88)_100%)]" />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={displayName}
              className="h-20 w-20 rounded-full border-4 border-[var(--card)] object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[var(--card)] bg-[rgba(255,255,255,0.10)] text-lg font-semibold uppercase tracking-wide shadow-lg">
              {initials}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-5 text-center">
        <div className="flex items-start justify-center gap-1.5">
          <h2 className="line-clamp-2 break-words text-xl font-semibold leading-tight">
            {displayName}
          </h2>

          {person.is_verified && <VerifiedBadge className="mt-0.5" />}
        </div>

        {primaryLine && (
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug opacity-95">
            {primaryLine}
          </p>
        )}

        {secondaryLine && (
          <p className="mt-1 line-clamp-1 min-h-[1.25rem] text-sm leading-snug opacity-82">
            {secondaryLine}
          </p>
        )}

        {location && (
          <p className="mt-1 line-clamp-1 min-h-[1.25rem] text-sm opacity-65">
            {location}
          </p>
        )}

        {roots && (
          <p className="mt-1 line-clamp-1 min-h-[1.25rem] text-sm opacity-70">
            Roots: {roots}
          </p>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-3 w-full">
          {/* Always render the container with a min-height so the button layout doesn't shift */}
          <div className="min-h-[26px] flex flex-wrap justify-center gap-1.5 z-30">
            {badges.length > 0 && (
              <>
                {(() => {
                  const first = badges[0];
                  const Icon = first.icon;
                  return (
                    <Link href={`/directory?${first.urlParam}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${first.colorClass} hover:brightness-110 transition`}>
                      <Icon size={12} /> {first.label}
                    </Link>
                  );
                })()}

                {badges.length > 1 && (
                  <div className="group/badge relative flex items-center">
                    <button className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] px-2 py-1 text-[10px] font-bold text-white/80 border border-white/10 transition group-hover/badge:bg-[rgba(255,255,255,0.1)] focus:outline-none focus:bg-[rgba(255,255,255,0.15)] focus:border-white/30">
                      +{badges.length - 1}
                    </button>

                    <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 hidden flex-col gap-1 rounded-xl bg-[#111] border border-white/10 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] group-hover/badge:flex group-focus-within/badge:flex z-[100] min-w-max pointer-events-auto">
                      <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 px-2 pb-1.5 mb-0.5 mt-1.5 border-b border-white/10 text-left cursor-default">Also Open To:</div>
                      {badges.slice(1).map((b) => {
                        const BIcon = b.icon;
                        return (
                          <Link href={`/directory?${b.urlParam}`} key={b.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest ${b.colorClass} border border-transparent bg-transparent transition-all hover:bg-white/5 hover:border-white/10 cursor-pointer pointer-events-auto`}>
                            <BIcon size={12} /> {b.label}
                          </Link>
                        );
                      })}
                      {/* Triangle Pointer */}
                      <div className="absolute top-full left-1/2 -ms-1.5 -mt-[1px] border-4 border-transparent border-t-white/10 pointer-events-none"></div>
                      <div className="absolute top-full left-1/2 -ms-1.5 -mt-[2px] border-4 border-transparent border-t-[#111] pointer-events-none"></div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {person.username ? (
            <Link
              href={profileHref}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(255,255,255,0.03)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              View Profile
            </Link>
          ) : (
            <span className="flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold opacity-50 bg-[rgba(255,255,255,0.02)]">
              No username yet
            </span>
          )}
        </div>
      </div>

      {/* Toast Notification for Share */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-black px-4 py-2 rounded-full font-bold text-xs shadow-lg transition-all duration-300 ${showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        Link copied!
      </div>
    </article>
  );
}
