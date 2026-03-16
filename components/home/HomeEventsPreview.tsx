import Link from "next/link";

export default function HomeEventsPreview() {
  return (
    <section id="events-preview" className="py-24 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-serif tracking-tight sm:text-6xl mb-4 text-white">
              <span className="text-[#D4AF37] italic font-light opacity-90">
                Upcoming
              </span>{" "}
              Events
            </h2>
            <p className="text-xl opacity-70 max-w-2xl leading-relaxed font-medium">
              Find cultural, professional, and social events happening in your
              region and around the world.
            </p>
          </div>
          <Link
            href="/events"
            className="wac-button-secondary rounded-full px-6 py-3 font-bold text-sm shrink-0 hover:bg-[rgba(255,255,255,0.05)] border border-[var(--border)] transition"
          >
            View All Events
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/events"
            className="wac-card group flex flex-col p-6 transition-transform hover:-translate-y-2 block h-full text-left border border-[var(--border)] hover:border-[var(--accent)]/50"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
              Albanian Professionals Mixer
            </h3>
            <div className="text-sm opacity-60 mb-1">New York, NY</div>
            <div className="text-sm font-bold text-amber-500 uppercase tracking-widest">
              Oct 15 – 6:00 PM
            </div>
          </Link>

          {/* Mock Event 2 */}
          <Link
            href="/events"
            className="wac-card group flex flex-col p-6 transition-transform hover:-translate-y-2 block h-full text-left border border-[var(--border)] hover:border-[var(--accent)]/50"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
              Tech Founders Summit
            </h3>
            <div className="text-sm opacity-60 mb-1">London, UK</div>
            <div className="text-sm font-bold text-amber-500 uppercase tracking-widest">
              Nov 1 – 10:00 AM
            </div>
          </Link>

          {/* Mock Event 3 */}
          <Link
            href="/events"
            className="wac-card group flex flex-col p-6 transition-transform hover:-translate-y-2 block h-full text-left border border-[var(--border)] hover:border-[var(--accent)]/50"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
              Real Estate & Investment Gala
            </h3>
            <div className="text-sm opacity-60 mb-1">Tirana, AL</div>
            <div className="text-sm font-bold text-amber-500 uppercase tracking-widest">
              Dec 10 – 7:30 PM
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
