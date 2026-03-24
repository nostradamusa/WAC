import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  Compass,
  FolderOpen,
  Handshake,
  Map,
  Network,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Vision | World Albanian Congress",
  description:
    "The long-term thesis behind World Albanian Congress: a high-caliber digital infrastructure for the global Albanian network.",
};

type Status = "live" | "building" | "planned";

type LiveFeature = {
  icon: React.ElementType;
  name: string;
  strapline: string;
  description: string;
  href: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  hoverText: string;
  hoverBg: string;
};

type BuildingFeature = {
  icon: React.ElementType;
  name: string;
  description: string;
  detail: string;
  when: string;
};

type FurtherItem = {
  icon: React.ElementType;
  name: string;
  description: string;
  when: string;
};

const LIVE_FEATURES: LiveFeature[] = [
  {
    icon: Compass,
    name: "Directory",
    strapline: "The network of record",
    description:
      "A living index of Albanian professionals, businesses, and organizations across borders, industries, and cities.",
    href: "/directory",
    iconBg: "bg-[#b08d57]/10",
    iconColor: "text-[#b08d57]",
    hoverBorder: "hover:border-[#b08d57]/30",
    hoverText: "group-hover:text-[#b08d57]",
    hoverBg: "bg-gradient-to-br from-[#b08d57]/[0.08] via-[#b08d57]/[0.02] to-transparent",
  },
  {
    icon: Activity,
    name: "Pulse",
    strapline: "The civic and social signal",
    description:
      "A shared stream for updates, milestones, announcements, and the moments that keep a dispersed community synchronized and engaged.",
    href: "/community",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    hoverBorder: "hover:border-rose-500/30",
    hoverText: "group-hover:text-rose-400",
    hoverBg: "bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-transparent",
  },
  {
    icon: CalendarDays,
    name: "Events",
    strapline: "The in-person layer",
    description:
      "Dinners, summits, and gatherings that turn digital connection into professional trust, local momentum, and real-world belonging.",
    href: "/events",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-400",
    hoverBorder: "hover:border-teal-500/30",
    hoverText: "group-hover:text-teal-400",
    hoverBg: "bg-gradient-to-br from-teal-500/[0.08] via-teal-500/[0.02] to-transparent",
  },
  {
    icon: Network,
    name: "Groups",
    strapline: "The durable circles of trust",
    description:
      "Communities organized around profession, geography, identity, and shared mission so the network can deepen instead of staying diffuse.",
    href: "/groups",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    hoverBorder: "hover:border-amber-500/30",
    hoverText: "group-hover:text-amber-400",
    hoverBg: "bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent",
  },
];

const BUILDING_FEATURES: BuildingFeature[] = [
  {
    icon: Map,
    name: "Diaspora Map",
    description:
      "A geographic intelligence layer that reveals where Albanians are established, concentrated, and building influence.",
    detail:
      "This turns the network from a directory into a strategic lens for relocation, employer outreach, local chapter growth, and coordinated community presence.",
    when: "Q2 2026",
  },
  {
    icon: BookOpen,
    name: "Resources & Guides",
    description:
      "Practical operating knowledge for living, working, investing, and relocating across borders, written for the realities of diaspora life.",
    detail:
      "The goal is not content for its own sake, but shared civic intelligence that lowers friction for every move, every return, and every next step.",
    when: "Q3 2026",
  },
  {
    icon: ShieldCheck,
    name: "Verified Network",
    description:
      "A trust layer for professionals, businesses, and organizations so identity, credibility, and recommendations carry real weight.",
    detail:
      "Verification should make introductions safer, partnerships more credible, and the entire network more useful the moment a user arrives.",
    when: "Q4 2026",
  },
];

const FURTHER_AHEAD: FurtherItem[] = [
  {
    icon: Briefcase,
    name: "Talent & Hiring",
    description:
      "A hiring layer that connects Albanian employers and professionals through trusted network context instead of cold discovery alone.",
    when: "2027",
  },
  {
    icon: FolderOpen,
    name: "Community Projects",
    description:
      "A coordination layer for diaspora-led initiatives, funding pathways, and execution around shared civic and economic goals.",
    when: "2027",
  },
  {
    icon: Handshake,
    name: "Business Opportunities",
    description:
      "Curated partnerships, investments, and commerce. Introductions surfaced through relationship intelligence instead of chance.",
    when: "2027",
  },
  {
    icon: UserCheck,
    name: "Portable Profile",
    description:
      "A durable identity that carries your reputation, verification, and contribution history across every layer of the ecosystem.",
    when: "2028",
  },
];

