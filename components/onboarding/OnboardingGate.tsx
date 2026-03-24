"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Allow unauthenticated/guest routes to bypass the gate
  const bypassedRoutes = ["/login", "/auth/callback", "/vision"];
  const isBypassed = bypassedRoutes.includes(pathname) || pathname.startsWith("/api") || pathname.startsWith("/invite");

  useEffect(() => {
    if (isBypassed) {
      setIsChecking(false);
      return;
    }

    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsChecking(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, country, city")
        .eq("id", user.id)
        .single();

      // If no profile exists OR it's missing the minimum required fields
      if (!profile || !profile.full_name || !profile.country || !profile.city) {
        setNeedsOnboarding(true);
      }
      setIsChecking(false);
    }

    checkProfile();
  }, [pathname, isBypassed]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (!fullName.trim() || !country.trim() || !city.trim()) {
      setError("Please fill out all fields to continue.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: fullName.trim(),
        country: country.trim(),
        city: city.trim(),
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      setError(upsertError.message || "Something went wrong saving your profile.");
      setIsSaving(false);
      return;
    }

    // Success - close gate
    setNeedsOnboarding(false);
    setIsSaving(false);
    
    // Refresh the page so ActorProvider and other global states pick up the new profile
    window.location.reload();
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (needsOnboarding && !isBypassed) {
    return (
      <div className="fixed inset-0 z-[100] min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--foreground)]/5 border border-[var(--foreground)]/10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-serif font-bold text-white mb-2">Welcome to WAC</h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Before exploring the platform, please complete your basic profile.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/90 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="First and Last Name"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-2">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. USA, Germany, Albania"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-2">Current City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York, Berlin, Tirana"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2"
              />
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving && <Loader2 size={16} className="animate-spin text-[var(--accent)]" />}
              Complete Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
