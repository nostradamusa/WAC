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
  Home,
  Map,
  Network,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Vision | World Albanian Congress",
  description:
    "We are building the operating system for Albanian momentum. A living network designed to turn connection into trust, visibility into opportunity, and scattered diaspora energy into coordinated movement.",
};

// ── Live Features ────────────────────────────────────────────────────────────

type LiveFeature = {
  icon: React.ElementType;
  name: string;
  strapline: string;
  description: string;
  detail?: string;
  href: string;
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
  hoverText: string;
  hoverBg: string;
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
      "A shared stream for updates, milestones, opportunities, and the moments that keep a dispersed community synchronized and engaged.",
    href: "/pulse",
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
      "Communities organized around profession, geography, identity, and shared mission\u2014so the network can deepen instead of staying diffuse.",
    href: "/groups",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    hoverBorder: "hover:border-amber-500/30",
    hoverText: "group-hover:text-amber-400",
    hoverBg: "bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent",
  },
  {
    icon: Map,
    name: "Diaspora Map",
    strapline: "The strategic layer",
    description:
      "A geographic intelligence layer that reveals where Albanians are established, concentrated, and building influence.",
    detail:
      "This turns the network from a directory into a strategic lens for relocation, employer outreach, local chapter growth, investment visibility, and coordinated community presence.",
    href: "/directory?view=map",
    iconBg: "bg-[#b08d57]/10",
    iconColor: "text-[#b08d57]",
    hoverBorder: "hover:border-[#b08d57]/30",
    hoverText: "group-hover:text-[#b08d57]",
    hoverBg: "bg-gradient-to-br from-[#b08d57]/[0.08] via-[#b08d57]/[0.02] to-transparent",
  },
];

// ── Next Layers ──────────────────────────────────────────────────────────────

type NextFeature = {
  icon: React.ElementType;
  name: string;
  strapline: string;
  description: string;
  detail?: string;
  status: string;
};

const NEXT_FEATURES: NextFeature[] = [
  {
    icon: Home,
    name: "Properties",
    strapline: "Strategic layer",
    description:
      "A market layer for living, investing, staying, and relocating across the Albanian world.",
    detail:
      "Homes, listings, and location-based opportunity tied directly into the network\u2014so people can discover not just who is where, but what is possible there.",
    status: "Coming Soon",
  },
  {
    icon: Sparkles,
    name: "CUSI",
    strapline: "Signal layer",
    description:
      "A signal for real network utility.",
    detail:
      "The Community Utility Score surfaces contribution, trust, relevance, and follow-through\u2014so visibility reflects value, not noise.",
    status: "In Development",
  },
  {
    icon: ShieldCheck,
    name: "Verified Network",
    strapline: "Trust layer",
    description:
      "A credibility layer for professionals, businesses, and organizations\u2014so identity, legitimacy, and recommendations carry real weight.",
    detail:
      "Verification makes introductions safer, partnerships more credible, and the network more useful the moment someone arrives.",
    status: "Coming Next",
  },
  {
    icon: BookOpen,
    name: "Resources & Guides",
    strapline: "Strategic layer",
    description:
      "Practical operating knowledge for living, working, investing, and relocating across borders\u2014written for the realities of diaspora life.",
    detail:
      "Not content for its own sake, but shared civic intelligence that lowers friction for every move, every return, and every next step.",
    status: "Planned",
  },
];

// ── Long Horizon ─────────────────────────────────────────────────────────────

type HorizonItem = {
  icon: React.ElementType;
  name: string;
  description: string;
  when: string;
};

