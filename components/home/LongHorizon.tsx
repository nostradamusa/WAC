import { Briefcase, FolderOpen, Handshake, UserCheck } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

const HORIZON = [
  {
    icon: Briefcase,
    name: "Talent & Hiring",
    description: "A hiring layer that connects Albanian employers and professionals through trusted network context instead of cold discovery alone.",
    when: "2027",
  },
  {
    icon: FolderOpen,
    name: "Community Projects",
    description: "A coordination layer for diaspora-led initiatives, funding pathways, and execution around shared civic and economic goals.",
    when: "2027",
  },
  {
    icon: Handshake,
    name: "Business Opportunities",
    description: "Curated partnerships, investments, and commerce surfaced through relationship intelligence instead of chance.",
    when: "2027",
  },
  {
    icon: UserCheck,
    name: "Portable Profile",
    description: "A durable identity that carries reputation, verification, and contribution history across every layer of the ecosystem.",
    when: "2028",
  },
];

export default function LongHorizon() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 border-t border-white/[0.04]">
      <div className="mx-auto max-w-screen-xl">

        <div className="max-w-3xl mb-10 md:mb-14">
          <SectionLabel label="Long Horizon" variant="standard" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.2] tracking-tight text-[var(--warm-ivory)]">
            Over time, the network should become more than a place to browse.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.8] text-white/45 max-w-2xl">
            It should become a place to build careers, coordinate projects, create economic opportunity, and carry a portable reputation across every layer of the ecosystem.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {HORIZON.map(({ icon: Icon, name, description, when }) => (
            <div
              key={name}
              className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-5 py-5"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 w-10 h-10 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                  <Icon size={15} className="text-white/28" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                    <span className="font-serif text-[18px] tracking-tight text-white/60">
                      {name}
                    </span>
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/22">
                      {when}
                    </span>
                  </div>
                  <p className="text-[13px] leading-[1.7] text-white/35">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
