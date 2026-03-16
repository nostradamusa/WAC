import CommunityHub from "@/components/community/CommunityHub";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Community Hub | World Albanian Congress",
  description: "For Every Generation. All Under One Roof.",
};

export default function CommunityPage() {
  return (
    <main className="min-h-screen flex flex-col pt-16 bg-[var(--background)]">

      {/* HUB CONTENT */}
      <Suspense
        fallback={
          <div className="p-12 text-center opacity-50">Loading Hub...</div>
        }
      >
        <CommunityHub />
      </Suspense>
    </main>
  );
}
