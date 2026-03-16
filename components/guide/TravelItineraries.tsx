"use client";

import { useState } from "react";
import { Map, Footprints, CalendarDays, Compass } from "lucide-react";

function Flag({ c }: { c: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${c}.png`}
      width="16"
      alt={`${c} flag`}
      className="inline-block shrink-0 shadow-sm mr-1.5 -mt-0.5 rounded-sm"
    />
  );
}

export default function TravelItineraries() {
  const [activeTour, setActiveTour] = useState("struga");
  const [activeItin, setActiveItin] = useState("three");

  return (
    <>
      {/* TOUR GUIDES */}
      <section id="tour-guides">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> Choose Your
            Base
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Three Ways to Tour Albanian Territory
          </h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            Not everyone starts from Struga. Here are three fully realized tour
            paths — each built around a different base city, a different rhythm,
            and a different kind of summer.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTour("struga")}
            className={`px-6 py-3 font-bold rounded flex items-center gap-2 transition-colors ${activeTour === "struga" ? "bg-[var(--accent)] text-white" : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]"}`}
          >
            🏔️ Struga Hub
          </button>
          <button
            onClick={() => setActiveTour("pristina")}
            className={`px-6 py-3 font-bold rounded flex items-center gap-2 transition-colors ${activeTour === "pristina" ? "bg-[var(--accent)] text-white" : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]"}`}
          >
            <Flag c="xk" /> Prishtina Hub
          </button>
          <button
            onClick={() => setActiveTour("albania")}
            className={`px-6 py-3 font-bold rounded flex items-center gap-2 transition-colors ${activeTour === "albania" ? "bg-[var(--accent)] text-white" : "bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)]"}`}
          >
            <Flag c="al" /> Albania Circuit
          </button>
        </div>

        <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-6 md:p-8">
          {activeTour === "struga" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Who This Is For
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  Families with roots in North Macedonia and Western Albania.
                  People who want a calm base with day trips radiating outward —
                  not a moving trip.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  The Rhythm
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  Slow mornings at the Korzo. Full days at the lake. Day trips
                  into Albania — Pogradec, Korçë, Berat — when the mood strikes.
                  You return to the same apartment every night.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Signature Moves
                </h3>
                <ul className="space-y-2 opacity-80 text-sm">
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Cross at
                    Qafë Thanë, lake road to Pogradec
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Struga
                    Poetry Evenings in August
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Weekend
                    run to Kosovo (Prizren Friday, Prishtina Sat)
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> 2-night
                    Riviera run (Ksamil, back through Berat)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Best for a Month Stay
                </h3>
                <div className="border border-[var(--foreground)]/10 rounded divide-y divide-[var(--foreground)]/10 mb-6">
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Week 1</div>
                    <div className="text-xs opacity-70 mt-1">
                      Settle in. Drin i Zi, Korzo, St. Naum, Ohrid. No rushing.
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">Week 2</div>
                    <div className="text-xs opacity-70 mt-1">
                      Albania: Pogradec → Korçë → Berat → Tirana
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Week 3</div>
                    <div className="text-xs opacity-70 mt-1">
                      Kosovo + Montenegro loop: Prizren, Prishtina, Kotor
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">Week 4</div>
                    <div className="text-xs opacity-70 mt-1">
                      Return to the lake. Family time. Final dinners.
                    </div>
                  </div>
                </div>
                <div className="bg-sky-500/10 border-l-4 border-sky-500 p-4">
                  <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                    💡 The honest advantage
                  </h4>
                  <p className="text-xs opacity-80">
                    Struga gives you the lowest cost of living. Lakefront
                    apartments are affordable, and you're 35 min from the
                    Albanian border — cheap day trips, zero commitment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTour === "pristina" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Who This Is For
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  Kosovo Albanians or younger diaspora who want a city-centered
                  summer with serious culinary and cultural depth. Prishtina's
                  café culture and nightlife is the best in the region.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  The Rhythm
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  Morning espresso on Mother Teresa Square. Prizren is 1.5 hrs
                  south, Peja 1.5 hrs west. You move more than from Struga, but
                  the roads are good and scenery dramatic.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Signature Moves
                </h3>
                <ul className="space-y-2 opacity-80 text-sm">
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Prizren
                    old town weekend — Ottoman bazaar
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Rugova
                    Canyon day hike from Peja
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Drive
                    into North Albania via Bajram Curri
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Loop
                    through North Macedonia (Skopje & Ohrid)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Best for a Month Stay
                </h3>
                <div className="border border-[var(--foreground)]/10 rounded divide-y divide-[var(--foreground)]/10 mb-6">
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Week 1</div>
                    <div className="text-xs opacity-70 mt-1">
                      Prishtina, Prizren, Peja. Kosovo in full.
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">Week 2</div>
                    <div className="text-xs opacity-70 mt-1">
                      North Albania: Shkodër → Theth or Valbona
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Week 3</div>
                    <div className="text-xs opacity-70 mt-1">
                      Riviera: Tirana → Dhermi → Ksamil
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">Week 4</div>
                    <div className="text-xs opacity-70 mt-1">
                      North Macedonia loop: Struga, Ohrid. Fly out of PRN.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTour === "albania" && (
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Who This Is For
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  People who want to see the whole country, not just Tirana and
                  the beach. A moving circuit built for travelers prioritizing
                  food, culture, and landscape.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  The Rhythm
                </h3>
                <p className="opacity-80 text-sm leading-relaxed mb-6">
                  Albania is geographically diverse. You can drive from the Alps
                  to the Riviera in under 5 hours. This circuit takes you
                  through every major region.
                </p>

                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  Signature Moves
                </h3>
                <ul className="space-y-2 opacity-80 text-sm">
                  <li>
                    <strong className="text-[var(--accent)]">→</strong>{" "}
                    Farm-to-table dining in Berat (Antigone)
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong>{" "}
                    Gjirokastër: the stone city fortress at dusk
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> SH8
                    drive Vlora to Saranda — unforgettable cliffs
                  </li>
                  <li>
                    <strong className="text-[var(--accent)]">→</strong> Valbona
                    & Theth guesthouse dinners
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--accent)] mb-3">
                  The Full Circuit — Month Stay
                </h3>
                <div className="border border-[var(--foreground)]/10 rounded divide-y divide-[var(--foreground)]/10 mb-6">
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Days 1–4 · Tirana</div>
                    <div className="text-xs opacity-70 mt-1">
                      Blloku, Skanderbeg, best restaurants.
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">
                      Days 5–7 · Berat + Gjirokastër
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      UNESCO back-to-back. Farm-to-table dinners.
                    </div>
                  </div>
                  <div className="p-4 bg-[var(--foreground)]/5">
                    <div className="font-bold text-sm">Days 8–13 · Riviera</div>
                    <div className="text-xs opacity-70 mt-1">
                      Himara 2 nights, Ksamil 3 nights.
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-bold text-sm">
                      Days 18–22 · Albanian Alps
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      Theth 2 nights, Valbona 2 nights. Hike between valleys.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ITINERARIES */}
      <section id="itineraries">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> How People
            Actually Travel
          </div>
          <h2 className="text-3xl font-extrabold mb-4">Pick Your Style</h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            Realistic trip templates built around how the Albanian diaspora
            actually travels — not how blogs say you should.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveItin("three")}
            className={`px-6 py-3 font-bold rounded flex items-center gap-2 transition-colors ${activeItin === "three" ? "bg-[var(--accent)] text-white" : "bg-transparent border border-[var(--foreground)]/20 text-[var(--foreground)] hover:bg-[var(--foreground)]/5"}`}
          >
            🧳 3–4 Week Stay
          </button>
          <button
            onClick={() => setActiveItin("seasonal")}
            className={`px-6 py-3 font-bold rounded flex items-center gap-2 transition-colors ${activeItin === "seasonal" ? "bg-[var(--accent)] text-white" : "bg-transparent border border-[var(--foreground)]/20 text-[var(--foreground)] hover:bg-[var(--foreground)]/5"}`}
          >
            🌿 Seasonal Resident (3–6 Months)
          </button>
        </div>

        {activeItin === "three" && (
          <div className="space-y-6">
            <div className="flex gap-4 md:gap-8 items-start relative">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1 relative z-10">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Days
                  <br />
                  1–3
                </div>
                <div className="w-px h-full bg-[var(--foreground)]/10 absolute top-12 left-1/2 -ml-px -z-10"></div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="mk" /> Struga — Arrive
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  No Rushing. You're Home.
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Let the jet lag go. Sit by the lake, eat well, reconnect. Day
                  2: Ohrid Old Town — the first swim. Day 3: the Drin i Zi and
                  the Korzo.
                </p>
                <div className="text-xs font-bold text-[var(--accent)]">
                  🌊 The Drin i Zi is where locals live their summer.
                </div>
              </div>
            </div>

            <div className="flex gap-4 md:gap-8 items-start relative">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1 relative z-10">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Days
                  <br />
                  6–9
                </div>
                <div className="w-px h-full bg-[var(--foreground)]/10 absolute top-12 left-1/2 -ml-px -z-10"></div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="al" /> Pogradec → Korçë → Berat → Tirana
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Into Albania
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Cross at Qafë Thanë early. Korçë is European cafe culture.
                  Berat is the showstopper. Arrive Tirana evening of day 9, walk
                  Blloku.
                </p>
                <div className="text-xs font-bold text-[var(--accent)]">
                  🚕 Use Bolt inside Tirana — parking is a nightmare.
                </div>
              </div>
            </div>

            <div className="flex gap-4 md:gap-8 items-start relative">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1 relative z-10">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Days
                  <br />
                  10–14
                </div>
                <div className="w-px h-full bg-[var(--foreground)]/10 absolute top-12 left-1/2 -ml-px -z-10"></div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="al" /> Albanian Riviera
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Five Days on the Water
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Drive south from Vlora down the SH8 coastal road. Five days of
                  crystal water, seafood, and nothing to do. Ferry to Corfu for
                  a day.
                </p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-8 items-start relative">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1 relative z-10">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Days
                  <br />
                  15–17
                </div>
                <div className="w-px h-full bg-[var(--foreground)]/10 absolute top-12 left-1/2 -ml-px -z-10"></div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="xk" /> Prizren + Prishtina
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Route Back Through Kosovo
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Prizren first (2 nights), then Prishtina — Newborn monument
                  and the best espresso in the region.
                </p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-8 items-start">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Days
                  <br />
                  18–21
                </div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="mk" /> Struga
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Back to the Lake
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  The final days. No agenda. Buy ajvar, rakija, and burek the
                  day before you fly out.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeItin === "seasonal" && (
          <div className="space-y-6">
            <div className="flex gap-4 md:gap-8 items-start">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Month
                  <br />1
                </div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2">
                  🇲🇰 Struga
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Get Settled
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  Month one is for setup. Secure apartment, get SIM, establish
                  daily rhythm. No rushing.
                </p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 items-start">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Month
                  <br />2
                </div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="xk" /> Prishtina + Riviera
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  The Classic Circuit
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  A week in Prishtina visiting friends, then down to the Riviera
                  for 10-14 days. This is the circuit every seasonal Albanian
                  does.
                </p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 items-start">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Summer
                  <br />
                  💍
                </div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="al" />
                  <Flag c="xk" />
                  <Flag c="mk" /> Wedding Season
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  The Real Reason
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  July and August. You will be invited. Budget the time, pack
                  the outfits. They are multi-day events.
                </p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 items-start">
              <div className="hidden md:flex flex-col items-center w-24 shrink-0 mt-1">
                <div className="text-[var(--accent)] font-bold text-sm uppercase tracking-widest text-center">
                  Month
                  <br />
                  3–4
                </div>
              </div>
              <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-6 rounded-xl flex-1">
                <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-70 mb-2 flex items-center">
                  <Flag c="mk" /> Struga
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">
                  Shoulder Season
                </h3>
                <p className="text-sm opacity-80 leading-relaxed mb-4">
                  September onward is the best kept secret. Warm water, empty
                  restaurants, cooler air.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
