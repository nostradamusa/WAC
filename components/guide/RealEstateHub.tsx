"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import PremiumSelect from "@/components/ui/PremiumSelect";

type TabType = "properties" | "professionals" | "services";

export default function RealEstateHub() {
  const [activeTab, setActiveTab] = useState<TabType>("properties");
  const [sortOrder, setSortOrder] = useState("newest");

  return (
    <div className="w-full">
      {/* Dynamic Hero */}
      <section className="relative px-6 py-20 lg:py-32 overflow-hidden border-b border-white/5 bg-[#1b1714]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />
          {/* Subtle architectural background pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-[90rem] flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[var(--accent)] font-semibold text-xs tracking-widest uppercase mb-6 bg-[var(--accent)]/10 px-3 py-1.5 rounded-full border border-[var(--accent)]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              Diaspora Real Estate
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif tracking-tight mb-6">
              Invest in your <span className="text-[var(--accent)] italic font-light opacity-90">Homeland</span>.
            </h1>
            <p className="text-lg opacity-70 leading-relaxed mb-8">
              The premier marketplace connecting the Albanian diaspora with local properties, trusted native agents, and reliable home maintenance services.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <input 
                type="text" 
                placeholder="Search cities, agencies, or services (e.g., 'Tirana', 'Cleaners')" 
                className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-white placeholder-white/40 focus:outline-none focus:border-[var(--accent)] focus:bg-white/10 font-light transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent)] text-black px-6 py-2 rounded-full font-bold text-sm tracking-wide hover:bg-[#b08d24] transition-colors">
                Search
              </button>
            </div>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4 relative z-10 w-full max-w-md">
             {/* Decorative UI elements hinting at properties */}
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl -rotate-2 transform translate-y-4">
                 <div className="h-32 bg-white/10 rounded-xl overflow-hidden relative">
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-[10px] font-bold tracking-wider rounded">TIRANA, AL</div>
                 </div>
                 <h4 className="font-bold text-sm">Modern City Center Apt</h4>
                 <div className="text-[var(--accent)] font-serif text-lg">€145,000</div>
             </div>
             <div className="bg-white/5 border border-[var(--accent)]/30 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl rotate-3 shadow-[0_0_30px_rgba(176,141,87,0.1)]">
                 <div className="h-32 bg-white/10 rounded-xl overflow-hidden relative">
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 text-[10px] font-bold tracking-wider rounded">PRISHTINA, KS</div>
                 </div>
                 <h4 className="font-bold text-sm">Luxury Villa in Bregu</h4>
                 <div className="text-[var(--accent)] font-serif text-lg">€320,000</div>
             </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 py-8 border-b border-white/5 sticky top-16 bg-[#0a0a0a]/90 backdrop-blur-xl z-30">
        <div className="mx-auto max-w-[90rem]">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
             {[
               { id: "properties", label: "Featured Properties", icon: "Building" },
               { id: "professionals", label: "Agents & Brokers", icon: "Users" },
               { id: "services", label: "Home Services", icon: "Wrench" }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as TabType)}
                 className={`px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all whitespace-nowrap ${
                   activeTab === tab.id
                     ? "bg-[var(--accent)] text-black"
                     : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="px-6 py-16 mx-auto max-w-[90rem] min-h-[50vh]">
         {activeTab === "properties" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-serif">Latest Listings</h2>
               <PremiumSelect
                 value={sortOrder}
                 onChange={setSortOrder}
                 options={[
                   { value: "newest", label: "Newest First" },
                   { value: "price_asc", label: "Price: Low to High" },
                   { value: "price_desc", label: "Price: High to Low" },
                 ]}
                 className="min-w-[13rem]"
                 triggerClassName="rounded-full border-white/20 bg-transparent px-4 py-2 text-sm"
                 align="right"
               />
             </div>
             
             {/* Property Grid Placeholder */}
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Link href={`/guide/real-estate/${i}`} key={i} className="wac-card group block overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300">
                    <div className="h-48 bg-white/5 relative">
                       <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xl px-2 py-1 text-xs font-bold rounded flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> For Sale
                       </div>
                       <div className="absolute top-3 right-3 bg-[var(--accent)] text-black px-2 py-1 text-xs font-bold rounded flex items-center gap-1">
                         Verified
                       </div>
                    </div>
                    <div className="p-5">
                       <div className="text-[var(--accent)] font-serif text-2xl mb-1">€1{i}5,000</div>
                       <h3 className="text-lg font-bold mb-2">Beautiful Coastal Apartment {i}</h3>
                       <p className="text-sm opacity-60 mb-4 flex items-center gap-1">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                         Vlorë, Albania
                       </p>
                       <div className="flex gap-4 text-sm opacity-80 pt-4 border-t border-white/10">
                         <span className="flex items-center gap-1 border-r border-white/10 pr-4"><strong>2</strong> Beds</span>
                         <span className="flex items-center gap-1 border-r border-white/10 pr-4"><strong>1</strong> Bath</span>
                         <span className="flex items-center gap-1"><strong>85</strong> m²</span>
                       </div>
                    </div>
                  </Link>
                ))}
             </div>
           </div>
         )}

         {activeTab === "professionals" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
             <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
             </div>
             <h2 className="text-3xl font-serif mb-4">The Agent Network</h2>
             <p className="text-lg opacity-70 max-w-2xl mx-auto mb-8">
               A highly-curated directory of real estate brokers, legal experts, and developers operating across Albania, Kosovo, Montenegro, and Macedonia.
             </p>
             <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-colors">
               Apply as a Professional
             </button>
           </div>
         )}

         {activeTab === "services" && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-20">
             <div className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)] mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
             </div>
             <h2 className="text-3xl font-serif mb-4">Homeland Maintenance</h2>
             <p className="text-lg opacity-70 max-w-2xl mx-auto mb-8">
               Leaving your property vacant for 9 months out of the year? Connect with trusted locals offering cleaning, maintenance, landscaping, and key-holding services.
             </p>
             <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold transition-colors">
               List Your Services
             </button>
           </div>
         )}
      </section>
    </div>
  );
}
