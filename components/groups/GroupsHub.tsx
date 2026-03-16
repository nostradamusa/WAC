"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import React from "react";
import WacSelect from "@/components/ui/WacSelect";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  CalendarDays,
  Users,
  BookOpen,
  Plane,
  Briefcase,
  GraduationCap,
  Baby,
  Hash,
  User,
} from "lucide-react";

type HubTab = "teens" | "parents" | "careers" | "travelers";

export default function GroupsHub() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<HubTab>("teens");

  // Sync state with URL parameter on mount/change
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam &&
      ["teens", "parents", "careers", "travelers"].includes(tabParam)
    ) {
      setActiveTab(tabParam as HubTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: HubTab) => {
    setActiveTab(tab);
    // Update the URL without a full page reload so it stays deep-linkable
    router.push(`/groups?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="w-full bg-[var(--background)] py-8 relative z-20">
      <div className="max-w-[80rem] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: NAVIGATION (Sticky) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 wac-card p-4 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 px-3">
              Network Groups
            </h3>
            
            <button
              onClick={() => handleTabChange("teens")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "teens"
                  ? "bg-slate-500/10 text-slate-300"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Emerging Talent
            </button>
            
            <button
              onClick={() => handleTabChange("parents")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "parents"
                  ? "bg-purple-500/10 text-purple-300"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Baby className="w-4 h-4" />
              Family Roots
            </button>
            
            <button
              onClick={() => handleTabChange("careers")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "careers"
                  ? "bg-blue-500/10 text-blue-300"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Up and Comers
            </button>

            <button
              onClick={() => handleTabChange("travelers")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "travelers"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Plane className="w-4 h-4" />
              Travelers
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION (Grid/Wrap Layout) */}
        <div className="lg:hidden col-span-1 pb-2 border-b border-white/5 space-y-2">
          {/* 2x2 Grid for sub-hubs */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleTabChange("teens")} className={`flex justify-center items-center gap-2 px-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === "teens" ? "bg-slate-500/15 text-slate-300 border border-slate-500/50" : "bg-[#111] border border-white/10 text-white/70 hover:bg-white/5"}`}><GraduationCap className="w-3.5 h-3.5" /> Emerging</button>
            <button onClick={() => handleTabChange("parents")} className={`flex justify-center items-center gap-2 px-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === "parents" ? "bg-purple-500/15 text-purple-300 border border-purple-500/50" : "bg-[#111] border border-white/10 text-white/70 hover:bg-white/5"}`}><Baby className="w-3.5 h-3.5" /> Family</button>
            <button onClick={() => handleTabChange("careers")} className={`flex justify-center items-center gap-2 px-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === "careers" ? "bg-blue-500/15 text-blue-300 border border-blue-500/50" : "bg-[#111] border border-white/10 text-white/70 hover:bg-white/5"}`}><Briefcase className="w-3.5 h-3.5" /> Careers</button>
            <button onClick={() => handleTabChange("travelers")} className={`flex justify-center items-center gap-2 px-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === "travelers" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/50" : "bg-[#111] border border-white/10 text-white/70 hover:bg-white/5"}`}><Plane className="w-3.5 h-3.5" /> Travelers</button>
          </div>
        </div>

        {/* CENTER COLUMN: MAIN CONTENT STAGE */}
        <div className="col-span-1 lg:col-span-6">
          {activeTab === "teens" && <TeensHub />}
          {activeTab === "parents" && <ParentsHub />}
          {activeTab === "careers" && <CareersHub />}
          {activeTab === "travelers" && <TravelersHub />}
        </div>

        {/* RIGHT COLUMN: DISCOVER (Sticky) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <div className="wac-card p-5">
              <h3 className="font-serif font-bold text-lg text-[var(--accent)] flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4" />
                Trending
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs opacity-60">Global Summit 2026</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">#WAC2026 London Registration Open</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Mentorship Network</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">Spring Cohort Applications Live</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Tech Diaspora</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">Albanian AI Startup Funding Round</div>
                </div>
              </div>
            </div>

            <div className="wac-card p-5 bg-gradient-to-br from-[#111] to-[rgba(212,175,55,0.05)] border-[var(--accent)]/20">
              <h3 className="font-serif font-bold text-[var(--accent)] mb-2">Build Your Network</h3>
              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                Connect with professionals sharing your roots. Manage your profile to get discovered.
              </p>
              <Link href="/profile" className="block w-full text-center py-2 rounded-full border border-[var(--accent)]/50 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors">
                Update Profile
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TEENS HUB
// ----------------------------------------------------------------------
function TeensHub() {
  const [teenInterest, setTeenInterest] = useState("College Prep");

  const interestOptions = [
    { value: "College Prep", label: "College Prep" },
    { value: "Trade / Vocational", label: "Trade / Vocational" },
    { value: "Entrepreneurship", label: "Entrepreneurship" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 border-l-4 border-[var(--accent)] pl-6">
        <h2 className="text-3xl font-extrabold mb-3">
          College Prep & Future Planning
        </h2>
        <p className="text-lg opacity-70 max-w-2xl">
          Whether you’re aiming for a 4-year university, a trade school, or
          exploring your options — we have mentors, timelines, and resources to
          help you get there with your Albanian identity front and center.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--accent)]" />
              Your College Roadmap
            </h3>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border)] before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[var(--background)] bg-[var(--accent)] text-white text-xs font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  9
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]">
                  <h4 className="font-bold mb-1">
                    Freshman Year — Build Your Foundation
                  </h4>
                  <p className="text-sm opacity-70 leading-relaxed">
                    Focus on grades and join at least 2 extracurriculars. Start
                    exploring what subjects interest you. Attend a WAC college
                    info session.
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-[var(--background)] bg-[var(--foreground)]/20 text-[var(--foreground)] text-xs font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  10
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)]">
                  <h4 className="font-bold mb-1">
                    Sophomore Year — Explore & Test
                  </h4>
                  <p className="text-sm opacity-70 leading-relaxed">
                    Take a PSAT for practice. Research colleges online. Consider
                    a WAC-sponsored job shadow with an Albanian professional in
                    your field.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button className="text-[var(--accent)] font-bold text-sm uppercase tracking-wider hover:underline">
                View Full Roadmap →
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/directory?type=person&mentor=true"
              className="wac-card p-6 group hover:border-[var(--accent)] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold mb-2">Find a Mentor</h4>
              <p className="text-sm opacity-70">
                Connect with Albanian professionals in the industry you want to
                enter.
              </p>
            </Link>
            <div className="wac-card p-6 group cursor-not-allowed opacity-80">
              <div className="w-10 h-10 rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)] flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold mb-2">WAC Scholarships</h4>
              <p className="text-sm opacity-70">
                Annual scholarship for Albanian-American students.{" "}
                <span className="text-[var(--accent)]">Opens May 2026</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="wac-card border-[var(--accent)]/30 border p-6 relative z-20">
            <h3 className="font-serif italic text-xl mb-4 tracking-wide">
              Register a Teen
            </h3>
            <p className="text-sm opacity-70 mb-6">
              Register to receive updates, invites to teen events, and connect
              with advisors and tutors.
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                  Teen's Name
                </label>
                <input
                  type="text"
                  className="w-full bg-[var(--background)] border border-[var(--foreground)]/20 rounded p-3 text-sm focus:border-[var(--accent)] focus:outline-none transition-colors"
                  placeholder="First Last"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-60">
                  Interests
                </label>
                <WacSelect
                  options={interestOptions}
                  value={teenInterest}
                  onChange={setTeenInterest}
                />
              </div>
              <button
                type="button"
                className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 font-bold uppercase tracking-wider text-sm p-3 rounded transition-colors"
              >
                Register Now
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 opacity-80">
                <CalendarDays className="w-4 h-4" /> Upcoming Teen Events
              </h3>
              <Link
                href="/events"
                className="text-xs text-[var(--accent)] hover:underline"
              >
                View Calendar
              </Link>
            </div>
            <div className="space-y-3">
              <div className="p-4 border border-[var(--foreground)]/10 rounded-lg hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm">SAT Prep Boot Camp</h4>
                  <span className="text-[var(--accent)] text-xs font-bold">
                    Mar 22
                  </span>
                </div>
                <p className="text-xs opacity-60">Hosted by AACC Riverdale</p>
              </div>
              <div className="p-4 border border-[var(--foreground)]/10 rounded-lg hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm">College Essay Workshop</h4>
                  <span className="text-[var(--accent)] text-xs font-bold">
                    Apr 05
                  </span>
                </div>
                <p className="text-xs opacity-60">Virtual — Zoom</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PARENTS HUB
// ----------------------------------------------------------------------
function ParentsHub() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 border-l-4 border-purple-600 pl-6">
        <h2 className="text-3xl font-extrabold mb-3">Parent Connect</h2>
        <p className="text-lg opacity-70 max-w-2xl">
          Raising the next generation. Connect with other Albanian parents, find
          local Shkolla Shqipe programs, daycares, and organize weekend
          playdates.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="wac-card p-6 group hover:border-purple-500 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Shkolla Shqipe</h3>
          <p className="text-sm opacity-70 mb-4">
            Find weekend Albanian language schools and cultural programs for
            children ages 4-12 in your area.
          </p>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest group-hover:underline">
            Find a School →
          </span>
        </div>
        <div className="wac-card p-6 group hover:border-purple-500 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Baby className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Daycare Network</h3>
          <p className="text-sm opacity-70 mb-4">
            A directory of Albanian-owned daycares and childcare providers for
            working parents.
          </p>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest group-hover:underline">
            Search Map →
          </span>
        </div>
        <div className="wac-card p-6 group hover:border-purple-500 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2">Regional Playdates</h3>
          <p className="text-sm opacity-70 mb-4">
            Join local WhatsApp groups to coordinate weekend park meetups and
            family dinners.
          </p>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest group-hover:underline">
            Join a Group →
          </span>
        </div>
      </div>

      <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-3">Family Events Calendar</h3>
          <p className="opacity-70 text-sm mb-6 max-w-lg">
            See all kid-friendly events, cultural festivals, and language school
            registrations across multiple organizations in one place.
          </p>
          <button className="bg-purple-600 text-white hover:bg-purple-700 font-bold uppercase tracking-wider text-sm px-6 py-3 rounded transition-colors">
            Subscribe to Parent Calendar
          </button>
        </div>
        <div className="w-full md:w-80 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4 border-b border-[var(--foreground)]/10 pb-4">
            <div className="bg-purple-500 text-white text-center rounded overflow-hidden w-12 pb-1 shrink-0">
              <div className="text-[10px] uppercase font-bold bg-white/20 py-0.5">
                Apr
              </div>
              <div className="text-lg font-bold">12</div>
            </div>
            <div>
              <h4 className="font-bold text-sm">Spring Family Picnic</h4>
              <p className="text-xs opacity-60">Van Cortlandt Park, NY</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 text-white text-center rounded overflow-hidden w-12 pb-1 shrink-0">
              <div className="text-[10px] uppercase font-bold bg-white/20 py-0.5">
                May
              </div>
              <div className="text-lg font-bold">03</div>
            </div>
            <div>
              <h4 className="font-bold text-sm">Shkolla Shqipe Grad</h4>
              <p className="text-xs opacity-60">AACC Riverdale</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// CAREERS HUB
// ----------------------------------------------------------------------
function CareersHub() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 border-l-4 border-blue-600 pl-6">
        <h2 className="text-3xl font-extrabold mb-3">Career Growers</h2>
        <p className="text-lg opacity-70 max-w-2xl">
          For professionals in their 30s and 40s scaling their impact. Expand
          your network, find investment opportunities, or give back by mentoring
          the next generation.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          <div className="wac-card p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:border-blue-500 transition-colors cursor-pointer">
            <div className="w-16 h-16 shrink-0 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">
                Albanian American Business Association
              </h3>
              <p className="text-sm opacity-70 mb-3">
                Join the premier network of Albanian corporate professionals and
                entrepreneurs. Access exclusive networking events and B2B
                directories.
              </p>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore AABA <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="wac-card p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center group hover:border-blue-500 transition-colors cursor-pointer">
            <div className="w-16 h-16 shrink-0 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Mentorship Program</h3>
              <p className="text-sm opacity-70 mb-3">
                You've made it. Now lay the ladder down. Opt-in to the WAC
                directory as "Open to Mentoring" to guide college students and
                recent grads.
              </p>
              <Link
                href="/profile"
                className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
              >
                Update Your Profile <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-6 h-full">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-4 opacity-80 flex items-center gap-2 border-b border-[var(--foreground)]/10 pb-3">
              <Briefcase className="w-4 h-4" /> Latest Opportunities
            </h3>

            <div className="space-y-4">
              <Link href="#" className="block group">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                  Board Seat Open
                </div>
                <h4 className="font-bold text-sm group-hover:text-blue-500 transition-colors">
                  WAC Strategy Council
                </h4>
                <p className="text-xs opacity-60 mt-1 line-clamp-2">
                  Seeking experienced executives to help guide the 2027 roadmap
                  for diaspora engagement.
                </p>
              </Link>
              <Link href="#" className="block group">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">
                  Investment Group
                </div>
                <h4 className="font-bold text-sm group-hover:text-blue-500 transition-colors">
                  Real Estate Syndicate: NYC
                </h4>
                <p className="text-xs opacity-60 mt-1 line-clamp-2">
                  Monthly meetup for commercial real estate investors looking to
                  pool resources.
                </p>
              </Link>
            </div>

            <button className="w-full mt-6 border border-blue-500 text-blue-500 hover:bg-blue-500/10 font-bold uppercase tracking-wider text-xs p-3 rounded transition-colors">
              View Job Board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// TRAVELERS HUB
// ----------------------------------------------------------------------
function TravelersHub() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-12 border-l-4 border-emerald-600 pl-6">
        <h2 className="text-3xl font-extrabold mb-3">
          Travelers & Summer Eagles
        </h2>
        <p className="text-lg opacity-70 max-w-2xl">
          Connect with the homeland. Whether you're a young adult experiencing
          the Balkans for the first time with OriginAL, or a retired "Summer
          Eagle" spending months back home.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="relative overflow-hidden rounded-xl border border-[var(--foreground)]/10 group cursor-pointer h-64">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-950"></div>
          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1542478421-4ea2e16c802f?q=80&w=1200')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              Age 18-24
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              OriginAL Birthright Trip
            </h3>
            <p className="text-sm text-white/80 line-clamp-2 pr-4">
              A free volunteer and cultural immersion trip to Albania and Kosovo
              for young diaspora adults.
            </p>
          </div>
        </div>

        <Link
          href="/guide/travel"
          className="relative overflow-hidden block rounded-xl border border-[var(--foreground)]/10 group cursor-pointer h-64"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900"></div>
          <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1590022216657-3f8ca622eff7?q=80&w=1200')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
            <div className="text-xs font-bold uppercase tracking-widest text-stone-300 mb-2">
              Cultural Hub
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Struga Basecamp Guide
            </h3>
            <p className="text-sm text-white/80 line-clamp-2 pr-4">
              The strategic travel guide for Albanian diaspora visiting the
              Balkans. Reach 4 countries from one lake stay.
            </p>
          </div>
        </Link>
      </div>

      <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
              <Plane className="w-5 h-5 text-emerald-500" />
              Summer Eagles Network
            </h3>
            <p className="text-sm opacity-70">
              For diaspora members spending 1-5 months in the Balkans each year.
            </p>
          </div>
          <button className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-colors shrink-0">
            Join the Network
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="font-bold text-sm">Property Management</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Connect with vetted local services to manage your apartment or
              house while you're back in the States.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm">Long-Stay Logistics</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Guides on banking, healthcare access, and residency permits for
              extended summer stays.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm">Local Meetups</h4>
            <p className="text-xs opacity-70 leading-relaxed">
              Weekly coffee gatherings in Tirana, Prishtina, and Struga
              organized specifically for diaspora visitors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
