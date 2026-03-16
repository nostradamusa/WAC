import TravelGuideWrapper from "@/components/guide/TravelGuideWrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Homeland Travel Guide | World Albanian Congress",
  description:
    "A strategic travel guide for Albanian diaspora visiting the Balkans. Use Struga as your hub.",
};

export default function TravelGuidePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <TravelGuideWrapper />
    </main>
  );
}
