"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CreateEntityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<"business" | "organization">("business");
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
    <div className="wac-page max-w-2xl">
      <div className="mb-8">
        <Link
          href="/profile"
          className="text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition flex items-center gap-2 mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Profile
        </Link>

        <h1 className="text-3xl font-serif tracking-tight mb-2 text-white">
          <span className="text-[#D4AF37] italic font-light opacity-90">
            Create
          </span>{" "}
          an Entity
        </h1>
        <p className="opacity-70">
          Establish an official presence for your business or organization on
          the World Albanian Congress network.
        </p>
      </div>

      <div className="wac-card p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold opacity-80 mb-3 uppercase tracking-wider">
              Entity Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType("business")}
                className={`py-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  type === "business"
                    ? "bg-[rgba(212,175,55,0.08)] border-[#D4AF37] text-white"
                    : "bg-[rgba(255,255,255,0.02)] border-[var(--border)] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="text-blue-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" x2="4" y1="22" y2="15" />
                  </svg>
                </div>
                <span className="font-bold">Business</span>
              </button>

              <button
                type="button"
                onClick={() => setType("organization")}
                className={`py-4 rounded-xl border text-center transition flex flex-col items-center gap-2 ${
                  type === "organization"
                    ? "bg-[rgba(212,175,55,0.08)] border-[#D4AF37] text-white"
                    : "bg-[rgba(255,255,255,0.02)] border-[var(--border)] opacity-60 hover:opacity-100"
                }`}
              >
                <div className="text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.488 4m-7.488-4A8.997 8.997 0 0 0 4.512 7m14.976 4h-15m15 4h-15" />
                  </svg>
                </div>
                <span className="font-bold">Organization</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Entity Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Auto-generate a slug if they haven't explicitly edited it yet
                if (
                  !slug ||
                  slug ===
                    name
                      .slice(0, -1)
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                ) {
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  );
                }
              }}
              placeholder="e.g. Acme Corporation"
              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Profile URL (Slug)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-sm opacity-60">
                wac.app/{type}s/
              </span>
              <input
                required
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""),
                  )
                }
                placeholder="acme-corp"
                className="flex-1 rounded-r-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>
            <p className="text-xs opacity-50 mt-2">
              Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Short Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`What does your ${type} do?`}
              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] resize-vertical"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={loading}
              className={`w-full wac-button-primary py-4 text-base font-bold shadow-lg flex justify-center items-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>Create {type === "business" ? "Business" : "Organization"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
