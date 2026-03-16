import Link from "next/link";
import { Briefcase, MapPin, Building, Clock } from "lucide-react";

export const metadata = {
  title: "Job Board | World Albanian Congress",
  description: "Opportunities at Albanian-owned businesses and partnering organizations.",
};

const mockJobs = [
  {
    id: 1,
    title: "Senior Product Manager",
    company: "Illyrian Tech",
    location: "New York, NY",
    type: "Full-time",
    salary: "$140k - $180k",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Commercial Real Estate Agent",
    company: "Skanderbeg Realty",
    location: "Chicago, IL",
    type: "Contract",
    salary: "Commission Only",
    posted: "1 week ago",
  },
  {
    id: 3,
    title: "Operations Director",
    company: "Albanian Professionals Network",
    location: "Remote",
    type: "Part-time",
    salary: "$60k - $80k",
    posted: "3 days ago",
  }
];

export default function JobsPage() {
  return (
    <main className="min-h-screen pt-24 pb-20 bg-[var(--background)]">
      <div className="max-w-[75rem] mx-auto px-4">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="wac-eyebrow mb-2">Careers</div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-bold">
              Job <span className="text-[var(--accent)] italic font-light">Board</span>
            </h1>
            <p className="mt-4 text-lg opacity-70 max-w-2xl">
              Discover opportunities posted by Albanian-owned businesses, non-profits, and partnering organizations looking to hire within the diaspora.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/talent-bench" className="wac-button-secondary py-2">
                Scout Talent Instead
             </Link>
             <button className="wac-button-primary py-2 px-6">
                Post a Job
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="wac-card p-5">
              <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Filters</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold opacity-60 uppercase mb-2 block">Job Type</label>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Full-time</label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Part-time</label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Contract</label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Internship</label>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-white/10">
                    <label className="text-xs font-bold opacity-60 uppercase mb-2 block">Location Model</label>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> On-site</label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Hybrid</label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="accent-[var(--accent)]" /> Remote</label>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3 space-y-4">
             {mockJobs.map(job => (
               <Link href={`/jobs/${job.id}`} key={job.id} className="block wac-card p-6 hover:border-[var(--accent)] transition group">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                     <div>
                        <h2 className="text-xl font-bold mb-1 group-hover:text-[var(--accent)] transition">{job.title}</h2>
                        <div className="text-sm opacity-80 flex items-center gap-2 mb-4">
                           <Building className="w-4 h-4" />
                           {job.company}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                           <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-white/5 border border-white/10">
                              <MapPin className="w-3.5 h-3.5 opacity-70" /> {job.location}
                           </span>
                           <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-white/5 border border-white/10">
                              <Briefcase className="w-3.5 h-3.5 opacity-70" /> {job.type}
                           </span>
                           <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {job.salary}
                           </span>
                        </div>
                     </div>
                     <div className="flex flex-col justify-between items-start sm:items-end">
                        <span className="flex items-center gap-1.5 text-xs opacity-50 mb-4 sm:mb-0">
                           <Clock className="w-3.5 h-3.5" /> {job.posted}
                        </span>
                        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider group-hover:underline">
                           View Roles →
                        </span>
                     </div>
                  </div>
               </Link>
             ))}
          </div>

        </div>
      </div>
    </main>
  );
}
