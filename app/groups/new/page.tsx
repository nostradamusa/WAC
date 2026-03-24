"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGroup } from "@/lib/services/groupService";
import PremiumSelect from "@/components/ui/PremiumSelect";
import {
  ChevronLeft,
  Network,
  Globe,
  Lock,
  EyeOff,
  DoorOpen,
  UserCheck,
  Mail,
  Loader2,
} from "lucide-react";
import OrgSearchCombobox, { type OrgResult } from "@/components/ui/OrgSearchCombobox";

// ── Types ──────────────────────────────────────────────────────────────────────

type Privacy    = "public" | "private" | "secret";
type JoinPolicy = "open"   | "request" | "invite_only";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Parenting & Family",
  "Career & Professional",
  "Business & Founder",
  "Industry Circles",
  "Education & Mentorship",
  "Travel & Lifestyle",
  "Culture & Identity",
  "City / Region",
  "Special Interest",
];

const PRIVACY_OPTIONS: {
  value:        Privacy;
  icon:         React.ElementType;
  label:        string;
  description:  string;
  recommended?: true;
}[] = [
  {
    value:       "public",
    icon:        Globe,
    label:       "Public",
    description: "Anyone on WAC can find and read this group's discussions.",
  },
  {
    value:       "private",
    icon:        Lock,
    label:       "Private",
    description: "Anyone can find this group, but only members see activity.",
    recommended: true,
  },
  {
    value:       "secret",
    icon:        EyeOff,
    label:       "Secret",
    description: "Only invited members can find or access this group.",
  },
];

