"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Building2, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";

type InviteState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "success"; entityName: string; entityType: string; entitySlug?: string }
  | { status: "error"; message: string };

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<InviteState>({ status: "loading" });

  useEffect(() => {
    if (!token) return;

    async function accept() {
      // Check auth first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ status: "unauthenticated" });
        return;
      }

      // Peek at the invite before accepting to get entity info for the success screen
      const { data: invite } = await supabase
        .from("entity_invites")
        .select("entity_type, entity_id, status")
        .eq("token", token)
        .single();

      if (!invite) {
        setState({ status: "error", message: "This invitation link is invalid or has expired." });
        return;
      }
      if (invite.status === "accepted") {
        setState({ status: "error", message: "This invitation has already been accepted." });
        return;
      }
      if (invite.status === "revoked" || invite.status === "expired") {
        setState({ status: "error", message: "This invitation has been revoked or has expired." });
        return;
      }

      // Fetch entity name for the success message
      let entityName = "your organization";
      let entitySlug: string | undefined;
      if (invite.entity_type === "business") {
        const { data } = await supabase
          .from("businesses")
          .select("name, slug")
          .eq("id", invite.entity_id)
          .single();
        entityName = data?.name ?? "the business";
        entitySlug = data?.slug;
      } else if (invite.entity_type === "organization") {
        const { data } = await supabase
          .from("organizations")
          .select("name, slug")
          .eq("id", invite.entity_id)
          .single();
        entityName = data?.name ?? "the organization";
        entitySlug = data?.slug;
      }

      // Accept via RPC
      const { error } = await supabase.rpc("accept_entity_invite", { p_token: token });

      if (error) {
        const msg =
          error.message.includes("expired") ? "This invitation has expired." :
          error.message.includes("already") ? "You are already a member." :
          "Something went wrong accepting the invitation. Please try again.";
        setState({ status: "error", message: msg });
        return;
      }

      setState({ status: "success", entityName, entityType: invite.entity_type, entitySlug });
    }

    accept();
  }, [token]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (state.status === "loading") {
    return (
      <PageShell>
        <Loader2 size={40} className="animate-spin text-[var(--accent)] mb-6" />
        <p className="text-white/60 text-sm">Accepting your invitation…</p>
      </PageShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PageShell>
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center mb-6">
          <Building2 size={24} className="text-[var(--accent)]" />
        </div>
        <h1 className="text-xl font-serif font-bold text-white mb-2">Sign in to accept</h1>
        <p className="text-white/50 text-sm mb-8 text-center max-w-xs leading-relaxed">
          You need to be signed in to accept this invitation. After signing in you will be redirected back here.
        </p>
        <Link
          href={`/login?next=/invite/${token}`}
          className="px-8 py-2.5 rounded-full bg-[var(--accent)] text-black font-bold text-sm hover:bg-[var(--accent)]/90 transition-colors"
        >
          Sign In
        </Link>
      </PageShell>
    );
  }

  if (state.status === "error") {
    return (
      <PageShell>
        <XCircle size={48} className="text-red-400 mb-5" strokeWidth={1.5} />
        <h1 className="text-xl font-serif font-bold text-white mb-2">Invitation unavailable</h1>
        <p className="text-white/50 text-sm mb-8 text-center max-w-xs leading-relaxed">
          {state.message}
        </p>
        <Link
          href="/"
          className="px-8 py-2.5 rounded-full border border-[var(--accent)]/40 text-[var(--accent)] font-bold text-sm hover:bg-[var(--accent)]/10 transition-colors"
        >
          Go Home
        </Link>
      </PageShell>
    );
  }

  // success
  const entityPath =
    state.entityType === "business"
      ? `/businesses/${state.entitySlug ?? ""}`
      : `/organizations/${state.entitySlug ?? ""}`;

  const Icon = state.entityType === "organization" ? Landmark : Building2;

  return (
    <PageShell>
      <div className="relative mb-6">
        <CheckCircle2 size={56} className="text-[var(--accent)]" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-serif font-bold text-white mb-2">You&apos;re in!</h1>
      <p className="text-white/55 text-sm mb-1 text-center">
        You have joined
      </p>
      <div className="flex items-center gap-2 mb-8">
        <Icon size={14} className="text-[var(--accent)]/70" />
        <span className="font-semibold text-[var(--accent)]">{state.entityName}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={entityPath}
          className="px-8 py-2.5 rounded-full bg-[var(--accent)] text-black font-bold text-sm hover:bg-[var(--accent)]/90 transition-colors"
        >
          View Page
        </Link>
        <Link
          href="/profile"
          className="px-8 py-2.5 rounded-full border border-[var(--accent)]/20 text-white/70 font-bold text-sm hover:bg-white/5 transition-colors"
        >
          My Profile
        </Link>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--background)] pt-14">
      <div className="wac-card p-10 flex flex-col items-center text-center max-w-md w-full">
        {children}
      </div>
    </main>
  );
}
