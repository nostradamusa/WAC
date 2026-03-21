export default function LivingNetwork() {
  const cities = [
    "New York",
    "Detroit",
    "London",
    "Zurich",
    "Berlin",
    "Toronto",
    "Melbourne",
    "Tirana",
    "Prishtina",
  ];

  return (
    <section
      id="living-network"
      className="py-32 px-4 relative overflow-hidden bg-[rgba(255,255,255,0.01)] border-y border-[var(--border)]"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif tracking-tight sm:text-6xl text-white">
            <span className="text-[#b08d57] italic font-light opacity-90">
              Global
            </span>{" "}
            Reach
          </h2>
          <p className="mt-6 text-xl opacity-70 max-w-2xl mx-auto">
            Albanians are building businesses and careers in hundreds of cities
            around the world.
          </p>
        </div>

        <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center">
          <div className="absolute inset-0 top-1/2 -translate-y-1/2 h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

          <div className="relative flex flex-wrap justify-center gap-4 z-10 w-full px-4">
            {cities.map((city, i) => (
              <div
                key={city}
                className={`wac-card px-8 py-4 flex items-center justify-center shadow-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors ${i % 2 === 0 ? "-translate-y-4" : "translate-y-4"}`}
              >
                <span className="text-lg font-bold opacity-90">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
