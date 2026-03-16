export default function GlobalMap() {
  const cities = [
    "New York",
    "London",
    "Tirana",
    "Prishtina",
    "Zurich",
    "Berlin",
    "Toronto",
    "Melbourne",
  ];

  return (
    <section
      id="map"
      className="py-24 px-4 bg-[rgba(255,255,255,0.01)] border-y border-[var(--border)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-[90rem] relative z-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-12">
          Map
        </h2>

        {/* Abstract "Map" Array of Cities */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 max-w-4xl mx-auto opacity-80">
          {cities.map((city, i) => (
            <div key={city} className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <span className="text-xl font-medium tracking-wide">{city}</span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium tracking-wide opacity-50 italic">
              and hundreds more...
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