const JOIN_OPTIONS: {
  value:        JoinPolicy;
  icon:         React.ElementType;
  label:        string;
  description:  string;
  recommended?: true;
}[] = [
  {
    value:       "open",
    icon:        DoorOpen,
    label:       "Open",
    description: "Anyone can join immediately without approval.",
  },
  {
    value:       "request",
    icon:        UserCheck,
    label:       "Request to Join",
    description: "Members submit a request for admin review.",
    recommended: true,
  },
  {
    value:       "invite_only",
    icon:        Mail,
    label:       "Invite Only",
    description: "New members can only join via direct invitation.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateGroupPage() {
  const router = useRouter();

  const [category,     setCategory]     = useState("");
  const [privacy,      setPrivacy]      = useState<Privacy>("private");
  const [joinPolicy,   setJoinPolicy]   = useState<JoinPolicy>("request");
  const [linkedOrg,    setLinkedOrg]    = useState<OrgResult | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [description,  setDescription]  = useState("");
  const [submitError,  setSubmitError]  = useState("");

  const DESC_MAX = 1000;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const fd = new FormData(e.currentTarget);

    const result = await createGroup({
      name:               (fd.get("name")     as string) ?? "",
      tagline:            (fd.get("tagline")  as string) ?? "",
      description,
      category:           (fd.get("category") as string) ?? "",
      tags:               (fd.get("tags")     as string) ?? "",
      location_relevance: (fd.get("location") as string) ?? "",
      privacy,
      join_policy:        joinPolicy,
      linked_org_id:      linkedOrg?.id ?? null,
    });

    if (result.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/groups/${result.data!.slug}`);
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* Back link */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Back to Groups
        </Link>

        {/* Page header */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          Create a{" "}
          <span className="italic font-light opacity-90 text-amber-400">Group</span>
        </h1>
        <p className="mt-2 text-sm text-white/50 mb-10">
          Start a community around any shared interest, profession, or identity.
        </p>

        <form onSubmit={handleSubmit} className="space-y-0">

          {/* ── 01 IDENTITY ─────────────────────────────────────────────── */}
          <div className="pb-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">01</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Identity</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Group Name <span className="text-amber-400/60">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="e.g. Albanian Founders Circle"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Tagline
                </label>
                <input
                  name="tagline"
                  type="text"
                  maxLength={100}
                  placeholder="A one-sentence description of your group's purpose"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
                <p className="mt-1.5 text-[10px] text-white/30">
                  Shown on the group card in the directory. Short and purposeful.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  maxLength={DESC_MAX}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this group about? Who should join? What will members do here?"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20 resize-none"
                />
                <p className={`mt-1.5 text-[10px] text-right tabular-nums ${description.length >= DESC_MAX ? "text-red-400/70" : "text-white/25"}`}>
                  {description.length} / {DESC_MAX}
                </p>
              </div>
            </div>
          </div>

          {/* ── 02 COMMUNITY TYPE ───────────────────────────────────────── */}
          <div className="py-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">02</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Community Type</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Category <span className="text-amber-400/60">*</span>
                </label>
                <PremiumSelect
                  name="category"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "", label: "Select a category", disabled: true },
                    ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  triggerClassName="w-full border-[var(--border)] bg-[#111] px-5 py-3 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Tags
                </label>
                <input
                  name="tags"
                  type="text"
                  placeholder="e.g. founders, startups, fundraising"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
                <p className="mt-1.5 text-[10px] text-white/30">Comma-separated. Helps members discover your group.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Location Relevance
                </label>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g. New York City, USA — or leave blank for global"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
              </div>
            </div>
          </div>

          {/* ── 03 VISIBILITY & ACCESS ──────────────────────────────────── */}
          <div className="py-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">03</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Visibility &amp; Access</h2>
            </div>

            {/* Privacy */}
            <div className="mb-7">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">
                Privacy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRIVACY_OPTIONS.map(({ value, icon: Icon, label, description, recommended }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPrivacy(value)}
                    className={`relative text-left flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${
                      privacy === value
                        ? "border-amber-400/40 bg-amber-500/[0.04]"
                        : "border-white/[0.08] bg-white/[0.01] hover:border-white/15"
                    }`}
                  >
                    {recommended && (
                      <span className="absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/20">
                        Recommended
                      </span>
                    )}
                    <Icon
                      size={16}
                      className={privacy === value ? "text-amber-400" : "text-white/35"}
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${privacy === value ? "text-amber-400" : "text-white/65"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Join Policy */}
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">
                Join Policy
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {JOIN_OPTIONS.map(({ value, icon: Icon, label, description, recommended }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setJoinPolicy(value)}
                    className={`relative text-left flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${
                      joinPolicy === value
                        ? "border-amber-400/40 bg-amber-500/[0.04]"
                        : "border-white/[0.08] bg-white/[0.01] hover:border-white/15"
                    }`}
                  >
                    {recommended && (
                      <span className="absolute top-2.5 right-2.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/20">
                        Recommended
                      </span>
                    )}
                    <Icon
                      size={16}
                      className={joinPolicy === value ? "text-amber-400" : "text-white/35"}
                      strokeWidth={1.8}
                    />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${joinPolicy === value ? "text-amber-400" : "text-white/65"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 04 LINKED ORGANIZATION ──────────────────────────────────── */}
          <div className="py-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">04</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Linked Organization</h2>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">(Optional)</span>
            </div>
            <p className="text-xs text-white/35 leading-relaxed mb-5 ml-[26px]">
              If this group is affiliated with an organization on WAC — such as a cultural center, association, or chapter — link it here. Use this for groups like <em className="not-italic text-white/50">AACC Youth</em> linked to the <em className="not-italic text-white/50">Albanian American Cultural Center</em>. Only WAC-registered organizations are eligible.
            </p>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Parent Organization
              </label>
              <OrgSearchCombobox value={linkedOrg} onChange={setLinkedOrg} />
              {linkedOrg && (
                <p className="mt-2 text-[10px] text-white/30">
                  This group will display a link to {linkedOrg.name} on its profile page.
                </p>
              )}
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <div className="pt-10">
            {submitError && (
              <p className="mb-4 text-xs text-red-400">{submitError}</p>
            )}
            <p className="text-[11px] text-white/30 leading-relaxed mb-6">
              Once created, you become the owner of this group. You can invite admins, set community guidelines, and manage membership from the group settings. Groups are subject to WAC community standards.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-colors ${
                submitting
                  ? "bg-amber-500/50 text-black/50 cursor-not-allowed"
                  : "bg-amber-500 text-black hover:bg-[#9a7545]"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-[var(--accent)]" />
                  Creating Group...
                </>
              ) : (
                "Create Group"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
