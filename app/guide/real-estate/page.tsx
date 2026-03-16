import RealEstateHub from "@/components/guide/RealEstateHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diaspora Real Estate | World Albanian Congress",
  description:
    "Connect directly with trusted local agents, overseas buyers, sellers, and specialized home care services in the homeland.",
};

export default function RealEstatePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
      <RealEstateHub />
    </main>
  );
}