function StatusBadge({
  status,
  when,
}: {
  status: Status;
  when?: string;
}) {
  if (status === "live") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-[#b08d57]/[0.08] border border-[#b08d57]/20 text-[#d5bf92]">
        Available Now
      </span>
    );
  }

  if (status === "building") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#d5bf92]/85">
        {when ? `In Development · ${when}` : "In Development"}
      </span>
    );
  }

  return (
    <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/35">
      {when ?? "Planned"}
    </span>
  );
}

function LiveCard({
  icon: Icon,
  iconBg,
  iconColor,
  hoverBorder,
  hoverText,
  hoverBg,
  name,
  strapline,
  description,
  href,
}: LiveFeature) {
  return (
    <Link
      href={href}
      className={`relative group wac-card overflow-hidden border border-white/[0.08] p-5 md:p-6 transition-all duration-300 ${hoverBorder}`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${hoverBg}`} />

      <div className="relative z-10 flex h-full flex-col">
        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>

        <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/28">
          {strapline}
        </p>

        <h3 className={`mb-3 font-serif italic text-[25px] leading-none tracking-tight text-[var(--warm-ivory)] transition-colors ${hoverText}`}>
          {name}
        </h3>

        <p className="flex-1 font-serif text-[14px] font-light leading-[1.75] tracking-[0.015em] text-white/56">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <StatusBadge status="live" />
          <span className={`flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-white/30 transition-colors ${hoverText}`}>
            Explore <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BuildingCard({ icon: Icon, name, description, detail, when }: BuildingFeature) {
  return (
    <div className="wac-card flex flex-col border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 md:p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <Icon size={18} className="text-slate-200/55" />
      </div>

      <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/24">
        Strategic Layer
      </p>

      <h3 className="mb-3 font-serif text-[25px] leading-none tracking-tight text-[var(--warm-ivory)]">
        {name}
      </h3>

      <p className="font-serif text-[14px] font-light leading-[1.75] tracking-[0.015em] text-white/56">
        {description}
      </p>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="mb-3 text-[12px] leading-[1.75] text-white/34">{detail}</p>
        <StatusBadge status="building" when={when} />
      </div>
    </div>
  );
}

function FurtherAheadList({ items }: { items: FurtherItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.name}
          className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 md:px-5"
        >
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <item.icon size={14} className="text-white/32" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-serif text-[18px] tracking-tight text-white/72">
                  {item.name}
                </span>
                <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/24">
                  {item.when}
                </span>
              </div>

              <p className="text-[13px] leading-[1.7] text-white/40">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VisionPage() {
  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl px-4 pb-24 pt-20 sm:px-6 md:pt-24">
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          <span className="italic font-light opacity-90 text-[#d5bf92]">Vision</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">
          The long-term thesis behind World Albanian Congress.
        </p>

        {/* ── Gentle manifesto ────────────────────────────────────────────── */}
        <section className="relative mt-10 mb-4 max-w-3xl pl-6 md:pl-8">
          <div className="absolute bottom-0 left-0 top-0 w-[2px] rounded-full bg-gradient-to-b from-[#d5bf92]/55 via-[#d5bf92]/12 to-transparent" />

          <p className="font-serif italic font-light text-[20px] leading-[1.6] tracking-[0.015em] text-[var(--warm-ivory)] md:text-[22px]">
            We are not building a collection of features.
            <span className="block text-[#d5bf92]">
              We are building a home for Albanian momentum.
            </span>
          </p>

          <p className="mt-5 text-[13px] leading-[1.9] text-white/44">
            A high-caliber digital infrastructure where identity, opportunity, and community
            stop living in fragments and begin operating as one system. Directory, Pulse,
            Events, and Groups are not standalone utilities — they are the first visible
            layers of a network designed to make the Albanian diaspora easier to find,
            easier to trust, and more powerful to activate.
          </p>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[0.95fr_1.45fr] lg:items-start">
          <div className="max-w-md">
            <SectionLabel label="The Foundation" variant="featured" className="mb-5" />
            <h2 className="font-serif text-3xl leading-[1.14] tracking-tight text-[var(--warm-ivory)] md:text-[42px]">
              Four pillars already defining the character of the network.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.85] text-white/46">
              Each surface carries its own identity and purpose, but together they establish
              the platform’s deeper promise: discovery, signal, gathering, and belonging
              inside one high-trust ecosystem.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {LIVE_FEATURES.map((feature) => (
              <LiveCard key={feature.name} {...feature} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="relative max-w-4xl pl-6 py-2 md:pl-8 md:py-4">
            <div className="absolute bottom-0 left-0 top-0 w-[2px] rounded-full bg-gradient-to-b from-[#d5bf92]/70 via-[#d5bf92]/18 to-transparent" />

            <SectionLabel label="Why this matters" variant="standard" className="mb-6" />

            <div className="space-y-6">
              <p className="font-serif text-[22px] leading-[1.7] tracking-[0.015em] text-[var(--warm-ivory)] md:text-[25px]">
                The Albanian diaspora is global, ambitious, and unusually connected by memory,
                family, and instinct, yet it still lacks a durable digital center of gravity.
              </p>

              <p className="max-w-3xl font-serif text-[16px] font-light leading-[1.95] tracking-[0.015em] text-white/58">
                Too much of the network still depends on word of mouth, scattered group chats,
                and accidental introductions. The opportunity is larger than convenience.
                It is about building a shared operating layer where trust can compound,
                visibility can scale, and people can move through the diaspora with more
                continuity than they have ever had before.
              </p>

              <p className="max-w-3xl font-serif text-[16px] font-light leading-[1.95] tracking-[0.015em] text-white/58">
                That is why this page is not a roadmap. It is a statement of architecture:
                the present features establish the network, the next layers make it
                intelligent, and the long horizon turns it into a civic and professional
                system with real strategic weight.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-start">
          <div className="max-w-md">
            <SectionLabel label="In Development" variant="standard" className="mb-5" />
            <h2 className="font-serif text-3xl leading-[1.14] tracking-tight text-[var(--warm-ivory)] md:text-[40px]">
              The next layers are about intelligence, trust, and orientation.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.85] text-white/46">
              These are the capabilities that move the platform from a foundational directory
              into a comprehensive system for diaspora navigation, decision-making, and
              credibility.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {BUILDING_FEATURES.map((feature) => (
              <BuildingCard key={feature.name} {...feature} />
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-start">
          <div className="max-w-md">
            <SectionLabel label="Long Horizon" variant="standard" className="mb-5" />
            <h2 className="font-serif text-3xl leading-[1.14] tracking-tight text-[var(--warm-ivory)] md:text-[40px]">
              Over time, the network should become more than a place to browse.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.85] text-white/46">
              It should become a place to build careers, coordinate projects, create economic
              opportunity, and carry a portable reputation across every part of the ecosystem.
            </p>
          </div>

          <FurtherAheadList items={FURTHER_AHEAD} />
        </section>

        <section className="mt-16">
          <div className="wac-card border border-white/[0.08] bg-[linear-gradient(180deg,rgba(176,141,87,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <SectionLabel label="Join the Thesis" variant="standard" className="mb-5" />
                <h2 className="font-serif text-3xl leading-[1.12] tracking-tight text-[var(--warm-ivory)] md:text-[42px]">
                  A network built to the exact standard our community has already set.
                </h2>
                <p className="mt-4 max-w-xl font-serif text-[16px] font-light leading-[1.85] tracking-[0.015em] text-white/56">
                  Every meaningful network becomes more valuable when serious people arrive
                  early, shape its culture, and give the next layer of connection something
                  real to build on.
                </p>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="rounded-full bg-[#b08d57] px-5 py-2.5 text-center text-sm font-semibold text-black transition-colors hover:bg-[#9a7545] whitespace-nowrap"
                >
                  Join the Network
                </Link>
                <Link
                  href="/directory"
                  className="rounded-full border border-[#b08d57]/30 px-5 py-2.5 text-center text-sm font-semibold text-[#d5bf92] transition-colors hover:bg-[#b08d57]/10 whitespace-nowrap"
                >
                  Explore the Directory
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
