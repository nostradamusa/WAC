import Link from "next/link";
import { Compass, Activity, CalendarDays, Network, Map, ArrowRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

const SECTIONS = [
  {
    icon: Compass,
    name: "Directory",
    strapline: "The network of record",
    description: "The network of record for Albanian professionals, businesses, and organizations across borders, industries, and cities.",
    href: "/directory",
    iconBg: "bg-[#b08d57]/10",
    iconColor: "text-[#b08d57]/80",
    nameColor: "text-[#b08d57]",
    linkColor: "text-[#b08d57]/55 group-hover:text-[#b08d57]",
  },
  {
    icon: Activity,
    name: "Pulse",
    strapline: "The civic and social signal",
    description: "The heartbeat of the network \u2014 updates, milestones, opportunities, and momentum.",
    href: "/pulse",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400/80",
    nameColor: "text-rose-400",
    linkColor: "text-rose-400/55 group-hover:text-rose-400",
  },
  {
    icon: CalendarDays,
    name: "Events",
    strapline: "The in-person layer",
    description: "The in-person layer that turns digital visibility into real-world trust, connection, and presence.",
    href: "/events",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400/80",
    nameColor: "text-teal-400",
    linkColor: "text-teal-400/55 group-hover:text-teal-400",
  },
  {
    icon: Network,
    name: "Groups",
    strapline: "The durable circles of trust",
    description: "Durable circles of trust organized around profession, geography, identity, and mission.",
    href: "/groups",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400/80",
    nameColor: "text-amber-400",
    linkColor: "text-amber-400/55 group-hover:text-amber-400",
  },
];

// Diaspora Map — elevated, separate from the 4-card grid
const DIASPORA_MAP = {
  icon: Map,
  name: "Diaspora Map",
  strapline: "The strategic layer",
  description: "The geographic intelligence layer \u2014 see where Albanians are concentrated, building influence, investing, relocating, and organizing.",
  href: "/directory?view=map",
  iconBg: "bg-[#b08d57]/10",
  iconColor: "text-[#b08d57]/80",
  nameColor: "text-[#b08d57]",
  linkColor: "text-[#b08d57]/55 group-hover:text-[#b08d57]",
  hoverBg: "bg-gradient-to-r from-[#b08d57]/[0.06] via-[#b08d57]/[0.02] to-transparent",
};

export default function EcosystemHub() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl">

        <div className="max-w-3xl mb-10 md:mb-14">
          <SectionLabel label="Live Now" variant="featured" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.2] tracking-tight text-[var(--warm-ivory)]">
            The first layers are already in motion.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.8] text-white/45 max-w-2xl">
            What exists today is not the full horizon. It is the first proof that the network can be structured, searchable, and activated as one system.
          </p>
        </div>

        {/* 4-card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ icon: Icon, name, strapline, description, href, iconBg, iconColor, nameColor, linkColor }) => (
            <Link
              key={href}
              href={href}
              className="wac-card group flex flex-col p-5 md:p-6 hover:border-white/15 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 shrink-0`}>
                <Icon size={18} className={iconColor} />
              </div>
              <p className="text-[9px] uppercase tracking-[0.22em] text-white/22 mb-1.5">
                {strapline}
              </p>
              <h3 className={`font-serif text-[18px] italic mb-2 ${nameColor}`}>
                {name}
              </h3>
              <p className="text-[13px] text-white/42 leading-[1.7] flex-1">{description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400/60">
                  Live Now
                </span>
                <span className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${linkColor}`}>
                  Explore <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Diaspora Map — elevated horizontal card */}
        <Link
          href={DIASPORA_MAP.href}
          className={`mt-4 relative group wac-card overflow-hidden border border-white/[0.08] p-5 md:p-6 flex flex-col sm:flex-row sm:items-start gap-5 transition-all duration-300 hover:border-[#b08d57]/30`}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${DIASPORA_MAP.hoverBg}`} />

          <div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${DIASPORA_MAP.iconBg}`}>
            <DIASPORA_MAP.icon size={18} className={DIASPORA_MAP.iconColor} />
          </div>

          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/22 mb-1.5">
              {DIASPORA_MAP.strapline}
            </p>
            <h3 className={`font-serif italic text-[22px] leading-none tracking-tight mb-2 transition-colors ${DIASPORA_MAP.nameColor} group-hover:text-[#b08d57]`}>
              {DIASPORA_MAP.name}
            </h3>
            <p className="font-serif text-[14px] font-light leading-[1.75] text-white/50 max-w-2xl">
              {DIASPORA_MAP.description}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 shrink-0 sm:self-end">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400/60">
              Live Now
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors ${DIASPORA_MAP.linkColor}`}>
              Explore <ArrowRight size={12} />
            </span>
          </div>
        </Link>

      </div>
    </section>
  );
}
