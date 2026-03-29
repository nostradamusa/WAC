import Link from "next/link";
import { Home, Sparkles, ShieldCheck, BookOpen, ArrowRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

type StatusVariant = "soon" | "dev" | "next" | "planned";

const STATUS_STYLES: Record<StatusVariant, string> = {
  soon:    "bg-[#b08d57]/10 border-[#b08d57]/20 text-[#d5bf92]",
  dev:     "bg-white/[0.04] border-white/[0.08] text-[#d5bf92]/80",
  next:    "bg-white/[0.03] border-white/[0.07] text-white/40",
  planned: "bg-white/[0.03] border-white/[0.06] text-white/30",
};

const COMING = [
  {
    icon: Home,
    name: "Properties",
    description: "A market layer for living, investing, staying, and relocating across the Albanian world.",
    status: "Coming Soon" as const,
    variant: "soon" as StatusVariant,
  },
  {
    icon: Sparkles,
    name: "COUSIN Rating",
    shortName: null,
    description: "A signal for real network contribution, reliability, relevance, and usefulness.",
    status: "In Development" as const,
    variant: "dev" as StatusVariant,
  },
  {
    icon: ShieldCheck,
    name: "Verified Network",
    description: "A trust layer for professionals, businesses, and organizations so introductions carry real weight.",
    status: "Coming Next" as const,
    variant: "next" as StatusVariant,
  },
  {
    icon: BookOpen,
    name: "Resources & Guides",
    description: "Practical intelligence for living, working, relocating, investing, and navigating across borders.",
    status: "Planned" as const,
    variant: "planned" as StatusVariant,
  },
];

export default function ComingNext() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 border-t border-white/[0.04]">
      <div className="mx-auto max-w-screen-xl">

        <div className="max-w-3xl mb-10 md:mb-14">
          <SectionLabel label="Coming Next" variant="standard" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.2] tracking-tight text-[var(--warm-ivory)]">
            The next layers make the network more intelligent.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.8] text-white/45 max-w-2xl">
            The next phase is not about adding noise. It is about making the network more trusted, more navigable, and more useful the moment someone arrives.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COMING.map(({ icon: Icon, name, shortName, description, status, variant }) => (
            <div
              key={name}
              className="wac-card flex flex-col border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 md:p-6"
            >
              <div className="mb-5 w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                <Icon size={18} className="text-white/45" />
              </div>
              <h3 className="font-serif text-[20px] tracking-tight text-[var(--warm-ivory)] mb-2 leading-tight">
                {name}
                {shortName && (
                  <span className="text-[#d5bf92]/50 text-[14px] ml-1.5 italic font-light">({shortName})</span>
                )}
              </h3>
              <p className="flex-1 text-[13px] leading-[1.7] text-white/40 mb-5">
                {description}
              </p>
              <span className={`self-start text-[9px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full border ${STATUS_STYLES[variant]}`}>
                {status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/vision"
            className="flex items-center gap-2 text-[12px] font-semibold tracking-wide uppercase text-white/30 hover:text-[#b08d57] transition-colors"
          >
            See the full roadmap
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  );
}
