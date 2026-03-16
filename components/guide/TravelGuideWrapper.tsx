"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import TravelHero from "./TravelHero";
import TravelRegions from "./TravelRegions";
import TravelItineraries from "./TravelItineraries";
import TravelChecklist from "./TravelChecklist";

import TravelIntro from "./TravelIntro";

export default function TravelGuideWrapper() {
  const [activeSection, setActiveSection] = useState("why-struga");

  // Basic scrollspy
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "why-struga",
        "struga-guide",
        "distances",
        "regions",
        "practical",
        "tour-guides",
        "itineraries",
        "checklist",
      ];
      let current = "why-struga";

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "why-struga", label: "Why Struga" },
    { id: "struga-guide", label: "Struga Guide" },
    { id: "distances", label: "Distances" },
    { id: "regions", label: "Regions" },
    { id: "practical", label: "Practicality" },
    { id: "tour-guides", label: "Tour Guides" },
    { id: "itineraries", label: "Itineraries" },
    { id: "checklist", label: "Packing List" },
  ];

  return (
    <div className="w-full relative">
      <TravelHero />

      {/* Sticky Sub-Nav */}
      <div className="sticky top-16 z-40 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--foreground)]/10">
        <div
          className="max-w-[75rem] mx-auto px-4 flex items-center overflow-x-auto py-2 gap-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-full transition-colors ${
                activeSection === item.id
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[75rem] mx-auto px-4 py-12 space-y-24">
        {/* We'll pass down the shared styling layout via these components */}
        <TravelIntro />
        <TravelRegions />
        <TravelItineraries />
        <TravelChecklist />
      </div>
    </div>
  );
}
