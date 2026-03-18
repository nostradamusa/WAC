import GroupsHub from "@/components/groups/GroupsHub";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Groups | World Albanian Congress",
  description: "Find your community. Join groups organized around career, family, industry, travel, and culture.",
};

export default function GroupsPage() {
  return (
    <main className="min-h-screen flex flex-col pt-14 md:pt-16 bg-[var(--background)]">
      <Suspense fallback={<div className="p-12 text-center opacity-40 text-sm">Loading...</div>}>
        <GroupsHub />
      </Suspense>
    </main>
  );
}
