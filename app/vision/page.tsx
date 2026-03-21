import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Network,
  CalendarDays,
  MessageSquare,
  Map,
  BookOpen,
  ShieldCheck,
  Briefcase,
  FolderOpen,
  Handshake,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Vision | World Albanian Congress",
  description:
    "Where the World Albanian Congress platform stands today and where it is building toward.",
};

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  when,
}: {
  status: "live" | "building" | "planned";
  when?: string;
}) {
  if (status === "live") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/[0.10] border border-teal-500/20 text-teal-400/80">
        Available Now
      </span>
    );
  }
  if (status === "building") {
    return (
      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#b08d57]/[0.08] border border-[#b08d57]/20 text-[#b08d57]/70">
        {when ? `In Development · ${when}` : "In Development"}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.09] text-white/35">
      {when ?? "Planned"}
    </span>
  );
}

// ── Live feature card (navigable) ─────────────────────────────────────────────

function LiveCard({
  icon: Icon,
  iconBg,
  iconColor,
  name,
  description,
  href,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  name: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="wac-card group flex flex-col p-5 hover:border-white/15 transition-colors"
    >
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 shrink-0`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-[#b08d57] transition-colors">
        {name}
      </h3>
      <p className="text-xs text-white/45 leading-relaxed flex-1">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status="live" />
        <ArrowRight
          size={12}
          className="text-white/20 group-hover:text-white/40 transition-colors"
        />
      </div>
    </Link>
  );
}

// ── Roadmap card — near-term (In Development) ─────────────────────────────────

function BuildingCard({
  icon: Icon,
  name,
  description,
  detail,
  when,
}: {
  icon: React.ElementType;
  name: string;
  description: string;
  detail: string;
  when: string;
}) {
  return (
    <div className="wac-card flex flex-col p-5">
      {/*
        Slate-tinted icon — cooler than the gold/teal/amber live cards, signals
        "not yet available" without looking broken. Vision section-identity: silver/platinum.
      */}
      <div className="w-10 h-10 rounded-xl bg-slate-400/[0.06] border border-slate-400/[0.12] flex items-center justify-center mb-4 shrink-0">
        <Icon size={18} className="text-slate-300/50" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">{name}</h3>
      <p className="text-xs text-white/45 leading-relaxed flex-1">{description}</p>
      <p className="mt-2 text-[11px] text-white/30 leading-relaxed">{detail}</p>
      <div className="mt-4">
        <StatusBadge status="building" when={when} />
      </div>
    </div>
  );
}

// ── Further Ahead items — list layout, not card grid ──────────────────────────
//
// Intentionally lighter than the BuildingCard grid above.
// Visual hierarchy: Live cards → Building cards → Further Ahead list → Closure.
// The layout change (row list vs. card grid) communicates "less near, less detail"
// without the broken-UI feeling of full-card opacity reduction.

type FurtherItem = {
  icon: React.ElementType;
  name: string;
  description: string;
  when: string;
};

function FurtherAheadList({ items }: { items: FurtherItem[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-start gap-3.5 py-3.5 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
        >
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
            <item.icon size={13} className="text-white/30" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-semibold text-white/55">{item.name}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-full shrink-0">
                {item.when}
              </span>
            </div>
            <p className="text-xs text-white/35 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const FURTHER_AHEAD: FurtherItem[] = [
  {
    icon: Briefcase,
    name: "Talent & Hiring",
    description:
      "A hiring layer connecting Albanian employers and professionals within the network.",
    when: "2027",
  },
  {
    icon: FolderOpen,
    name: "Community Projects",
    description:
      "Collaborative initiatives and coordinated funding for diaspora-led projects.",
    when: "2027",
  },
  {
    icon: Handshake,
    name: "Business Opportunities",
    description:
      "Curated partnerships, investment deals, and commercial introductions surfaced through the network.",
    when: "2027",
  },
  {
    icon: UserCheck,
    name: "Portable Profile",
    description:
      "A verified professional identity that travels with you — recognized across every part of the platform.",
    when: "2028",
  },
];

export default function VisionPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* ── Zone 1: Eyebrow ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-1.5">
          <Compass size={13} className="text-white/30" strokeWidth={2} />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">
            Vision
          </span>
        </div>

        {/* ── Zone 2: H1 — Archetype C brand statement ─────────────────── */}
        {/*
          Not "The [Noun]" — this is a declarative statement of intent.
          Italic gold lands on the most specific, meaningful phrase.
          max-w-3xl keeps the line lengths readable at lg breakpoint.
        */}
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight text-white leading-snug max-w-3xl">
          Building the digital infrastructure{" "}
          of the{" "}
          <span className="italic font-light opacity-90 text-[#b08d57]">Albanian diaspora.</span>
        </h1>

        {/* ── Zone 3: Description ──────────────────────────────────────── */}
        <p className="mt-3 text-sm text-white/50 max-w-xl leading-relaxed">
          Where the platform stands today — and what it is building toward.
        </p>

        {/* ── Section 1: Available Today ───────────────────────────────── */}
        {/*
          Live features shown as navigable cards.
          "Available Now" badge anchors the page in the present before the
          narrative moves into the roadmap.
          variant="featured" — highest visual weight, one per page.
        */}
        <section className="mt-12">
          <SectionLabel label="Available Today" variant="featured" className="mb-5" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LiveCard
              icon={Compass}
              iconBg="bg-[#b08d57]/10"
              iconColor="text-[#b08d57]/80"
              name="The Directory"
              description="Find Albanian professionals, businesses, and organizations across 50+ countries."
              href="/directory"
            />
            <LiveCard
              icon={Network}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-400/80"
              name="Groups"
              description="Communities built around profession, family, culture, and shared identity."
              href="/groups"
            />
            <LiveCard
              icon={CalendarDays}
              iconBg="bg-teal-500/10"
              iconColor="text-teal-400/80"
              name="Events"
              description="Professional dinners, leadership summits, and gatherings across the diaspora."
              href="/events"
            />
            <LiveCard
              icon={MessageSquare}
              iconBg="bg-white/[0.05]"
              iconColor="text-white/40"
              name="Community Feed"
              description="Real-time stories, announcements, and updates from people and organizations."
              href="/community"
            />
          </div>
        </section>

        {/* ── Editorial: Why this network matters ──────────────────────── */}
        {/*
          Two paragraphs. No bullet points.
          P1: Concrete context — diaspora size, countries, the actual problem.
          P2: Connects present features to future infrastructure by name.
          Earns the reader's trust with specificity before asking for conviction.
        */}
        <section className="mt-16">
          <SectionLabel label="Why it matters" variant="standard" className="mb-6" />
          <div className="max-w-2xl space-y-5">
            <p className="text-[15px] text-white/65 leading-[1.75]">
              The Albanian diaspora numbers around seven million people — spread across the
              United States, Italy, Germany, Greece, the United Kingdom, Switzerland, and beyond.
              They share language, family, and history, but no common platform. Every time
              someone moves to a new city or country, they rebuild their professional network
              from scratch. Every time an organization wants to reach the community, it finds
              no shared channel. That is the gap this platform is built to close.
            </p>
            <p className="text-[15px] text-white/65 leading-[1.75]">
              The Directory, Groups, Events, and Feed are the foundation — a network that
              already works. The Diaspora Map, Verified Network, and Resources layer that
              follow are the infrastructure. Together, they create something that becomes
              more useful the more people join: not a social feed, but a professional and
              civic operating system for a community that has always been more connected
              than any tool has let it be.
            </p>
          </div>
        </section>

        {/* ── Section 2: In Development ────────────────────────────────── */}
        {/*
          Three near-term features with specific quarter targets.
          Slate/silver icon treatment distinguishes these from live cards
          without making them look broken. "detail" line explains what the
          feature does for a user — not how it is built.
        */}
        <section className="mt-16">
          <SectionLabel label="In Development" variant="standard" className="mb-5" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <BuildingCard
              icon={Map}
              name="Diaspora Map"
              description="A live geographic view of where Albanians are established globally. Explore by country, metropolitan area, or professional sector."
              detail="Useful for relocation decisions, employer hiring across the network, and organizational outreach to specific communities."
              when="Q2 2026"
            />
            <BuildingCard
              icon={BookOpen}
              name="Resources & Guides"
              description="Practical knowledge for living, working, investing, and relocating across borders — contributed and curated by the network."
              detail="Coverage includes real estate markets, business formation, tax considerations, city-specific relocation guides, and professional licensing by country."
              when="Q3 2026"
            />
            <BuildingCard
              icon={ShieldCheck}
              name="Verified Network"
              description="Verified status for professionals, businesses, and organizations. A credibility layer built into every connection and recommendation."
              detail="Verification signals that an entity has been reviewed and confirmed — giving people a real basis for trust before any professional interaction."
              when="Q4 2026"
            />
          </div>
        </section>

        {/* ── Section 3: Further Ahead ─────────────────────────────────── */}
        {/*
          List layout, not card grid — intentionally lighter visual weight than
          the BuildingCard section above. Communicates "real intention, not near-term
          commitment" through reduced layout density rather than card opacity dimming.
        */}
        <section className="mt-12">
          <SectionLabel label="Further Ahead" variant="standard" className="mb-5" />
          <FurtherAheadList items={FURTHER_AHEAD} />
        </section>

        {/* ── Closure CTA ──────────────────────────────────────────────── */}
        {/*
          Ends the page with something concrete and actionable.
          Tier 1 (gold filled): Join the Network — primary growth CTA.
          Tier 2 (outlined gold): Explore Today — for users already browsing.
          Copy is direct and honest — no implication of community product governance.
        */}
        <section className="mt-16">
          <div className="wac-card p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-lg">
              <h2 className="font-serif text-2xl font-normal text-white mb-2 leading-snug">
                The network is early. Join it now.
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                The platform is most valuable when the people who need it are already in it.
                The earlier you join, the more connected the network is when the next layer ships.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#b08d57] text-black hover:bg-[#9a7545] transition-colors whitespace-nowrap text-center"
              >
                Join the Network
              </Link>
              <Link
                href="/directory"
                className="px-5 py-2.5 rounded-full text-sm font-semibold border border-[#b08d57]/30 text-[#b08d57]/70 hover:bg-[#b08d57]/10 transition-colors whitespace-nowrap text-center"
              >
                Explore Today
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
