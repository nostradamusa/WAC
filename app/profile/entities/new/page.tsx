"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ChevronLeft, Briefcase, Landmark, Loader2 } from "lucide-react";

function CreateEntityPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialType = searchParams.get("type") === "organization" ? "organization" : "business";
  const [type, setType] = useState<"business" | "organization">(initialType);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to create an entity.");

      const resolvedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Atomic RPC: creates the entity + assigns caller as owner in one transaction.
      // is_verified defaults to false — verification is a separate admin action.
      const { error: rpcError } = await supabase.rpc("create_entity_with_owner", {
        p_name:        name,
        p_slug:        resolvedSlug,
        p_description: description,
        p_entity_type: type,
      });

      if (rpcError) {
        if (rpcError.code === "23505") {
          throw new Error("That URL slug is already taken. Please try another.");
        }
        throw new Error(rpcError.message);
      }

      // Hard navigate so ActorProvider re-fetches the updated entity_roles list
      window.location.href = "/profile";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 hover:text-white/80 transition-colors mb-8"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-snug mb-2">
            <span className="italic font-light opacity-90 text-[#b08d57]">Create</span> an Entity
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Establish an official presence for your business or organization on the World Albanian Congress network.
          </p>
        </div>

        {/* Form card */}
        <div className="wac-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Entity type selector */}
            <div>
              <label className="block text-xs font-semibold tracking-[0.15em] uppercase text-white/40 mb-3">
                Entity Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "business",     label: "Business",     icon: Briefcase },
                  { value: "organization", label: "Organization", icon: Landmark  },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={`py-4 rounded-xl border transition-all flex flex-col items-center gap-2.5 ${
                      type === value
                        ? "bg-[#b08d57]/[0.08] border-[#b08d57]/50 text-[#b08d57]"
                        : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15]"
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.6} />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entity name */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Entity Name
              </label>
              <input
                id="entity-name"
                name="entity-name"
                required
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (
                    !slug ||
                    slug === name.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-")
                  ) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                placeholder="e.g. Acme Corporation"
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#b08d57]/50 focus:bg-white/[0.03]"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Profile URL (Slug)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-white/[0.09] bg-white/[0.04] text-sm text-white/35">
                  wac.app/{type}s/
                </span>
                <input
                  id="entity-slug"
                  name="entity-slug"
                  required
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))
                  }
                  placeholder="acme-corp"
                  className="flex-1 rounded-r-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#b08d57]/50"
                />
              </div>
              <p className="text-xs text-white/30 mt-2">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Short Description
              </label>
              <textarea
                id="entity-description"
                name="entity-description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`What does your ${type} do?`}
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#b08d57]/50 resize-vertical"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/40 text-red-300 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#b08d57] text-black text-sm font-bold transition-colors ${
                  loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#9a7545]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>Create {type === "business" ? "Business" : "Organization"}</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateEntityPage() {
  return (
    <Suspense fallback={null}>
      <CreateEntityPageContent />
    </Suspense>
  );
}
