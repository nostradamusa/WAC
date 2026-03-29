"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGroup } from "@/lib/services/groupService";
import {
  PATHS,
  FOCUS_AREAS_BY_PATH,
  GROUP_TYPES,
  PLACE_SCOPES,
  buildTaxonomyCategory,
  encodePlaceLocation,
  getGroupTypesForFocusArea,
  type PathId,
  type GroupTypeId,
} from "@/lib/constants/taxonomy";
import TaxonomySheet from "@/components/ui/TaxonomySheet";
import {
  ChevronLeft,
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

  // Taxonomy fields
  const [selectedPath,      setSelectedPath]      = useState<PathId | "">("");
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>("");
  const [selectedGroupType, setSelectedGroupType] = useState<GroupTypeId | "">("");

  // Place fields (Living / Places only)
  const [placeScope, setPlaceScope] = useState("");
  const [placeLabel, setPlaceLabel] = useState("");
  // General location relevance (all other paths/focus areas)
  const [locationRelevance, setLocationRelevance] = useState("");

  // Other form state
  const [privacy,      setPrivacy]      = useState<Privacy>("private");
  const [joinPolicy,   setJoinPolicy]   = useState<JoinPolicy>("request");
  const [linkedOrg,    setLinkedOrg]    = useState<OrgResult | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [description,  setDescription]  = useState("");
  const [submitError,  setSubmitError]  = useState("");

  // Whether this group uses the Places sub-form
  const isPlacesGroup = selectedPath === "living" && selectedFocusArea === "places";

  const DESC_MAX = 1000;

  // Focus areas for currently selected path
  const focusAreaOptions = selectedPath
    ? FOCUS_AREAS_BY_PATH[selectedPath].map((fa) => ({ value: fa.id, label: fa.label }))
    : [];

  function handlePathSelect(id: PathId) {
    setSelectedPath(id);
    setSelectedFocusArea("");
    setSelectedGroupType("");
    setPlaceScope("");
    setPlaceLabel("");
  }

  function handleFocusAreaChange(focusAreaId: string) {
    setSelectedFocusArea(focusAreaId);
    // Clear group type if it's no longer in the valid set for the new focus area
    if (selectedGroupType && focusAreaId) {
      const valid = getGroupTypesForFocusArea(focusAreaId);
      if (!valid.includes(selectedGroupType as GroupTypeId)) {
        setSelectedGroupType("");
      }
    } else {
      setSelectedGroupType("");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    if (!selectedPath || !selectedFocusArea || !selectedGroupType) {
      setSubmitError("Please complete all classification fields: Path, Focus Area, and Group Type.");
      setSubmitting(false);
      return;
    }

    const fd       = new FormData(e.currentTarget);
    const category = buildTaxonomyCategory(selectedPath, selectedFocusArea, selectedGroupType);

    const locationValue = isPlacesGroup
      ? encodePlaceLocation(placeScope, placeLabel)
      : locationRelevance;

    const result = await createGroup({
      name:               (fd.get("name")    as string) ?? "",
      tagline:            (fd.get("tagline") as string) ?? "",
      description,
      category,
      tags:               (fd.get("tags")   as string) ?? "",
      location_relevance: locationValue,
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

        {/* Back */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
        >
          <ChevronLeft size={15} strokeWidth={2} />
          Back to Groups
        </Link>

        {/* Header */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          Create a{" "}
          <span className="italic font-light opacity-90 text-amber-400">Group</span>
        </h1>
        <p className="mt-2 text-sm text-white/50 mb-10">
          Start a community around any shared path, focus area, or life moment.
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
                  onChange={(e) => setDescription(e.target.value)}
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
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-[10px] font-bold tracking-[0.2em] text-amber-400/60 uppercase">02</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Community Type</h2>
            </div>
            <p className="text-[11px] text-white/30 mb-6 ml-[26px]">
              Classify your group so members can find it through the right Path and Focus Area.
            </p>

            <div className="space-y-7">

              {/* ── Path ── */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Path <span className="text-amber-400/60">*</span>
                </label>
                <p className="text-[10px] text-white/30 mb-3">
                  The broad area of life this group belongs to.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PATHS.map((path) => {
                    const isActive = selectedPath === path.id;
                    return (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => handlePathSelect(path.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                          isActive
                            ? `${path.border} ${path.bg}`
                            : "border-white/[0.08] bg-white/[0.01] hover:border-white/15"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${path.dot}`} />
                        <span className={`text-xs font-semibold leading-tight ${isActive ? path.color : "text-white/65"}`}>
                          {path.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Focus Area (dependent on Path) ── */}
              <div>
                <label htmlFor="new-focus-area" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Focus Area <span className="text-amber-400/60">*</span>
                </label>
                <p className="text-[10px] text-white/30 mb-2">
                  {selectedPath
                    ? `The specific topic this group addresses within ${PATHS.find((p) => p.id === selectedPath)?.label}.`
                    : "Select a Path first."}
                </p>
                <TaxonomySheet
                  id="new-focus-area"
                  value={selectedFocusArea}
                  onChange={handleFocusAreaChange}
                  disabled={!selectedPath}
                  placeholder={selectedPath ? "Select a focus area" : "Select a Path first"}
                  options={focusAreaOptions}
                  triggerClassName="border-[var(--border)] bg-[#111] px-5 text-white"
                />
              </div>

              {/* ── Group Type (dependent on Focus Area) ── */}
              <div>
                <label htmlFor="new-group-type" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Group Type <span className="text-amber-400/60">*</span>
                </label>
                {!selectedFocusArea ? (
                  <p className="text-[11px] text-white/28 py-2.5">
                    Select a Focus Area first.
                  </p>
                ) : (
                  <>
                    <p className="text-[10px] text-white/30 mb-2">
                      How this group functions. Not sure? Start with{" "}
                      <span className="text-white/50 font-medium">Network</span>.
                    </p>
                    <TaxonomySheet
                      id="new-group-type"
                      value={selectedGroupType}
                      onChange={(v) => setSelectedGroupType(v as GroupTypeId | "")}
                      placeholder="Select a group type"
                      options={getGroupTypesForFocusArea(selectedFocusArea)
                        .map((typeId) => GROUP_TYPES.find((g) => g.id === typeId))
                        .filter((gt): gt is (typeof GROUP_TYPES)[number] => gt !== undefined)
                        .map((gt) => ({ value: gt.id as string, label: gt.label }))}
                      triggerClassName="border-[var(--border)] bg-[#111] px-5 text-white"
                    />
                    {selectedGroupType && (
                      <p className="mt-1.5 text-[10px] text-white/30">
                        {GROUP_TYPES.find((gt) => gt.id === selectedGroupType)?.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* ── Tags ── */}
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
                <p className="mt-1.5 text-[10px] text-white/30">
                  Comma-separated. Used for search and discovery. Tags supplement but do not replace Path and Focus Area.
                </p>
              </div>

              {/* ── Place Scope + Location Label (Living / Places) ── */}
              {isPlacesGroup ? (
                <div className="space-y-4 p-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.05]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <p className="text-[11px] font-semibold text-violet-400/80 uppercase tracking-[0.1em]">Place Details</p>
                  </div>
                  <div>
                    <label htmlFor="new-place-scope" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                      Place Scope
                    </label>
                    <TaxonomySheet
                      id="new-place-scope"
                      value={placeScope}
                      onChange={setPlaceScope}
                      placeholder="Select a scope"
                      options={PLACE_SCOPES.map((s) => ({ value: s.value, label: s.label }))}
                      triggerClassName="border-[var(--border)] bg-[#111] px-5 text-white"
                    />
                    <p className="mt-1.5 text-[10px] text-white/30">
                      How large is the geographic area this group serves?
                    </p>
                  </div>
                  <div>
                    <label htmlFor="new-place-label" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                      Location Label
                    </label>
                    <input
                      id="new-place-label"
                      name="new-place-label"
                      type="text"
                      value={placeLabel}
                      onChange={(e) => setPlaceLabel(e.target.value)}
                      placeholder="e.g. NYC, South Florida, Australia, Germany"
                      className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                    />
                    <p className="mt-1.5 text-[10px] text-white/30">
                      The specific place name shown on the group profile.
                    </p>
                  </div>
                </div>
              ) : (
                /* ── General Location Relevance ── */
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                    Location Relevance
                  </label>
                  <input
                    type="text"
                    value={locationRelevance}
                    onChange={(e) => setLocationRelevance(e.target.value)}
                    placeholder="e.g. New York City — or leave blank for global"
                    className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                  />
                  <p className="mt-1.5 text-[10px] text-white/30">
                    Use for city-based, regional, or country-specific groups. Leave blank if this group is global.
                  </p>
                </div>
              )}

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
              <p className="mb-4 text-xs text-red-400/80">{submitError}</p>
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
