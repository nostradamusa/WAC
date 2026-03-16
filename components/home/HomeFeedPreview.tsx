import Link from "next/link";
import { Baby, Rocket, ArrowRight, TrendingUp } from "lucide-react";

export default function HomeFeedPreview() {
  return (
    <section
      id="next-generation"
      className="py-24 px-4 relative bg-[var(--background)]"
    >
      <div className="mx-auto max-w-5xl relative z-10 bg-[#1A1A1A]/50 backdrop-blur-xl p-8 md:p-12 mb-8 overflow-hidden border border-[var(--border)] rounded-[3rem]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif tracking-tight sm:text-6xl mb-4 text-white">
            The{" "}
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Next
            </span>{" "}
            Generation
          </h2>
          <p className="text-xl opacity-70 max-w-3xl mx-auto leading-relaxed text-balance">
            A dedicated pipeline supporting our community from their first Albanian words to fluency in corporate jargon.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10 max-w-5xl mx-auto">
          {/* Stage 1 */}
          <Link href="/groups?tab=family" className="wac-card p-8 flex flex-col relative group hover:border-purple-500/50 transition-all text-left">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Baby className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white group-hover:text-purple-400 transition-colors">Early Years & Family</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-8 flex-1">
              Building the foundation. Find weekend Shkolla Shqip programs, parenting resources, toy exchanges, and early childhood playgroups.
            </p>
            <span className="flex items-center gap-2 text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors uppercase tracking-wider mt-auto">
              Explore Family <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Stage 2 */}
          <Link href="/groups?tab=future-pathways" className="wac-card p-8 flex flex-col relative group hover:border-[#D4AF37]/50 transition-all text-left">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white group-hover:text-[#D4AF37] transition-colors">Future Pathways</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-8 flex-1">
              Charting the course from high school to career. Access dynamic mentorship, trade internships, and connect with Industry Heavyweights to accelerate your trajectory.
            </p>
            <span className="flex items-center gap-2 text-sm font-bold text-[#D4AF37] group-hover:text-[#F3E5AB] transition-colors uppercase tracking-wider mt-auto">
              Accelerate Trajectory <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Stage 3 */}
          <Link href="/directory" className="wac-card p-8 flex flex-col relative group hover:border-emerald-500/50 transition-all text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl mb-3 text-white group-hover:text-emerald-400 transition-colors">Industry Heavyweights</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-8 flex-1">
              Peer-to-peer elite networking. Connecting the heavy hitters with each other to collaborate, share complex skills, and build syndicates.
            </p>
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider mt-auto">
              Enter The Directory <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
