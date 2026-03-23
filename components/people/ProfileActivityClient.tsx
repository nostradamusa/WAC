"use client";

import { useState } from "react";
import Link from "next/link";
import { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import { ArrowLeft, Activity, Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

type FilterTab = "All" | "Posts" | "Comments" | "Replies";

export default function ProfileActivityClient({ profile }: { profile: EnrichedDirectoryPerson }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  
  const displayName = profile.full_name || profile.username || "WAC Member";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
    
  // High-fidelity Mock Data for demonstrating the 'View All' timeline experience.
  const mockActivities = [
    {
      id: "1",
      type: "comment",
      timestamp: "2h",
      content: "Incredible insights on the emerging tech scene in the Balkans. Looking forward to seeing this ecosystem grow and collaborating with the local founders. 🚀",
      stats: { likes: 12, replies: 3, reposts: 0 },
      parent_post: {
        author: "Sarah Berisha",
        snippet: "Just published my Q3 report on tech investments in Tirana and Prishtina. The growth in seed-stage startups is up 45% YOY. 📈"
      }
    },
    {
      id: "2",
      type: "post",
      timestamp: "1d",
      content: "Just wrapped up an amazing panel on Diaspora Networking in NYC. If you missed it, the key takeaway was the absolute necessity of building bridges rather than silos. Our community's strength lies in our interconnectivity.\n\nThanks to everyone who came out! Let's keep the momentum going.",
      stats: { likes: 148, replies: 24, reposts: 5 }
    },
    {
      id: "3",
      type: "reply",
      timestamp: "3d",
      content: "Completely agree with this assessment. The regulatory hurdles are easing up.",
      stats: { likes: 4, replies: 0, reposts: 0 },
      parent_post: {
        author: "Drilon Hoxha",
        snippet: "The real estate market in Albania is shifting towards more sustainable development practices, finally."
      }
    },
    {
      id: "4",
      type: "post",
      timestamp: "1w",
      content: "Looking forward to attending the WAC Global Summit next month. Who else is going? Would love to organize a small mixer for professionals in the software space.",
      stats: { likes: 89, replies: 42, reposts: 2 }
    }
  ];

  const filteredActivities = mockActivities.filter(a => {
    if (activeTab === "All") return true;
    if (activeTab === "Posts" && a.type === "post") return true;
    if (activeTab === "Comments" && a.type === "comment") return true;
    if (activeTab === "Replies" && (a.type === "reply" || a.type === "comment")) return true;
    return false;
  });

  return (
    <div className="w-full">
      {/* ── HEADER AREA ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 pt-5 pb-2 px-4 sm:px-6">
        
        {/* Top Nav Row */}
        <div className="flex items-center gap-4 mb-6">
           <Link href={`/people/${profile.username}`} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors" title="Back to profile">
              <ArrowLeft size={18} strokeWidth={2.5} />
           </Link>
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/[0.08] border border-rose-500/[0.15]">
               <Activity size={16} className="text-rose-400" strokeWidth={2.5} />
             </div>
             <h1 className="font-serif text-[18.5px] font-normal text-white leading-none">
                The <span className="italic text-rose-400">Pulse</span>
             </h1>
           </div>
        </div>

        {/* Profile Context Strip */}
        <div className="flex items-center gap-3.5 mb-6 px-1">
           <div className="w-[52px] h-[52px] rounded-full overflow-hidden bg-[#151515] border-2 border-white/10 shadow-md shrink-0">
             {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[15px] font-bold text-[#b08d57]">{initials}</div>}
           </div>
           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                 <h2 className="text-[17px] font-bold text-white tracking-tight truncate">{displayName}</h2>
                 {profile.is_verified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-[14.5px] text-white/50 font-medium truncate">
                 {profile.headline || profile.current_title || "Professional"}
              </p>
           </div>
        </div>
        
        {/* Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
           {(["All", "Posts", "Comments", "Replies"] as FilterTab[]).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-[14px] font-bold whitespace-nowrap transition-all border ${
                  activeTab === tab 
                  ? "bg-white text-black border-white shadow-md" 
                  : "bg-transparent text-white/60 border-white/10 hover:bg-white/5 hover:text-white"
                }`}
              >
                 {tab}
              </button>
           ))}
        </div>
      </div>

      {/* ── FEED LIST ───────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-6 flex flex-col">
        {filteredActivities.length === 0 ? (
           <div className="py-20 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/20">
                 <Activity size={24} />
              </div>
              <h3 className="text-[17px] font-bold text-white mb-2">No active signal yet</h3>
              <p className="text-[14.5px] text-white/40 max-w-sm mx-auto">
                 When {displayName} posts, comments, or replies on The Pulse, their activity will appear here.
              </p>
           </div>
        ) : (
           filteredActivities.map((item, idx) => {
             const isLast = idx === filteredActivities.length - 1;
             
             return (
               <div key={item.id} className="relative flex gap-3 sm:gap-4 pb-8 sm:pb-10 group cursor-pointer w-full animate-in fade-in duration-500" style={{ animationFillMode: "both", animationDelay: `${idx * 100}ms`}}>
                  {/* Threads Style Vertical Anchor Line */}
                  {!isLast && (
                     <div className="absolute top-[48px] bottom-0 left-[20px] sm:left-[24px] w-[1.5px] bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors" />
                  )}
                  
                  {/* Avatar Column */}
                  <div className="flex flex-col shrink-0 z-10 items-center w-10 sm:w-12">
                     <Link href={`/people/${profile.username}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-[#151515] border border-white/10 shadow-sm shrink-0 transition-transform hover:scale-105 active:scale-95">
                       {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-[#b08d57]">{initials}</div>}
                     </Link>
                  </div>
                  
                  {/* Content Column */}
                  <div className="flex-1 w-full min-w-0 pb-1">
                     {/* Identity & Time */}
                     <div className="flex items-center mb-0.5">
                        <Link href={`/people/${profile.username}`} className="font-bold text-[15.5px] text-white hover:underline flex items-center gap-1.5 mr-auto">
                           {displayName}
                           {profile.is_verified && <VerifiedBadge size="sm" />}
                        </Link>
                        <span className="text-[13.5px] text-white/40 font-medium whitespace-nowrap">{item.timestamp}</span>
                     </div>
                     
                     {/* Activity Label */}
                     <div className="text-[13px] font-bold text-[#b08d57] mb-2.5 flex items-center gap-1.5">
                        {item.type === "post" && "Posted on The Pulse"}
                        {item.type === "comment" && "Commented on a post"}
                        {item.type === "reply" && "Replied to a thread"}
                     </div>

                     {/* Parent Context Block (If Reply/Comment) */}
                     {item.parent_post && (
                        <div className="mb-3.5 pl-3 sm:pl-4 border-l-2 border-white/10 relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/[0.02] before:to-transparent before:-z-10 py-1.5 rounded-r-lg">
                           <div className="text-[13px] font-bold text-white/70 mb-0.5">{item.parent_post.author}</div>
                           <p className="text-[14px] text-white/40 leading-relaxed line-clamp-2 italic pr-2">"{item.parent_post.snippet}"</p>
                        </div>
                     )}

                     {/* Primary Content Body */}
                     <p className="text-[15.5px] text-white/90 leading-relaxed font-normal mb-3.5 whitespace-pre-wrap break-words pr-2">
                        {item.content}
                     </p>
                     
                     {/* Interaction Anchor Row */}
                     <div className="flex items-center gap-6 sm:gap-8 text-white/40">
                        <button className="hover:text-red-400 hover:bg-red-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><Heart size={18} strokeWidth={2}/> <span className="text-[12.5px] font-semibold">{item.stats.likes}</span></button>
                        <button className="hover:text-blue-400 hover:bg-blue-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><MessageCircle size={18} strokeWidth={2}/> <span className="text-[12.5px] font-semibold">{item.stats.replies}</span></button>
                        <button className="hover:text-green-400 hover:bg-green-500/10 p-1.5 -ml-1.5 rounded-full transition-colors flex items-center gap-1.5"><Repeat2 size={18} strokeWidth={2}/> {item.stats.reposts > 0 ? <span className="text-[12.5px] font-semibold">{item.stats.reposts}</span> : null}</button>
                        <button className="hover:text-white hover:bg-white/10 p-1.5 -ml-1.5 rounded-full transition-colors"><Send size={18} strokeWidth={2}/></button>
                     </div>
                  </div>
               </div>
             )
           })
        )}
      </div>

    </div>
  );
}
