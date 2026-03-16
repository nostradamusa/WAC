"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSignCheckComplete, setIsSignCheckComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setIsSignCheckComplete(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery) {
      router.push(`/directory?q=${encodeURIComponent(cleanQuery)}`);
    } else {
      router.push(`/directory`);
    }
  }

  return (
    <section className="relative flex flex-col items-center justify-center pt-24 md:pt-32 pb-16 md:pb-24 text-center px-4 min-h-[50vh] md:min-h-0">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(176,141,87,0.12)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl">
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden flex items-center justify-center bg-[var(--accent)] drop-shadow-[0_0_20px_rgba(212,175,55,0.25)] animate-in zoom-in duration-700 relative">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_60%)] mix-blend-overlay pointer-events-none"></div>
             <img 
               src="/images/wac-logo.jpg" 
               alt="WAC Eagle Globe" 
               className="w-full h-full object-cover scale-[1.4] mix-blend-multiply opacity-95" 
             />
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif tracking-tight mb-8 md:mb-12 leading-tight text-white animate-in slide-in-from-bottom-4 duration-700 delay-100">
          World{" "}
          <span className="text-[#D4AF37] italic font-light opacity-90">
            Albanian
          </span>{" "}
          Congress
        </h1>
        <div className="mx-auto max-w-3xl px-2 mb-8 md:mb-16">
          <p className="text-[4.5vw] sm:text-2xl md:text-3xl font-serif font-medium opacity-90 mb-4 sm:mb-6 leading-relaxed whitespace-nowrap">
            The global network for <span className="text-[#D4AF37] opacity-100 drop-shadow-md italic font-serif">Albanians</span>.
          </p>
          <p className="text-base sm:text-xl md:text-2xl font-serif opacity-90 font-bold tracking-widest uppercase leading-relaxed max-w-2xl mx-auto">
            Connect. Build. Rise.
          </p>
        </div>

        {/* Integrated Search Bar - Hidden on mobile because of persistent top nav search */}
        <div className="mx-auto max-w-2xl w-full hidden md:block">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-5 text-[#D4AF37] opacity-80"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an Injury Lawyer in NJ from Struga..."
              autoComplete="off"
              spellCheck="false"
              className="w-full rounded-full border border-[var(--border)] bg-[rgba(0,0,0,0.4)] py-5 pl-14 pr-36 text-lg shadow-2xl backdrop-blur-md outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 [&:-webkit-autofill]:bg-[rgba(0,0,0,0.4)] [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
            />
            <button
              type="submit"
              className="absolute right-3 top-3 bottom-3 rounded-full bg-[var(--accent)] px-8 font-bold text-[var(--deep-charcoal)] transition hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="h-4 md:h-8 mt-4 md:mt-6">
            {isSignCheckComplete && !isLoggedIn && (
              <div className="text-sm text-white/50 animate-in fade-in duration-500">
                Not part of the network yet?{" "}
                <Link
                  href="/login"
                  className="text-[#D4AF37] hover:underline opacity-90 transition font-medium"
                >
                  Create your profile
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Login Prompt (when search is hidden) */}
        <div className="md:hidden mt-2">
           {isSignCheckComplete && !isLoggedIn && (
              <div className="text-sm text-white/50 animate-in fade-in duration-500">
                Not part of the network yet?{" "}
                <Link
                  href="/login"
                  className="text-[#D4AF37] hover:underline opacity-90 transition font-medium"
                >
                  Create your profile
                </Link>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
