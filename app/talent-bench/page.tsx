import Link from "next/link";
import { Users, Code, LineChart, Megaphone, ShieldCheck, MapPin, Briefcase } from "lucide-react";

export const metadata = {
  title: "Talent Bench | World Albanian Congress",
  description: "Scout top Albanian talent actively open to new opportunities.",
};

const mockTalent = [
  {
    id: 1,
    name: "Ermal Hoxha",
    initials: "EH",
    title: "Full Stack Engineer",
    location: "Chicago, IL",
    skills: ["React", "Node.js", "PostgreSQL"],
    lookingFor: "Senior Roles, Tech Lead",
    openToRelocate: true,
  },
  {
    id: 2,
    name: "Blerina Leka",
    initials: "BL",
    title: "Marketing Director",
    location: "New York, NY",
    skills: ["B2B SaaS", "Growth Strategy", "SEO"],
    lookingFor: "VP Marketing, Director",
    openToRelocate: false,
  },
  {
    id: 3,
    name: "Agron Kastrati",
    initials: "AK",
    title: "Financial Analyst",
    location: "London, UK",
    skills: ["Financial Modeling", "M&A", "Excel"],
    lookingFor: "Private Equity, IB Associate",
    openToRelocate: true,
  }
];

export default function TalentBenchPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-[var(--background)]">
      <div className="max-w-[75rem] mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="wac-eyebrow mb-2">Recruiting</div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-bold">
              Talent <span className="text-[var(--accent)] italic font-light">Bench</span>
            </h1>
            <p className="mt-4 text-lg opacity-70 max-w-2xl">
              A curated pool of WAC professionals who are actively looking for their next move. Review profiles and message candidates directly.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/jobs" className="wac-button-secondary py-2">
                View Job Board
             </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="wac-card p-5">
               <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Industries</h3>
               <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Technology & Software</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Finance & Real Estate</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Healthcare</label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Legal</label>
               </div>
            </div>

            <div className="wac-card p-5 bg-gradient-to-br from-[#111] to-[rgba(212,175,55,0.05)] border-[var(--accent)]/20">
               <h3 className="font-serif font-bold text-[var(--accent)] mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Hiring Partner</h3>
               <p className="text-xs opacity-70 leading-relaxed mb-4">
                  Verified organizations can access complete resumes and export candidate lists.
               </p>
               <button className="w-full py-2 rounded-full border border-[var(--accent)]/50 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors">
                  Apply for Access
               </button>
            </div>
          </div>

          {/* Talent Grid */}
          <div className="lg:col-span-3">
             <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {mockTalent.map(person => (
                  <div key={person.id} className="wac-card p-6 hover:border-[var(--accent)] transition">
                     <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center font-bold text-xl text-[var(--accent)]">
                           {person.initials}
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-green-400 border border-green-500/30 uppercase">
                          Open to Work
                        </span>
                     </div>
                     
                     <Link href="/directory" className="hover:underline">
                        <h2 className="text-xl font-bold">{person.name}</h2>
                     </Link>
                     <p className="text-sm opacity-80 mb-3">{person.title}</p>
                     
                     <div className="flex items-center gap-1.5 mb-4 text-xs opacity-60">
                        <MapPin className="w-3.5 h-3.5" /> {person.location}
                        {person.openToRelocate && " • Open to Relocate"}
                     </div>

                     <div className="space-y-3 pt-4 border-t border-white/10 mt-auto">
                        <div>
                           <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1.5">Top Skills</div>
                           <div className="flex flex-wrap gap-1.5">
                              {person.skills.map(skill => (
                                 <span key={skill} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] opacity-80">{skill}</span>
                              ))}
                           </div>
                        </div>
                        <div>
                           <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1">Target Roles</div>
                           <p className="text-xs opacity-80 font-medium text-[var(--accent)]">{person.lookingFor}</p>
                        </div>
                     </div>

                     <div className="mt-6 flex gap-2">
                        <Link href="/messages" className="flex-1 text-center py-2 bg-[var(--accent)] text-black font-bold text-sm rounded transition hover:bg-[#ffe17d]">
                           Message
                        </Link>
                        <Link href="/directory" className="flex-none px-4 py-2 border border-white/20 hover:border-white/50 bg-[rgba(255,255,255,0.02)] rounded text-sm font-bold transition">
                           Profile
                        </Link>
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}
