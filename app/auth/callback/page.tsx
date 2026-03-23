"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase will automatically handle the #access_token in the URL
    // and establish the session when the client library initializes properly on this page.

    // We just need to give it a brief moment and then redirect.
    const handleAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/");
      } else {
        // Fallback timeout in case getSession doesn't immediately reflect it
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-serif text-[var(--foreground)] opacity-80">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
