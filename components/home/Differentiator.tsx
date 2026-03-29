import { Search, ShieldCheck, TrendingUp } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

const BLOCKS = [
  {
    icon: Search,
    title: "Discovery",
    description: "Find the right people, businesses, and communities faster.",
    accent: "text-[#b08d57]",
    bg: "bg-[#b08d57]/10",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    description: "Build on identity, context, and credibility instead of randomness.",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: TrendingUp,
    title: "Momentum",
    description: "Turn updates, gatherings, and introductions into compounding network value.",
    accent: "text-sky-400",
    bg: "bg-sky-500/10",
  },
];

export default function Differentiator() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-screen-xl">

        <div className="max-w-3xl mb-10 md:mb-14">
          <SectionLabel label="Why This Is Different" variant="standard" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.2] tracking-tight text-[var(--warm-ivory)]">
            More than a directory.{" "}
            <span className="text-white/40">More than a feed.</span>{" "}
            <span className="text-white/25">More than a map.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-[1.8] text-white/45 max-w-2xl">
            WAC is a system where people, signal, geography, and opportunity reinforce each other.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {BLOCKS.map(({ icon: Icon, title, description, accent, bg }) => (
            <div
              key={title}
              className="wac-card border border-white/[0.07] p-6 md:p-7"
            >
              <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                <Icon size={18} className={accent} />
              </div>
              <h3 className="font-serif italic text-[22px] tracking-tight text-[var(--warm-ivory)] mb-3">
                {title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-white/45">
                {description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
