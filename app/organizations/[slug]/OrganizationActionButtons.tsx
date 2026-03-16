"use client";

import { useState } from "react";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";

export function OrganizationActionButtons({
  organization,
}: {
  organization: OrganizationDirectoryEntry;
}) {
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    setIsJoined(!isJoined);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 300));
    setLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
      <button
        onClick={handleJoin}
        disabled={loading}
        className={`wac-button-chip-primary ${
          isJoined
            ? "bg-emerald-800 border-emerald-700 text-white"
            : "bg-emerald-500 text-white border-transparent hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        }`}
      >
        {isJoined ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
        )}
        {isJoined ? "Joined Community" : "Join Community"}
      </button>
    </div>
  );
}
