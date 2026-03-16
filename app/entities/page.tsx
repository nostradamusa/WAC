import { Suspense } from "react";
import DirectoryTabs from "@/components/directory/DirectoryTabs";
import EntitiesTab from "@/components/directory/EntitiesTab";

export const metadata = {
  title: "Entities Directory | World Albanian Congress",
  description:
    "Browse Albanian-owned businesses and organizations around the world.",
};

export default function EntitiesDirectoryPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <DirectoryTabs />
      <main className="w-full max-w-[90rem] mx-auto px-4 pb-20">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-3xl bg-[rgba(255,255,255,0.02)]" />
          }
        >
          <EntitiesTab />
        </Suspense>
      </main>
    </div>
  );
}
