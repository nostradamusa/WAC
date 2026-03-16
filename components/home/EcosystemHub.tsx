import Link from "next/link";
import { Compass, Activity, CalendarDays, HeartHandshake, TrendingUp, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    title: (
      <span className="font-serif text-2xl">
        The <span className="text-[#D4AF37] italic font-light">Directory</span>
      </span>
    ),
    description: "The modern Rolodex for the global diaspora. Search by name, profession, skills, or hometown, and let our engine forge the connection.",
    href: "/directory",
    icon: Compass,
    iconBaseColor: "text-[#D4AF37]",
    iconBgColor: "bg-[#D4AF37]/10",
    hoverBorder: "hover:border-[#D4AF37]/50",
    groupHoverBg: "group-hover:bg-[#D4AF37]",
    groupHoverText: "group-hover:text-black",
    exploreColor: "text-[#D4AF37]",
    exploreHoverColor: "group-hover:text-[#F3E5AB]",
  },
  {
    title: (
      <span className="font-serif text-2xl">
        The <span className="text-rose-500 italic font-light">Pulse</span>
      </span>
    ),
    description: "The real-time feed of the diaspora. Share news, join discussions, and keep your finger on the pulse of the global community.",
    href: "/community",
    icon: Activity,
    iconBaseColor: "text-rose-500",
    iconBgColor: "bg-rose-500/10",
    hoverBorder: "hover:border-rose-500/50",
    groupHoverBg: "group-hover:bg-rose-500",
    groupHoverText: "group-hover:text-white",
    exploreColor: "text-rose-500",
    exploreHoverColor: "group-hover:text-rose-400",
  },
  {
    title: (
      <span className="font-serif text-2xl">
        <span className="text-emerald-400 italic font-light">Events</span>
      </span>
    ),
    description: "An interactive community scheduling tool. Join group calendars, sync overlapping organization events, and curate your collaborative schedule.",
    href: "/events",
    icon: CalendarDays,
    iconBaseColor: "text-emerald-400",
    iconBgColor: "bg-emerald-400/10",
    hoverBorder: "hover:border-emerald-500/50",
    groupHoverBg: "group-hover:bg-emerald-500",
    groupHoverText: "group-hover:text-white",
    exploreColor: "text-emerald-400",
    exploreHoverColor: "group-hover:text-emerald-300",
  }
];

export default function EcosystemHub() {
  return (
    <section
      id="ecosystem-hub"
      className="py-24 px-4 relative bg-[var(--background)]"
    >
      <div className="mx-auto max-w-5xl relative z-10 bg-[#1A1A1A]/50 backdrop-blur-xl p-8 md:p-12 mb-8 overflow-hidden border border-[var(--border)] rounded-[3rem]">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent)]/5 blur-[100px] pointer-events-none rounded-[100%]" />
        
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif tracking-tight sm:text-6xl mb-4 text-white">
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Explore
            </span>{" "}
            the Network
          </h2>
        </div>

        {/* 3-Column Grid */}
        <div className="grid md:grid-cols-3 gap-6 grid-cols-1 relative z-10 max-w-5xl mx-auto mb-6">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <Link
                key={index}
                href={pillar.href}
                className={`wac-card p-8 flex flex-col relative group ${pillar.hoverBorder} transition-all text-left`}
              >
                <div className={`w-12 h-12 rounded-full ${pillar.iconBgColor} ${pillar.iconBaseColor} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`mb-3 text-white ${pillar.exploreColor} transition-colors`}>
                  {pillar.title}
                </div>
                <p className="opacity-70 text-sm leading-relaxed mb-8 flex-1">
                  {pillar.description}
                </p>
                <span className={`flex items-center gap-2 text-sm font-bold ${pillar.exploreColor} ${pillar.exploreHoverColor} transition-colors uppercase tracking-wider mt-auto`}>
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
