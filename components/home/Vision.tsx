import Link from "next/link";
import { Map, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

const COMING = [
  { icon: Map,        name: "Diaspora Map",      when: "Q2 2026" },
  { icon: BookOpen,   name: "Resources & Guides", when: "Q3 2026" },
  { icon: ShieldCheck, name: "Verified Network",  when: "Q4 2026" },
];

/**
 * Homepage teaser only — not the standalone /vision page.
 * Links to /vision for the full roadmap.
 */
export default function Vision() {
  return (
    <section className="py-16 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl">
        <SectionLabel label="Coming Next" variant="standard" className="mb-5" />
        <div className="wac-card p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">

          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl md:text-2xl font-normal text-white mb-4 leading-snug">
              Three major capabilities in active development.
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {COMING.map(({ icon: Icon, name, when }) => (
                <div key={name} className="flex items-center gap-2">
                  {/* Silver/slate icon — Vision section-identity, signals "not yet live" */}
                  <Icon size={13} className="text-slate-300/45 shrink-0" />
                  <span className="text-sm text-white/55">{name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-full">
                    {when}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2: outlined gold — this is a secondary navigation action, not a conversion CTA */}
          <Link
            href="/vision"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#b08d57]/30 text-[#b08d57]/70 text-sm font-semibold hover:bg-[#b08d57]/10 transition-colors whitespace-nowrap"
          >
            See the full roadmap
            <ArrowRight size={13} />
          </Link>

        </div>
      </div>
    </section>
  );
}
