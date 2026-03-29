import SectionLabel from "@/components/ui/SectionLabel";

export default function WhyItExists() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 bg-[rgba(255,255,255,0.01)] border-y border-[var(--border)]">
      <div className="mx-auto max-w-screen-xl grid md:grid-cols-[1fr_1.3fr] gap-10 md:gap-16 items-start">

        {/* Left: label + heading */}
        <div>
          <SectionLabel label="Our Purpose" variant="standard" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] font-normal text-white leading-[1.2] tracking-tight">
            <span className="italic text-[#b08d57]">Albanians</span> are everywhere.
            <br />
            <span className="text-white/55">Their network should be too.</span>
          </h2>
        </div>

        {/* Right: copy */}
        <div className="space-y-5 text-[15px] text-white/50 leading-[1.8]">
          <p>
            Professionals, businesses, organizations, and builders are spread across the world,
            but discovery still depends too much on word of mouth, scattered social platforms,
            and accidental introductions.
          </p>
          <p className="text-white/65 font-medium">
            World Albanian Congress brings identity, signal, geography, and opportunity into one system.
          </p>
        </div>

      </div>
    </section>
  );
}
