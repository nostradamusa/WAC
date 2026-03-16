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

export default function TravelIntro() {
  return (
    <>
      {/* WHY STRUGA */}
      <section id="why-struga" className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> The
            Strategy
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Why Struga Is the Perfect Hub
          </h2>
          <p className="text-lg opacity-70 mb-8 leading-relaxed">
            Most diaspora families either stay in one place the whole trip or
            spend half their vacation in a car going the wrong way. Struga
            solves both problems.
          </p>

          <div className="bg-[var(--foreground)]/5 border-l-4 border-[var(--accent)] p-8">
            <h3 className="font-serif text-xl font-bold mb-3">
              Struga sits at the crossroads of everything Albanian.
            </h3>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              Perched on Lake Ohrid in North Macedonia, Struga is a 30-minute
              drive from the Albanian border, 2.5 hours from Tirana, 3 hours
              from Prishtina, and a ferry ride from Corfu once you reach
              Saranda.
            </p>
            <p className="text-sm opacity-80 leading-relaxed">
              Using Struga as your anchor, you can do day trips to the Albanian
              highlands, overnight runs to the Riviera, weekend drives into
              Kosovo, and even a long-weekend jump to Montenegro or Corfu — all
              while returning to the same lake, the same apartment, the same
              familiar streets.
            </p>
          </div>
        </div>

        <div>
          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-8 rounded-xl">
            <div className="text-xs font-bold text-[var(--accent)] tracking-[0.2em] uppercase mb-6">
              🗺️ The Reach from Struga
            </div>

            <div className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="mk" /> Lake Ohrid (Old Town)
                </span>
                <span className="font-bold">30 min</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="al" /> Albanian Border (Qafë Thanë)
                </span>
                <span className="font-bold">35 min</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="al" /> Pogradec / Lake Ohrid AL
                </span>
                <span className="font-bold">1 hr</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="al" /> Tirana
                </span>
                <span className="font-bold">2.5 hrs</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="al" /> Berat (UNESCO)
                </span>
                <span className="font-bold">2.5 hrs</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="xk" /> Prishtina, Kosovo
                </span>
                <span className="font-bold">3 hrs</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[var(--foreground)]/10 text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="me" /> Montenegro (Ulcinj)
                </span>
                <span className="font-bold">4.5 hrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-80 flex items-center">
                  <Flag c="gr" /> Corfu (ferry from Saranda)
                </span>
                <span className="font-bold">5.5 hrs total</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRUGA GUIDE */}
      <section id="struga-guide">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> Local Guide
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Struga — What You Need to Know
          </h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            Written for Albanian diaspora visiting for the first or twentieth
            time. What the tourist guides don't tell you.
          </p>
        </div>

        <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl divide-y divide-[var(--foreground)]/10">
          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <MapPin className="w-8 h-8 text-[var(--accent)] shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--accent)] transition-colors">
                Drin i Zi — The Soul of Struga
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                The Black Drin river pours out of Lake Ohrid right through the
                heart of the city, fast and cold and crystal clear. The Drin i
                Zi is the most iconic gathering place in Struga — locals swim in
                the rushing current, families spread out along the banks, kids
                dare each other to jump from the rocks, and the terraces along
                the water stay packed from morning to midnight.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded">
                🏅 Must Visit
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <Coffee className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-amber-500 transition-colors">
                The Korzo — City Center & Evening Ritual
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                The Korzo is the pedestrian city center of Struga — the rruga e
                madhe where everything happens. Morning macchiatos at outdoor
                café tables. Pastries and byrek from the bakeries. Boutique
                shopping, family strolls, kids running between tables. But the
                Korzo truly comes alive in the evening — after dinner, every
                Albanian in Struga gravitates here.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded">
                🏅 Must Visit
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <Home className="w-8 h-8 text-blue-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-blue-500 transition-colors">
                Where to Stay
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                Rent an apartment on the lakefront or in the old town — not a
                hotel. Most Albanian families prefer it and the price is
                significantly lower. Facebook groups and word-of-mouth from WAC
                members is the best source. Avoid Booking.com pricing in peak
                summer — direct to owner is always cheaper.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded">
                Practical
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <Utensils className="w-8 h-8 text-orange-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-orange-500 transition-colors">
                Where to Eat
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                Fresh Ohrid trout (pastrmka) at any lakeside restaurant — it's
                endemic to this lake only. Burek from the old bakery near the
                rruga in the morning. Tavë kosi, qofte, and fërgesë at any
                traditional restaurant. Avoid anywhere with an English menu on
                the tourist strip — walk one block inland.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded">
                Food
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <CreditCard className="w-8 h-8 text-emerald-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-emerald-500 transition-colors">
                Money & Cost
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                North Macedonia uses the Macedonian Denar (MKD). Albania uses
                the Albanian Lek (ALL). Kosovo and Montenegro use the Euro (€).
                Keep cash in all three currencies if you're crossing borders.
                ATMs are widely available, but cards don't work everywhere in
                smaller markets.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded">
                Practical
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <Smartphone className="w-8 h-8 text-cyan-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-500 transition-colors">
                Phone & Data
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                Your US phone plan likely won't cover North Macedonia, Albania,
                Kosovo, or Montenegro well. Best options: buy a local SIM at the
                airport (Telekom or ONE in MK, Vodafone or ALBtelecom in
                Albania) or get a data eSIM before you leave the US (Airalo or
                Holafly work well).
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded">
                Tech
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <Car className="w-8 h-8 text-purple-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-purple-500 transition-colors">
                Driving Notes
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                Driving in North Macedonia and Albania is not the same as
                driving in New Jersey. Roads are improving but narrow mountain
                roads exist. Speed bumps appear without warning. Driving in
                Tirana is chaotic by Western standards — use ride apps (Bolt
                works) inside the city. Fill your tank in North Macedonia
                (cheaper fuel).
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded">
                Transport
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex gap-6 hover:bg-[var(--foreground)]/5 transition-colors group">
            <CalendarRange className="w-8 h-8 text-yellow-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-500 transition-colors">
                Best Time to Visit
              </h3>
              <p className="opacity-70 text-sm leading-relaxed mb-3">
                June and September are the sweet spots — warm, less crowded,
                better prices. July and August are peak season: crowded beaches,
                higher prices, border queues, and the Struga Poetry Evenings
                (August). If you're flexible, early September gives you 90% of
                the experience at 60% of the hassle.
              </p>
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded">
                Planning
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DISTANCES TABLE */}
      <section id="distances" className="relative">
        <div className="mb-12">
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> Logistics
          </div>
          <h2 className="text-3xl font-extrabold mb-4">
            Drive Times from Struga
          </h2>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            All times assume a rental car and daytime driving. Border crossings
            add 20–60 min depending on season and wait.
          </p>
        </div>

        <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-[var(--foreground)]/10 p-4 border-b border-[var(--foreground)]/10">
            <div className="col-span-8 md:col-span-6 text-xs font-bold uppercase tracking-widest opacity-70">
              Destination
            </div>
            <div className="hidden md:block col-span-3 text-xs font-bold uppercase tracking-widest opacity-70">
              Distance
            </div>
            <div className="col-span-4 md:col-span-3 text-xs font-bold uppercase tracking-widest opacity-70 text-right md:text-left">
              Drive Time
            </div>
          </div>

          {[
            {
              fcode: "mk",
              dest: "Ohrid Old Town",
              cc: "North Macedonia",
              km: "14 km",
              time: "25–35 min",
            },
            {
              fcode: "al",
              dest: "Pogradec",
              cc: "Albania · Lake Ohrid",
              km: "52 km",
              time: "~1 hr",
            },
            {
              fcode: "al",
              dest: "Korçë",
              cc: "Albania · Cultural city",
              km: "90 km",
              time: "~1.5 hrs",
            },
            {
              fcode: "al",
              dest: "Tirana",
              cc: "Albania · Capital",
              km: "170 km",
              time: "~2.5 hrs",
            },
            {
              fcode: "al",
              dest: "Berat",
              cc: "Albania · UNESCO city",
              km: "185 km",
              time: "~2.5 hrs",
            },
            {
              fcode: "xk",
              dest: "Prishtina",
              cc: "Kosovo · Capital",
              km: "220 km",
              time: "~3 hrs",
            },
            {
              fcode: "al",
              dest: "Albanian Riviera (Saranda)",
              cc: "Albania · Coast",
              km: "310 km",
              time: "~4.5 hrs",
            },
            {
              fcode: "al",
              dest: "Ksamil",
              cc: "Albania · Beaches",
              km: "325 km",
              time: "~5 hrs",
            },
            {
              fcode: "me",
              dest: "Ulcinj",
              cc: "Montenegro",
              km: "295 km",
              time: "~4.5 hrs",
            },
            {
              fcode: "me",
              dest: "Kotor",
              cc: "Montenegro",
              km: "380 km",
              time: "~5.5 hrs",
            },
            {
              fcode: "gr",
              dest: "Corfu",
              cc: "Greece · Ferry from Saranda",
              km: "310 km + ferry",
              time: "~5.5 hrs",
            },
          ].map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 p-4 items-center ${i % 2 !== 0 ? "bg-[var(--foreground)]/5" : ""}`}
            >
              <div className="col-span-8 md:col-span-6 flex items-start gap-3">
                <img
                  src={`https://flagcdn.com/w20/${row.fcode}.png`}
                  width="16"
                  alt={`${row.fcode} flag`}
                  className="rounded-sm shadow-sm shrink-0 mt-1"
                />
                <div>
                  <div className="font-bold text-sm">{row.dest}</div>
                  <div className="text-xs opacity-60">{row.cc}</div>
                </div>
              </div>
              <div className="hidden md:flex col-span-3 text-sm opacity-80 items-center">
                {row.km}
              </div>
              <div className="col-span-4 md:col-span-3 text-sm font-bold text-[var(--accent)] text-right md:text-left flex justify-end md:justify-start items-center">
                {row.time}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-[var(--accent)]/10 border-l-4 border-[var(--accent)] p-4 flex gap-4 items-start">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-bold text-sm mb-1">
              Border crossing reality check
            </h4>
            <p className="text-xs opacity-80 leading-relaxed">
              In peak summer (July–August), the Qafë Thanë border between North
              Macedonia and Albania can back up 1–2 hours. Cross early morning
              (before 8am) or late evening. The Morinë crossing into Kosovo is
              usually faster. <strong>Always carry your US passport.</strong>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
