import Link from "next/link";
import { Compass, Activity, CalendarDays, Network, ArrowRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

const SECTIONS = [
  {
    icon: Compass,
    name: "The Directory",
    description:
      "Find any Albanian professional, business, or organization. Search by name, profession, or location.",
    href: "/directory",
    iconBg: "bg-[#D4AF37]/10",
    iconColor: "text-[#D4AF37]/80",
    nameColor: "text-[#D4AF37]",
    linkColor: "text-[#D4AF37]/55 group-hover:text-[#D4AF37]",
  },
  {
    icon: Activity,
    name: "The Pulse",
    description:
      "The real-time community feed. News, discussions, and updates from across the diaspora.",
    href: "/community",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400/80",
    nameColor: "text-rose-400",
    linkColor: "text-rose-400/55 group-hover:text-rose-400",
  },
  {
    icon: CalendarDays,
    name: "Events",
    description:
      "Upcoming gatherings from professional dinners to international leadership summits.",
    href: "/events",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400/80",
    nameColor: "text-teal-400",
    linkColor: "text-teal-400/55 group-hover:text-teal-400",
  },
  {
    icon: Network,
    name: "Groups",
    description:
      "Communities organized around profession, family, culture, and shared identity.",
    href: "/groups",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400/80",
    nameColor: "text-amber-400",
    linkColor: "text-amber-400/55 group-hover:text-amber-400",
  },
] as const;

export default function EcosystemHub() {
  return (
    <section className="py-16 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl">
        <SectionLabel label="Explore the Platform" variant="standard" className="mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ icon: Icon, name, description, href, iconBg, iconColor, nameColor, linkColor }) => (
            <Link
              key={href}
              href={href}
              className="wac-card group flex flex-col p-5 hover:border-white/15 transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 shrink-0`}
              >
                <Icon size={18} className={iconColor} />
              </div>
              {/* Serif name carries section-identity color — matches destination page H1 */}
              <h3 className={`font-serif text-base font-normal mb-1.5 ${nameColor}`}>
                {name}
              </h3>
              <p className="text-xs text-white/45 leading-relaxed flex-1">{description}</p>
              <div
                className={`mt-4 flex items-center gap-1.5 text-xs font-semibold transition-colors ${linkColor}`}
              >
                Explore <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
