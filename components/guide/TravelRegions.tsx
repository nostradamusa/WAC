"use client";

import {
  Plane,
  Link,
  ShieldAlert,
  CreditCard,
  ChevronRight,
} from "lucide-react";

export default function TravelRegions() {
  const regions = [
    {
      flags: ["mk", "al"],
      name: "Lake Ohrid",
      tagline: "Your backyard — and a UNESCO World Heritage Site",
      time: "5–30 min from Struga",
      highlights: [
        "Ohrid Old Town — cobblestone streets, 365 churches, ancient fortress",
        "St. Naum Monastery — springs, peacocks, stunning lakeside",
        "Swimming at Lin Peninsula (Albanian side)",
        "Struga Poetry Evenings (August)",
      ],
      tip: "Eat fresh Ohrid trout (pastrmka) at any lakeside restaurant. The fish is endemic to this lake only.",
      bgColors: "from-sky-900 to-slate-900",
    },
    {
      flags: ["al"],
      name: "Albania",
      tagline: "The homeland — highlands to riviera",
      time: "1–5 hrs depending on destination",
      highlights: [
        "Tirana — Blloku district, Skanderbeg Square, cafe culture",
        "Berat & Gjirokastër — UNESCO stone cities",
        "Albanian Riviera — Dhermi, Himara, Saranda beaches",
        "Valbona Valley & Theth — Albanian Alps trekking",
      ],
      tip: "The SH72 road from Elbasan to Pogradec runs along the Albanian side of Lake Ohrid — one of the most scenic drives in the Balkans.",
      bgColors: "from-red-950 to-[var(--accent)]/80",
    },
    {
      flags: ["xk"],
      name: "Kosovo",
      tagline: "Energy, history, and the warmest welcome in the Balkans",
      time: "2.5–3 hrs from Struga",
      highlights: [
        "Prishtina — Newborn monument, vibrant cafe scene",
        "Prizren — the cultural capital, Ottoman bazaar",
        "Rugova Canyon — dramatic gorge, perfect for a day hike",
        "Gjakova — old bazaar, traditional crafts",
      ],
      tip: "Prizren in one day, Prishtina the next. The drive passing through the Dukagjini plain feels quintessentially Kosovar.",
      bgColors: "from-blue-950 to-indigo-900",
    },
    {
      flags: ["me"],
      name: "Montenegro",
      tagline: "Wild mountains and the Adriatic in one country",
      time: "4.5–5.5 hrs — best as 2-night trip",
      highlights: [
        "Ulcinj — largely Albanian-speaking, long sandy beach",
        "Kotor — walled medieval city, Bay of Kotor",
        "Durmitor National Park — Black Lake, glacial canyon",
        "Budva Riviera — beach clubs, packed in August",
      ],
      tip: "Ulcinj is the right first stop from Albania — the city speaks Albanian, the food is familiar, and the beach is 13 km long.",
      bgColors: "from-emerald-950 to-stone-900",
    },
  ];

  return (
    <>
      <section id="regions">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span>{" "}
            Destinations
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Where to Go & What to Expect
          </h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            Four core regions reachable from Struga — each with a different
            character, pace, and payoff.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {regions.map((r, i) => (
            <div
              key={i}
              className="group rounded-xl border border-[var(--foreground)]/10 overflow-hidden bg-[var(--foreground)]/5 hover:border-[var(--accent)] transition-colors flex flex-col h-full"
            >
              <div
                className={`h-48 relative flex items-end p-6 bg-gradient-to-br ${r.bgColors} overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
                <div className="relative z-10 w-full">
                  <div className="flex items-center gap-2 mb-4">
                    {r.flags.map((fcode, fi) => (
                      <img
                        key={fi}
                        src={`https://flagcdn.com/w40/${fcode}.png`}
                        width="32"
                        alt={`${fcode} flag`}
                        className="rounded-sm shadow-sm"
                      />
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-1">
                    {r.name}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                    {r.tagline}
                  </p>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-4 flex items-center gap-2">
                  <CarIcon /> {r.time}
                </div>
                <div className="space-y-3 mb-6 flex-1">
                  {r.highlights.map((hlt, j) => (
                    <div
                      key={j}
                      className="text-sm opacity-80 flex gap-2 items-start leading-relaxed"
                    >
                      <span className="text-[var(--accent)] font-bold shrink-0">
                        →
                      </span>
                      {hlt}
                    </div>
                  ))}
                </div>
                <div className="bg-[var(--background)] p-4 rounded text-sm opacity-80 border-l-2 border-[var(--accent)]">
                  <strong className="opacity-100">Local tip:</strong> {r.tip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="practical">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> Before You
            Go
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Getting There & Visas
          </h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            The logistics that determine whether the trip runs smoothly or not.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex flex-col">
            <ShieldAlert className="w-8 h-8 text-[var(--accent)] mb-4" />
            <h3 className="font-bold mb-3 font-serif">Visas & Entry</h3>
            <ul className="space-y-2 text-sm opacity-70 mb-4 flex-1">
              <li>• US Passport enters visa-free</li>
              <li>• 🇲🇰 N. Macedonia: 90 days</li>
              <li>• 🇦🇱 Albania: 1 year</li>
              <li>• 🇽🇰 Kosovo: 90 days</li>
              <li>• Always carry physical passport</li>
            </ul>
            <button className="text-[var(--accent)] text-xs font-bold uppercase tracking-widest mt-auto hover:underline flex items-center gap-1">
              Full Guide <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex flex-col">
            <Plane className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-bold mb-3 font-serif">Getting There</h3>
            <ul className="space-y-2 text-sm opacity-70 mb-4 flex-1">
              <li>• JFK/EWR → Tirana (TIA)</li>
              <li>• JFK/EWR → Skopje (SKP)</li>
              <li>• JFK/EWR → Pristina (PRN)</li>
              <li>• Rent car at airport on arrival</li>
            </ul>
          </div>

          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex flex-col">
            <CreditCard className="w-8 h-8 text-emerald-500 mb-4" />
            <h3 className="font-bold mb-3 font-serif">Currency</h3>
            <ul className="space-y-2 text-sm opacity-70 mb-4 flex-1">
              <li>• Kosovo & Montenegro: Euro (€)</li>
              <li>• Albania: Lek (ALL)</li>
              <li>• Macedonia: Denar (MKD)</li>
              <li>• ATM's dispense local cash</li>
            </ul>
          </div>

          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex flex-col">
            <span className="text-3xl mb-4 leading-none">☀️</span>
            <h3 className="font-bold mb-3 font-serif">Weather</h3>
            <ul className="space-y-2 text-sm opacity-70 mb-4 flex-1">
              <li>• June: 77–86°F (Perfect)</li>
              <li>• July/Aug: 86–100°F (Peak Heat)</li>
              <li>• Sept: Sea is warm, less busy</li>
              <li>• Lake Ohrid is cooler than coast</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function CarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}
