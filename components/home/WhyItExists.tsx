import SectionLabel from "@/components/ui/SectionLabel";

export default function WhyItExists() {
  return (
    <section className="py-16 px-4 bg-[rgba(255,255,255,0.01)] border-y border-[var(--border)]">
      <div className="mx-auto max-w-screen-xl grid md:grid-cols-[1fr_1.3fr] gap-10 md:gap-16 items-center">

        {/* Left: label + heading */}
        <div>
          <SectionLabel label="Our Purpose" variant="standard" className="mb-5" />
          <h2 className="font-serif text-3xl md:text-4xl font-normal text-white leading-[1.2]">
            The network the{" "}
            <span className="italic text-[#D4AF37]">Albanian diaspora</span>{" "}
            has been missing.
          </h2>
        </div>

        {/* Right: copy */}
        <div className="space-y-4 text-[15px] text-white/60 leading-[1.75]">
          <p>
            Albanians live across the world, thriving in every major industry, city, and
            profession. Yet for decades our communities have lacked a shared digital
            infrastructure — finding Albanian professionals, businesses, and organizations
            has relied entirely on fragmented social media and word of mouth.
          </p>
          <p className="text-white/80 font-medium">
            World Albanian Congress was built to change that.
          </p>
        </div>

      </div>
    </section>
  );
}
