"use client";

import {
  MapPin,
  Coffee,
  Home,
  Utensils,
  CreditCard,
  Smartphone,
  Car,
  CalendarRange,
} from "lucide-react";

export default function TravelHero() {
  return (
    <>
      {/* HERO */}
      <div className="relative overflow-hidden min-h-[500px] flex items-end pb-12 bg-[var(--background)] border-b border-[var(--foreground)]/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 via-transparent to-[var(--foreground)]/5 mix-blend-overlay"></div>

        <div className="max-w-[75rem] mx-auto px-4 relative z-10 w-full">
          <div className="flex items-center gap-3 mb-5 mt-32">
            <div className="w-8 h-[1px] bg-[var(--accent)]"></div>
            <span className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase">
              WAC Homeland Travel Guide
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif tracking-tight mb-4 leading-tight text-white">
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Return
            </span>{" "}
            to the Land.
            <br />
            <span className="text-[var(--accent)] font-extrabold tracking-tight text-3xl md:text-4xl mt-2 block">
              Travel it like you belong.
            </span>
          </h1>

          <p className="text-lg opacity-70 max-w-2xl mb-8 leading-relaxed">
            A strategic guide for Albanian diaspora visiting the homeland —
            using Struga as your base to explore Albania, Kosovo, Montenegro,
            and Corfu in 2–3 weeks.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm font-bold opacity-80 bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 py-2 rounded">
              <span className="text-[var(--accent)]">Base:</span> Struga, North
              Macedonia{" "}
              <img
                src="https://flagcdn.com/w20/mk.png"
                width="16"
                alt="MK flag"
                className="inline-block shrink-0 shadow-sm rounded-sm"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold opacity-80 bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 py-2 rounded">
              <span className="text-[var(--accent)]">Trip:</span> 3 weeks
            </div>
            <div className="flex items-center gap-2 text-sm font-bold opacity-80 bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 px-4 py-2 rounded">
              <span className="text-[var(--accent)]">Season:</span> June – Sept
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
