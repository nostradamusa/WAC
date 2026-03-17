"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, MessageCircle } from "lucide-react";
import LanguageToggle from "./LanguageToggle";
import { useActor } from "@/components/providers/ActorProvider";
import GlobalSearchOverlay from "./GlobalSearchOverlay";
import EventsNavbarSearch from "@/components/events/EventsNavbarSearch";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isActorDropdownOpen, setIsActorDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { currentActor, setCurrentActor, ownedEntities } = useActor();

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUserEmail(data.user.email ?? null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("open-global-search", handleOpenSearch);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("open-global-search", handleOpenSearch);
    };
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  if (pathname === '/post') {
    return null;
  }

  return (
    <>
      <button
        id="wac-global-login"
        onClick={signInWithGoogle}
        className="hidden"
        aria-hidden="true"
      />

      <header className="fixed left-0 right-0 top-0 z-[60] bg-[var(--background)]/90 backdrop-blur-md border-b border-white/5">
        
        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:flex items-center justify-between p-4 lg:px-10">
          <div className="flex items-center gap-8">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--accent)]/50 shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-[var(--accent)]">
              <img
                src="/images/wac-logo.jpg"
                alt="World Albanian Congress Logo"
                className="h-full w-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
              />
            </div>
            <div className="hidden sm:flex items-center">
              <span className="text-xl font-serif tracking-tight text-white mt-1">
                World{" "}
                <span className="text-[#D4AF37] italic font-light opacity-90">
                  Albanian
                </span>{" "}
                Congress
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm font-medium opacity-80">
            <Link
              href="/directory"
              className="px-3 py-1.5 rounded-full border border-transparent transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              Directory
            </Link>
            <Link
              href="/events"
              className="px-3 py-1.5 rounded-full border border-transparent transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              Events
            </Link>
            <Link
              href="/community"
              className="px-3 py-1.5 rounded-full border border-transparent transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              The Pulse
            </Link>
            <Link
              href="/groups"
              className="px-3 py-1.5 rounded-full border border-transparent transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              Groups
            </Link>
            <Link
              href="/#vision"
              className="px-3 py-1.5 rounded-full border border-transparent transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              Vision
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />
          {pathname !== '/events' && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="rounded-full bg-[rgba(255,255,255,0.05)] p-2 transition-all duration-300 hover:bg-[rgba(255,255,255,0.1)] hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] mr-1"
              aria-label="Global Directory Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          )}

          <Link
            href="/post"
            className="rounded-full bg-[var(--accent)] text-black p-2 transition-all duration-300 hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/20 mr-2 flex items-center justify-center"
            aria-label="Create Post"
          >
            <Plus className="w-5 h-5 font-bold" />
          </Link>

          {userEmail ? (
            <div className="flex items-center gap-2 sm:gap-4 relative">              {currentActor && ownedEntities.length > 1 && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setIsActorDropdownOpen(!isActorDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-sm font-medium hover:border-[var(--accent)] transition"
                  >
                    <span className="opacity-60 text-xs">Acting as:</span>
                    <span className="text-[var(--accent)] truncate max-w-[120px] font-bold">
                      {currentActor.name}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform opacity-60 ${isActorDropdownOpen ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {isActorDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[#111] shadow-2xl overflow-hidden py-1 z-[100]">
                      <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider opacity-50 border-b border-white/5 mb-1">
                        Select Identity
                      </div>
                      {ownedEntities.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => {
                            setCurrentActor(entity);
                            setIsActorDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition flex flex-col gap-0.5 hover:bg-[rgba(255,255,255,0.05)] ${
                            currentActor.id === entity.id
                              ? "bg-[rgba(212,175,55,0.08)] text-[var(--accent)]"
                              : "text-white/80"
                          }`}
                        >
                          <span className="font-bold truncate">
                            {entity.name}
                          </span>
                          <span className="text-[9px] opacity-60 uppercase tracking-wider">
                            {entity.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Link
                href="/profile"
                className="px-4 py-1.5 rounded-full border border-transparent text-sm font-medium transition-all duration-300 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] hidden sm:flex items-center justify-center"
              >
                My Profile
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.05)] px-4 py-1.5 sm:px-5 text-sm font-medium hover:border-red-500/50 hover:text-red-400 transition flex items-center justify-center"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[rgba(255,255,255,0.05)] px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-[#D4AF37] border border-[rgba(255,255,255,0.1)] transition hover:bg-[rgba(255,255,255,0.1)] hover:border-[#D4AF37]/50"
            >
              Log In
            </Link>
          )}
        </div>
        </div>

        {/* --- MOBILE VIEW --- */}
        <div className="flex md:hidden items-center justify-between p-3 gap-3">
           <Link href="/profile" className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-[var(--accent)]/30">
             {currentActor ? (
                currentActor.avatar_url ? (
                   <img src={currentActor.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold uppercase">
                     {currentActor.name ? currentActor.name.charAt(0) : "?"}
                   </div>
                )
             ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-xs text-white/50">?</div>
             )}
           </Link>

           {pathname !== '/events' ? (
             <div className="flex-1 relative">
               <input 
                 type="text" 
                 placeholder="Search with AI..." 
                 onFocus={(e) => {
                   e.preventDefault();
                   setIsSearchOpen(true);
                   e.target.blur(); // Prevent mobile keyboard from opening on this background input
                 }}
                 className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-4 py-1.5 text-sm transition-colors text-white placeholder:text-white/40 cursor-text" 
                 readOnly={true}
               />
             </div>
           ) : (
             <Suspense fallback={<div className="flex-1 h-8" />}>
               <EventsNavbarSearch isMobile={true} />
             </Suspense>
           )}

           <Link href="/post" className="shrink-0 flex items-center justify-center p-1.5 rounded-full bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/20 transition-all duration-300">
              <Plus size={20} className="font-bold" />
           </Link>
           
           <Link href="/messages" className="shrink-0 text-white/60 hover:text-[var(--accent)] hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] transition-all duration-300 relative">
              <MessageCircle size={24} strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">2</span>
           </Link>
        </div>
      </header>

      <GlobalSearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
