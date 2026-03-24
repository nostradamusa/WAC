"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        // 1. Fetch current session auth securely
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (mounted) router.replace("/");
          return;
        }

        // 2. Fetch the is_admin flag from profiles table
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile?.is_admin) {
          console.warn("Unauthorized admin access attempt blocked.");
          if (mounted) router.replace("/");
          return;
        }

        // Successfully authorized!
        if (mounted) setIsAuthorized(true);
      } catch (err) {
        console.error("AdminGuard check failed:", err);
        if (mounted) router.replace("/");
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Suspend rendering entirely while evaluating to prevent FOUC (flash of unstyled content)
  if (isAuthorized === null) return null;

  return <>{children}</>;
}
