"use client";

import { useState } from "react";
import { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Briefcase,
  UserPlus,
  Share2,
  Globe,
  Award,
  Link as LinkIcon,
  Calendar,
  X,
  MessageCircle,
} from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FollowButton from "@/components/ui/FollowButton";

export default function PublicProfile({ profile }: { profile: EnrichedDirectoryPerson }) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus("submitting");
    setTimeout(() => {
      setBookingStatus("success");
      setTimeout(() => {
        setIsBookingModalOpen(false);
        setBookingStatus("idle");
      }, 3000);
    }, 1500);
  };
  const displayName = profile.full_name || profile.username || "WAC Member";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  // Determine Location
  const locationParts = [profile.city, profile.state, profile.country]
    .map((p) => p?.trim())
    .filter(Boolean);
  const locationString = locationParts.join(", ");

  // Roots
  const rootsParts = [profile.ancestry_village, profile.ancestry_city, profile.ancestry_country]
    .map((p) => p?.trim())
    .filter(Boolean);
  const rootsString = rootsParts.join(", ");

  return (
    <article className="w-full mx-auto max-w-[64rem] pb-24">
      {/* Banner & Avatar Section */}
      <div className="relative h-48 md:h-64 lg:h-80 w-full overflow-hidden rounded-b-2xl md:rounded-b-none border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(190,205,212,0.95)_0%,rgba(190,205,212,0.88)_100%)]">
        {/* @ts-ignore banner_url might exist in raw db occasionally */}
        {profile.banner_url && (
          <img
            // @ts-ignore
            src={profile.banner_url}
            alt={`${displayName} banner`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative px-4 sm:px-8 pb-8 -mt-16 md:-mt-24 max-w-5xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="relative inline-block w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-[var(--background)] shadow-xl bg-[var(--card)]">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-[var(--accent)] bg-[rgba(255,255,255,0.02)] rounded-full">
                {initials}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 md:pb-4 mt-2 md:mt-0">
            <FollowButton followingType="person" followingId={profile.id} size="sm" className="flex-1 md:flex-none px-6 py-2.5 text-sm" />
            <Link href="/messages" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] font-semibold hover:border-white/20 hover:text-[var(--accent)] hover:border-[var(--accent)] transition">
              <MessageCircle size={18} strokeWidth={1.5} />
              Message
            </Link>
            {profile.open_to_mentor && (
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
              >
                <Calendar size={18} />
                Book Intro
              </button>
            )}
            <button className="flex-none flex items-center justify-center p-2.5 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Info Block */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-[var(--accent)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {displayName}
            </h1>
            {profile.is_verified && <VerifiedBadge className="w-6 h-6" />}
          </div>

          <p className="text-lg md:text-xl font-medium opacity-90 max-w-2xl text-[var(--foreground)]/90 mb-3">
            {profile.current_title || profile.headline || profile.profession_name || "Professional"} 
            {profile.company ? ` at ${profile.company}` : ""}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-70 mb-4">
            {locationString && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#D4AF37]" />
                <span>{locationString}</span>
              </div>
            )}
            {rootsString && (
              <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-4">
                <Globe size={14} className="text-[#D4AF37]" />
                <span>Roots: {rootsString}</span>
              </div>
            )}
          </div>

          {(profile.open_to_work || profile.open_to_hire || profile.open_to_mentor) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.open_to_work && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold tracking-wide text-green-400 border border-green-500/20">
                  <Briefcase size={14} /> Open to Work
                </span>
              )}
              {profile.open_to_hire && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold tracking-wide text-purple-400 border border-purple-500/20">
                  <UserPlus size={14} /> Hiring
                </span>
              )}
              {profile.open_to_mentor && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold tracking-wide text-blue-400 border border-blue-500/20">
                  <Award size={14} /> Available to Mentor
                </span>
              )}
            </div>
          )}
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-10 wac-card p-6 md:p-8">
            <h3 className="text-xl font-serif font-bold mb-4 text-[var(--accent)]">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white/80 hover:border-[var(--accent)]/40 hover:text-white transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio / About */}
        {profile.bio && (
          <div className="mt-10 wac-card p-6 md:p-8">
            <h3 className="text-xl font-serif font-bold mb-4 text-[var(--accent)]">About</h3>
            <div className="prose prose-invert max-w-none opacity-80 leading-relaxed">
              {profile.bio.split("\n").map((para, i) => (
                <p key={i} className="mb-4 last:mb-0">{para}</p>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--background)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition"
            >
              <X size={20} />
            </button>
            
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-serif font-bold text-[var(--accent)]">Schedule an Intro</h2>
              <p className="text-sm opacity-70 mt-1">Book a 30-minute networking or mentorship call with {profile.full_name?.split(" ")[0] || "this member"}.</p>
            </div>
            
            <div className="p-6">
              {bookingStatus === "success" ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">Request Sent!</h3>
                  <p className="opacity-70 text-sm">{profile.full_name?.split(" ")[0] || "The member"} will be notified and this will be added to your calendar pending their confirmation.</p>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Select Date</label>
                    <input required type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Select Time</label>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <label className="cursor-pointer">
                        <input type="radio" name="time" className="peer sr-only" required />
                        <div className="border border-white/10 rounded-lg py-2 text-sm peer-checked:bg-[var(--accent)] peer-checked:text-black peer-checked:border-[var(--accent)] peer-checked:font-bold transition">10:00 AM</div>
                      </label>
                      <label className="cursor-pointer">
                        <input type="radio" name="time" className="peer sr-only" required />
                        <div className="border border-white/10 rounded-lg py-2 text-sm peer-checked:bg-[var(--accent)] peer-checked:text-black peer-checked:border-[var(--accent)] peer-checked:font-bold transition">2:30 PM</div>
                      </label>
                      <label className="cursor-pointer">
                        <input type="radio" name="time" className="peer sr-only" required />
                        <div className="border border-white/10 rounded-lg py-2 text-sm peer-checked:bg-[var(--accent)] peer-checked:text-black peer-checked:border-[var(--accent)] peer-checked:font-bold transition">4:00 PM</div>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2 mt-2">What would you like to discuss?</label>
                    <textarea rows={3} placeholder="Briefly introduce yourself..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent)] transition resize-none"></textarea>
                  </div>
                  <button 
                    disabled={bookingStatus === "submitting"}
                    className={`w-full mt-2 wac-button-primary py-3 font-bold flex items-center justify-center gap-2 ${bookingStatus === "submitting" ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {bookingStatus === "submitting" ? "Sending Request..." : "Request Meeting"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