const HORIZON_ITEMS: HorizonItem[] = [
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
      "Curated partnerships, investments, and commerce surfaced through relationship intelligence instead of chance.",
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

// ── Shared Components ────────────────────────────────────────────────────────

function StatusBadge({ label, variant = "default" }: { label: string; variant?: "live" | "gold" | "default" }) {
  if (variant === "live") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-[#b08d57]/[0.08] border border-[#b08d57]/20 text-[#d5bf92]">
        Live Now
      </span>
    );
  }
  if (variant === "gold") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[#d5bf92]/85">
        {label}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/35">
      {label}
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
  detail,
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

        <p className="font-serif text-[14px] font-light leading-[1.75] tracking-[0.015em] text-white/56">
          {description}
        </p>

        {detail && (
          <p className="mt-3 text-[12px] leading-[1.8] text-white/34">
            {detail}
          </p>
        )}

        <div className="mt-auto pt-5 flex items-center justify-between">
          <StatusBadge label="Live Now" variant="live" />
          <span className={`flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-white/30 transition-colors ${hoverText}`}>
            Explore <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function NextCard({ icon: Icon, name, strapline, description, detail, status }: NextFeature) {
  return (
    <div className="wac-card flex flex-col border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-5 md:p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <Icon size={18} className="text-slate-200/55" />
      </div>

      <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/24">
        {strapline}
      </p>

      <h3 className="mb-3 font-serif text-[25px] leading-none tracking-tight text-[var(--warm-ivory)]">
        {name}
      </h3>

      <p className="font-serif text-[14px] font-light leading-[1.75] tracking-[0.015em] text-white/56">
        {description}
      </p>

      {detail && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <p className="mb-3 text-[12px] leading-[1.8] text-white/34">{detail}</p>
        </div>
      )}

      <div className="mt-auto pt-4">
        <StatusBadge label={status} variant={status === "Coming Soon" ? "gold" : "default"} />
      </div>
    </div>
  );
}

function HorizonList({ items }: { items: HorizonItem[] }) {
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VisionPage() {
  return (
    <div className="min-h-screen w-full bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl px-4 pb-24 pt-20 sm:px-6 md:pt-24">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <SectionLabel label="Vision" variant="featured" className="mb-6" />

        <div className="max-w-3xl">
          <h1 className="font-serif text-[28px] md:text-[38px] leading-[1.25] tracking-tight text-[var(--warm-ivory)]">
            We are not building another Albanian app.{" "}
            <span className="text-[#d5bf92]">
              We are building the operating system for Albanian momentum.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl font-serif text-[16px] font-light leading-[1.9] tracking-[0.015em] text-white/50">
            World Albanian Congress is a living network designed to turn connection into trust,
            visibility into opportunity, and scattered diaspora energy into coordinated movement.
          </p>
        </div>

        {/* ── Section 1: Live Now ────────────────────────────────────── */}
        <section className="mt-20">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.45fr] lg:items-start">
            <div className="max-w-md">
              <SectionLabel label="Live Now" variant="featured" className="mb-5" />
              <h2 className="font-serif text-3xl leading-[1.14] tracking-tight text-[var(--warm-ivory)] md:text-[42px]">
                The first layers are already in place.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.85] text-white/46">
                What exists today is not the whole vision. It is the first proof that the network
                can be structured, searchable, and activated as one system.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {LIVE_FEATURES.slice(0, 4).map((feature) => (
                <LiveCard key={feature.name} {...feature} />
              ))}
              {/* Diaspora Map — horizontal layout spanning both columns */}
              {(() => {
                const dm = LIVE_FEATURES[4];
                return (
                  <Link
                    href={dm.href}
                    className={`sm:col-span-2 relative group wac-card overflow-hidden border border-white/[0.08] p-5 md:p-6 transition-all duration-300 ${dm.hoverBorder}`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${dm.hoverBg}`} />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${dm.iconBg}`}>
                        <dm.icon size={18} className={dm.iconColor} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-white/28">{dm.strapline}</p>
                        <h3 className={`mb-2 font-serif italic text-[25px] leading-none tracking-tight text-[var(--warm-ivory)] transition-colors ${dm.hoverText}`}>
                          {dm.name}
                        </h3>
                        <p className="font-serif text-[14px] font-light leading-[1.75] tracking-[0.015em] text-white/56 max-w-2xl">
                          {dm.description}
                        </p>
                        {dm.detail && (
                          <p className="mt-2 text-[12px] leading-[1.8] text-white/34 max-w-2xl">{dm.detail}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0 sm:self-end">
                        <StatusBadge label="Live Now" variant="live" />
                        <span className={`flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-white/30 transition-colors ${dm.hoverText}`}>
                          Explore <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })()}
            </div>
          </div>
        </section>

        {/* ── Section 2: Why This Matters ────────────────────────────── */}
        <section className="mt-20">
          <div className="relative max-w-4xl pl-6 py-2 md:pl-8 md:py-4">
            <div className="absolute bottom-0 left-0 top-0 w-[2px] rounded-full bg-gradient-to-b from-[#d5bf92]/70 via-[#d5bf92]/18 to-transparent" />

            <SectionLabel label="Why This Matters" variant="standard" className="mb-6" />

            <div className="space-y-6">
              <p className="font-serif text-[22px] leading-[1.6] tracking-[0.015em] text-[var(--warm-ivory)] md:text-[25px]">
                A global people still lacks a digital center of gravity.
              </p>

              <p className="max-w-3xl font-serif text-[16px] font-light leading-[1.95] tracking-[0.015em] text-white/54">
                The Albanian diaspora is global, ambitious, and unusually connected by memory,
                family, and instinct. Yet too much of its movement still depends on scattered
                group chats, word of mouth, and accidental introductions.
              </p>

              <p className="max-w-3xl font-serif text-[16px] font-light leading-[1.95] tracking-[0.015em] text-white/54">
                The opportunity is larger than convenience. This is about building a shared
                operating layer where trust can compound, visibility can scale, and people can
                move through the diaspora with more continuity than chance.
              </p>

              <p className="max-w-3xl font-serif text-[16px] font-light leading-[1.95] tracking-[0.015em] text-white/48">
                That is why this is not a roadmap page. It is a statement of architecture: the
                present layers establish the network, the next layers make it more intelligent,
                and the long horizon turns it into a civic and professional system with real
                strategic weight.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Next Layers ─────────────────────────────────── */}
        <section className="mt-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-start">
            <div className="max-w-md">
              <SectionLabel label="Next Layers" variant="standard" className="mb-5" />
              <h2 className="font-serif text-3xl leading-[1.14] tracking-tight text-[var(--warm-ivory)] md:text-[40px]">
                The next phase is about intelligence, trust, and orientation.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.85] text-white/46">
                These are the layers that move the platform from a foundational network into a
                system for diaspora navigation, credibility, and coordinated opportunity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {NEXT_FEATURES.map((feature) => (
                <NextCard key={feature.name} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Long Horizon ────────────────────────────────── */}
        <section className="mt-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-start">
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

            <HorizonList items={HORIZON_ITEMS} />
          </div>
        </section>

        {/* ── Closing Block ──────────────────────────────────────────── */}
        <section className="mt-20">
          <div className="wac-card border border-white/[0.08] bg-[linear-gradient(180deg,rgba(176,141,87,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <SectionLabel label="Join the Thesis" variant="standard" className="mb-5" />
                <h2 className="font-serif text-3xl leading-[1.12] tracking-tight text-[var(--warm-ivory)] md:text-[42px]">
                  A network built to the exact standard our community has already set.
                </h2>
                <p className="mt-4 max-w-xl font-serif text-[16px] font-light leading-[1.85] tracking-[0.015em] text-white/56">
                  Every meaningful network becomes more valuable when serious people arrive early,
                  shape its culture, and give the next layer of connection something real to build on.
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
