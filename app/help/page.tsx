"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Search, BookOpen, MessageCircle, ChevronDown } from "lucide-react";

const USER_GUIDE = [
  {
    title: "Setting up your profile",
    body: "Head to Settings → Profile to add your headline, bio, location, industry, and a profile photo. A complete profile increases your visibility in the Directory and signals credibility to other members.",
  },
  {
    title: "Finding people in the Directory",
    body: "Use the Directory tab to search by name, profession, industry, or location. Apply filters to narrow by skills, availability to mentor, open to hire, or region. Tap any card to view their full profile.",
  },
  {
    title: "Posting on the Pulse",
    body: "Tap the compose box at the top of the Pulse feed to write a post. You can add images or video, tag people with @mentions, and choose whether to share broadly or just to your followers.",
  },
  {
    title: "Creating and joining Events",
    body: "Go to the Events tab to browse upcoming gatherings or create your own. Set a title, cover photo, date, location, and description. Members can RSVP and the event will appear in their personal calendar.",
  },
  {
    title: "Groups and communities",
    body: "Groups let you bring together a focused circle of members — by profession, city, interest, or alumni network. You can create a group, invite members, post updates, and host group-specific events.",
  },
  {
    title: "Messaging other members",
    body: "Tap the message icon on any profile to start a direct conversation. You can send text, share posts, and exchange contact details in a private thread visible only to you and the recipient.",
  },
];

const FAQS = [
  {
    q: "Who can join the World Albanian Congress platform?",
    a: "The platform is open to all members of the global Albanian diaspora — regardless of country of residence or profession. If you identify with Albanian heritage or are a close ally of the community, you are welcome.",
  },
  {
    q: "Is my profile visible to the public?",
    a: "Only authenticated members can browse the Directory. Your profile is not indexed by search engines. You can also set your profile to private in Settings if you'd prefer not to appear in search results.",
  },
  {
    q: "How do I get a Verified badge?",
    a: "Verification is currently granted to notable public figures, WAC leadership, and recognized organizations. If you believe you qualify, reach out via the Contact page and our team will review your request.",
  },
  {
    q: "Can I represent a business or organization?",
    a: "Yes. After completing your personal profile you can create a business or organization page. These appear separately in the Directory and can post on the Pulse, host events, and manage members.",
  },
  {
    q: "What happens to my data if I delete my account?",
    a: "Deleting your account removes your profile from the Directory and all personally identifiable data from our active databases within 30 days. Content you have shared (posts, comments) may be anonymized rather than deleted.",
  },
  {
    q: "The platform is in Beta — what does that mean?",
    a: "Beta means we are actively developing and refining the platform. Some features may change or be unavailable. We rely on your feedback to improve — use the feedback button (bottom right) to report anything unexpected.",
  },
];

function Accordion({ items }: { items: { title?: string; q?: string; body?: string; a?: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex flex-col divide-y divide-white/[0.06]">
      {items.map((item, i) => {
        const heading = item.title ?? item.q ?? "";
        const body    = item.body ?? item.a ?? "";
        const isOpen  = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-4 text-left gap-4 group"
            >
              <span className={`text-[14px] font-semibold transition-colors ${isOpen ? "text-white" : "text-white/70 group-hover:text-white/90"}`}>
                {heading}
              </span>
              <ChevronDown
                size={15}
                strokeWidth={2}
                className={`shrink-0 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#b08d57]" : ""}`}
              />
            </button>
            {isOpen && (
              <p className="text-[13.5px] text-white/50 leading-relaxed pb-4 pr-6 animate-in fade-in duration-150">
                {body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-32 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <div className="wac-card p-8 sm:p-12">
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight mb-2">
            <span className="italic font-light opacity-90 text-[#b08d57]">Help</span>
            <span className="text-white"> & Support</span>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed mt-2">
            Everything you need to get the most out of World Albanian Congress.
          </p>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/contact" className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <div className="w-10 h-10 rounded-full bg-[#b08d57]/10 flex items-center justify-center text-[#b08d57] shrink-0">
                <Mail size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">Contact Support</h3>
                <p className="text-xs text-white/40 mt-0.5">Send us a message directly</p>
              </div>
            </Link>
            <Link href="/directory" className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                <Search size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">Explore the Directory</h3>
                <p className="text-xs text-white/40 mt-0.5">Find people, businesses & orgs</p>
              </div>
            </Link>
          </div>
        </div>

        {/* User Guide */}
        <div className="wac-card p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen size={16} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white">User Guide</h2>
              <p className="text-xs text-white/40 mt-0.5">How to use each part of the platform</p>
            </div>
          </div>
          <Accordion items={USER_GUIDE} />
        </div>

        {/* Community FAQs */}
        <div className="wac-card p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageCircle size={16} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white">Community FAQs</h2>
              <p className="text-xs text-white/40 mt-0.5">Common questions from our members</p>
            </div>
          </div>
          <Accordion items={FAQS} />
        </div>

        {/* Footer nav */}
        <div className="pt-2 pb-8">
          <Link href="/vision" className="inline-flex items-center text-[#b08d57]/70 hover:text-[#b08d57] transition text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="m15 18-6-6 6-6" /></svg>
            Back
          </Link>
        </div>

      </div>
    </div>
  );
}
