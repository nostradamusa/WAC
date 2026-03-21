import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Homeland Living & Real Estate | World Albanian Congress",
  description:
    "The ultimate guide for the diaspora: visiting, relocating, raising families, and investing in homeland real estate.",
};

export default function LivingHubPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#151311] via-[#151311]/80 to-[#151311] z-10" />
          <img
            src="/images/wac-hero-bg.jpg" // We can replace this with a beautiful landscape of the homeland
            alt="Homeland Landscape"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[90rem]">
          <div className="max-w-3xl">
            <span className="wac-eyebrow mb-4 block">
              Life Stages & Resources
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif tracking-tight mb-6">
              The <span className="text-[#b08d57] italic font-light opacity-90">Homeland</span> Living Hub
            </h1>
            <p className="text-lg sm:text-xl opacity-70 leading-relaxed mb-10 max-w-2xl">
              Whether you are visiting for the summer, planning a permanent relocation, raising children in the diaspora, or investing in real estate back home. This is your ultimate blueprint.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="px-6 py-16 mx-auto max-w-[90rem]">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Travel & Logistics */}
          <Link
            href="/guide/travel"
            className="wac-card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 block text-left"
          >
            <div className="h-48 w-full bg-[#1b1714] relative overflow-hidden">
               {/* Placeholder for an image */}
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1b1714] z-10" />
               <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity group-hover:scale-105 duration-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L2.5 8l6.4 3.9L7 16l-3.2-.8-1.4 1.4 4.3 1.9 1.9 4.3 1.4-1.4-.8-3.2 4.1-1.9 3.9 6.4c.4.3.9.4 1.3.1l1.2-1.2c.4-.2.7-.6.6-1.1z"/></svg>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm tracking-widest uppercase mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Visiting Home
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors">
                The Travel Guide
              </h3>
              <p className="text-sm opacity-70 leading-relaxed mb-6 flex-1">
                Strategic blueprints for visiting the Balkans. Skip the tourist traps. Find the best hubs, logistics, native experiences, and hidden gems.
              </p>
              <div className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors flex items-center gap-2 mt-auto">
                Read the guide <span className="text-[var(--accent)] text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>

          {/* Card 2: Diaspora Real Estate & Homes */}
          <Link
            href="/guide/real-estate"
            className="wac-card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 block text-left border-[var(--accent)]/30 relative"
          >
            <div className="absolute top-4 right-4 z-20 bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">New Hub</div>
            <div className="h-48 w-full bg-[#1b1714] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1b1714] z-10" />
               <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity group-hover:scale-105 duration-700 text-[var(--accent)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm tracking-widest uppercase mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M17 2v20"/><path d="M7 12h0"/><path d="M7 16h0"/><path d="M7 8h0"/><path d="M22 22V10l-5-5L2 15v7"/></svg>
                Zillow for Albanians
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors">
                Diaspora Real Estate
              </h3>
              <p className="text-sm opacity-70 leading-relaxed mb-6 flex-1">
                Browse properties back home or internationally. Connect directly with trusted local agents, overseas buyers, sellers, and specialized home care services.
              </p>
              <div className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors flex items-center gap-2 mt-auto">
                Explore listings <span className="text-[var(--accent)] text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>

          {/* Card 3: Roots & Parenting */}
          <Link
            href="/guide/living"
            className="wac-card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 block text-left"
          >
            <div className="h-48 w-full bg-[#1b1714] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1b1714] z-10" />
               <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity group-hover:scale-105 duration-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
               </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-sm tracking-widest uppercase mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 14-3.5-3.5a2 2 0 0 0-2.8 0L3 22"/><path d="m14 21 7-7"/><path d="M19 19 8 8"/><path d="m2 22 7-7"/><path d="M2 2 22 22"/></svg>
                Next Generation
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-[var(--accent)] transition-colors">
                Roots & Parenting
              </h3>
              <p className="text-sm opacity-70 leading-relaxed mb-6 flex-1">
                A highly-curated directory of Shkolla Shqip (Albanian schools), local playgroups, mentorship programs, and resources for raising Albanian children abroad.
              </p>
              <div className="text-sm font-bold text-white group-hover:text-[var(--accent)] transition-colors flex items-center gap-2 mt-auto">
                Discover resources <span className="text-[var(--accent)] text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>

        </div>
      </section>
    </main>
  );
}
