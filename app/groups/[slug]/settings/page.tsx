"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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
  Save,
  Camera,
  ImagePlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getGroupBySlug, updateGroup } from "@/lib/services/groupService";
import OrgSearchCombobox, { type OrgResult } from "@/components/ui/OrgSearchCombobox";
import TaxonomySheet from "@/components/ui/TaxonomySheet";
import type { GroupData } from "@/lib/types/group";
import {
  PATHS,
  FOCUS_AREAS_BY_PATH,
  GROUP_TYPES,
  PLACE_SCOPES,
  parseTaxonomyCategory,
  buildTaxonomyCategory,
  encodePlaceLocation,
  decodePlaceLocation,
  getGroupTypesForFocusArea,
  type PathId,
  type GroupTypeId,
} from "@/lib/constants/taxonomy";

const MAX_FILE_MB = 5;

async function uploadGroupImage(
  file: File,
  groupId: string,
  kind: "avatar" | "banner",
): Promise<string | null> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `groups/${groupId}/${kind}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("feed_media").upload(path, file, { upsert: true });
  if (error) return null;
  return supabase.storage.from("feed_media").getPublicUrl(path).data.publicUrl;
}

// ── Constants ─────────────────────────────────────────────────────────────────

type Privacy    = "public" | "private" | "secret";
type JoinPolicy = "open"   | "request" | "invite_only";

const PRIVACY_OPTIONS: { value: Privacy; icon: React.ElementType; label: string; description: string }[] = [
  { value: "public",  icon: Globe,   label: "Public",  description: "Anyone on WAC can find and read this group." },
  { value: "private", icon: Lock,    label: "Private", description: "Anyone can find it, but only members see activity." },
  { value: "secret",  icon: EyeOff,  label: "Secret",  description: "Only invited members can find or access this group." },
];

const JOIN_OPTIONS: { value: JoinPolicy; icon: React.ElementType; label: string; description: string }[] = [
  { value: "open",        icon: DoorOpen,  label: "Open",            description: "Anyone can join immediately." },
  { value: "request",     icon: UserCheck, label: "Request to Join", description: "Members submit a request for admin review." },
  { value: "invite_only", icon: Mail,      label: "Invite Only",     description: "New members can only join via invitation." },
];

const DESC_MAX = 1000;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GroupSettingsPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug   = params.slug;

  const [group,       setGroup]       = useState<GroupData | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Form state
  const [name,        setName]        = useState("");
  const [tagline,     setTagline]     = useState("");
  const [description, setDescription] = useState("");
  const [selectedPath,      setSelectedPath]      = useState<PathId | "">("");
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>("");
  const [selectedGroupType, setSelectedGroupType] = useState<GroupTypeId | "">("");
  const [tags,              setTags]              = useState("");
  // Place fields (Living / Places)
  const [placeScope,        setPlaceScope]        = useState("");
  const [placeLabel,        setPlaceLabel]        = useState("");
  // General location relevance
  const [location,          setLocation]          = useState("");

  const isPlacesGroup = selectedPath === "living" && selectedFocusArea === "places";

  function handleFocusAreaChange(focusAreaId: string) {
    setSelectedFocusArea(focusAreaId);
    if (selectedGroupType && focusAreaId) {
      const valid = getGroupTypesForFocusArea(focusAreaId);
      if (!valid.includes(selectedGroupType as GroupTypeId)) {
        setSelectedGroupType("");
      }
    } else {
      setSelectedGroupType("");
    }
  }
  const [privacy,     setPrivacy]     = useState<Privacy>("private");
  const [joinPolicy,  setJoinPolicy]  = useState<JoinPolicy>("request");
  const [linkedOrg,   setLinkedOrg]   = useState<OrgResult | null>(null);

  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [bannerUrl,   setBannerUrl]   = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [saved,       setSaved]       = useState(false);

  // Load group + verify ownership
  useEffect(() => {
    async function init() {
      const [{ data: { user } }, groupData] = await Promise.all([
        supabase.auth.getUser(),
        getGroupBySlug(slug),
      ]);

      if (!groupData) { router.replace("/groups"); return; }

      if (!user) { setUnauthorized(true); setLoading(false); return; }

      // Check if this user is the owner or admin
      const { data: membership } = await supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupData.id)
        .eq("profile_id", user.id)
        .eq("status", "active")
        .single();

      if (!membership || !["owner", "admin"].includes(membership.role)) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setGroup(groupData);
      setName(groupData.name);
      setTagline(groupData.tagline ?? "");
      setDescription(groupData.description ?? "");

      // Parse compound or legacy category string + validate against live taxonomy.
      // Wrapped in try-catch: a corrupt or unexpected DB value must never crash init().
      let resolvedPath: PathId   = "living";
      let resolvedFocusArea      = "";
      let resolvedGroupType: GroupTypeId | "" = "";
      try {
        const parsed         = parseTaxonomyCategory(groupData.category);
        const pathFocusAreas = FOCUS_AREAS_BY_PATH[parsed.path] ?? [];
        const focusAreaValid = pathFocusAreas.some((fa) => fa.id === parsed.focusArea);

        resolvedPath      = parsed.path;
        resolvedFocusArea = focusAreaValid ? parsed.focusArea : "";

        if (resolvedFocusArea && parsed.groupType) {
          const validTypes = getGroupTypesForFocusArea(resolvedFocusArea);
          resolvedGroupType = validTypes.includes(parsed.groupType) ? parsed.groupType : "";
        }
      } catch {
        // Fallback: path defaults to "living", focus area + group type left empty —
        // user can re-classify the group from scratch.
      }

      setSelectedPath(resolvedPath);
      setSelectedFocusArea(resolvedFocusArea);
      setSelectedGroupType(resolvedGroupType);
      setTags((groupData.tags ?? []).join(", "));
      // Parse location_relevance — may be encoded as "Scope: Label" for Living/Places groups
      const rawLocation = groupData.location_relevance ?? "";
      const { scope, label: locLabel } = decodePlaceLocation(rawLocation);
      if (scope) {
        setPlaceScope(scope);
        setPlaceLabel(locLabel);
      } else {
        setLocation(rawLocation);
      }
      setPrivacy(groupData.privacy as Privacy);
      setJoinPolicy(groupData.join_policy as JoinPolicy);
      setAvatarUrl(groupData.avatar_url ?? null);
      setBannerUrl(groupData.banner_url ?? null);
      setLoading(false);
    }
    init();
  }, [slug, router]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !group) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setSaveError(`Avatar must be under ${MAX_FILE_MB} MB.`); return; }
    setUploadingAvatar(true);
    const url = await uploadGroupImage(file, group.id, "avatar");
    if (url) {
      setAvatarUrl(url);
      await updateGroup(group.id, {} );
      await supabase.from("groups").update({ avatar_url: url }).eq("id", group.id);
    }
    setUploadingAvatar(false);
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !group) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) { setSaveError(`Banner must be under ${MAX_FILE_MB} MB.`); return; }
    setUploadingBanner(true);
    const url = await uploadGroupImage(file, group.id, "banner");
    if (url) {
      setBannerUrl(url);
      await supabase.from("groups").update({ banner_url: url }).eq("id", group.id);
    }
    setUploadingBanner(false);
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!group) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);

    if (!selectedPath || !selectedFocusArea || !selectedGroupType) {
      setSaveError("Please complete all classification fields: Path, Focus Area, and Group Type.");
      setSaving(false);
      return;
    }

    const category = buildTaxonomyCategory(selectedPath, selectedFocusArea, selectedGroupType);

    const locationValue = isPlacesGroup
      ? encodePlaceLocation(placeScope, placeLabel)
      : location;

    const { error } = await updateGroup(group.id, {
      name,
      tagline,
      description,
      category,
      tags,
      location_relevance: locationValue,
      privacy,
      join_policy: joinPolicy,
      linked_org_id: linkedOrg?.id ?? null,
    });

    if (error) {
      setSaveError(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="w-full min-h-screen bg-[var(--background)] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-sm font-semibold text-white/50">You don't have permission to manage this group.</p>
        <Link href={`/groups/${slug}`} className="text-xs text-[#b08d57]/70 hover:text-[#b08d57] transition-colors">
          Back to group
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
        
        {/* LEFT COLUMN: Header & Navigation */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start gap-4">
          <Link
            href={`/groups/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-2 md:mb-6"
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Back to group
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Network size={13} className="text-white/30" strokeWidth={2} />
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">Group Settings</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl tracking-tight text-white leading-tight mb-3">
              Manage <br className="hidden md:block" />
              <span className="italic font-light opacity-90 text-[#b08d57]">{group?.name}</span>
            </h1>
            <p className="text-sm text-white/50 leading-relaxed md:pr-6">
              Control your group's public details, community policies, and privacy boundaries.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Configuration Form */}
        <div className="md:col-span-7 lg:col-span-8">

        <form onSubmit={handleSave} className="space-y-0">

          {/* ── BANNER + AVATAR ─────────────────────────────────────────── */}
          <div className="pb-10 border-b border-white/[0.07]">

            {/* Banner */}
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
              Group Banner
            </label>
            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/[0.10] bg-white/[0.03] mb-6 group/banner cursor-pointer">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-white/25">
                  <ImagePlus size={20} strokeWidth={1.5} />
                  <span className="text-xs">Add a cover photo</span>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity cursor-pointer">
                {uploadingBanner ? (
                  <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                ) : (
                  <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">
                    <Camera size={13} /> Change banner
                  </span>
                )}
                <input id="banner-upload" name="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={uploadingBanner} />
              </label>
            </div>

            {/* Avatar */}
            <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
              Group Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/[0.10] shrink-0 group/avatar cursor-pointer">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-bold text-lg ${group?.avatar_bg ?? "bg-white/[0.06]"} ${group?.avatar_color ?? "text-white/40"}`}>
                    {group?.name ? group.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() : ""}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  ) : (
                    <Camera size={14} className="text-white" />
                  )}
                  <input id="avatar-upload" name="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                Square image recommended.<br />Shown on group cards and the profile page.
              </p>
            </div>
          </div>

          {/* ── 01 IDENTITY ─────────────────────────────────────────────── */}
          <div className="pb-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#b08d57]/60 uppercase">01</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Identity</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Group Name <span className="text-[#b08d57]/60">*</span>
                </label>
                <input
                  id="group-name"
                  name="group-name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Tagline
                </label>
                <input
                  id="group-tagline"
                  name="group-tagline"
                  maxLength={100}
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="A one-sentence description of your group's purpose"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
                <p className="mt-1.5 text-[10px] text-white/30">Shown on the group card in the directory.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Description
                </label>
                <textarea
                  id="group-description"
                  name="group-description"
                  rows={5}
                  maxLength={DESC_MAX}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this group about? Who should join?"
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
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#b08d57]/60 uppercase">02</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Community Type</h2>
            </div>

            <div className="space-y-6">

              {/* Path tile picker */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                  Path <span className="text-[#b08d57]/60">*</span>
                </label>
                <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
                  Choose the primary area of life this group belongs to.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PATHS.map((path) => {
                    const isActive = selectedPath === path.id;
                    return (
                      <button
                        key={path.id}
                        type="button"
                        onClick={() => {
                          setSelectedPath(path.id);
                          setSelectedFocusArea("");
                          setSelectedGroupType("");
                          setPlaceScope("");
                          setPlaceLabel("");
                        }}
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

              {/* Focus Area — dependent on path */}
              <div>
                <label htmlFor="settings-focus-area" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Focus Area <span className="text-[#b08d57]/60">*</span>
                </label>
                <TaxonomySheet
                  id="settings-focus-area"
                  value={selectedFocusArea}
                  onChange={handleFocusAreaChange}
                  disabled={!selectedPath}
                  placeholder={selectedPath ? "Select a focus area" : "Select a Path first"}
                  options={(selectedPath ? FOCUS_AREAS_BY_PATH[selectedPath] : []).map((fa) => ({
                    value: fa.id,
                    label: fa.label,
                  }))}
                  triggerClassName="border-[var(--border)] bg-[#111] px-5 text-white"
                />
              </div>

              {/* Group Type — dependent on Focus Area */}
              <div>
                <label htmlFor="settings-group-type" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                  Group Type <span className="text-[#b08d57]/60">*</span>
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
                      id="settings-group-type"
                      value={selectedGroupType}
                      onChange={(v) => setSelectedGroupType(v as GroupTypeId)}
                      placeholder="Select a group type"
                      options={getGroupTypesForFocusArea(selectedFocusArea)
                        .map((typeId) => GROUP_TYPES.find((g) => g.id === typeId))
                        .filter((gt): gt is (typeof GROUP_TYPES)[number] => gt !== undefined)
                        .map((gt) => ({ value: gt.id as string, label: gt.label }))}
                      triggerClassName="border-[var(--border)] bg-[#111] px-5 text-white"
                    />
                    {selectedGroupType && (() => {
                      const gt = GROUP_TYPES.find((g) => g.id === selectedGroupType);
                      return gt ? (
                        <p className="mt-1.5 text-[11px] text-white/30 leading-relaxed">{gt.description}</p>
                      ) : null;
                    })()}
                  </>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">Tags</label>
                <input
                  id="group-tags"
                  name="group-tags"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. founders, startups, fundraising"
                  className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                />
                <p className="mt-1.5 text-[10px] text-white/30">Comma-separated.</p>
              </div>

              {/* Place Scope + Location Label (Living / Places) or general Location Relevance */}
              {isPlacesGroup ? (
                <div className="space-y-4 p-4 rounded-xl border border-violet-400/20 bg-violet-500/[0.05]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                    <p className="text-[11px] font-semibold text-violet-400/80 uppercase tracking-[0.1em]">Place Details</p>
                  </div>
                  <div>
                    <label htmlFor="settings-place-scope" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                      Place Scope
                    </label>
                    <TaxonomySheet
                      id="settings-place-scope"
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
                    <label htmlFor="group-place-label" className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                      Location Label
                    </label>
                    <input
                      id="group-place-label"
                      name="group-place-label"
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
                <div>
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-1.5">
                    Location Relevance
                  </label>
                  <input
                    id="group-location"
                    name="group-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. New York City, USA — or leave blank for global"
                    className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white placeholder:text-white/20"
                  />
                </div>
              )}

            </div>
          </div>

          {/* ── 03 VISIBILITY & ACCESS ──────────────────────────────────── */}
          <div className="py-10 border-b border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#b08d57]/60 uppercase">03</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Visibility &amp; Access</h2>
            </div>

            <div className="mb-7">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">Privacy</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRIVACY_OPTIONS.map(({ value, icon: Icon, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPrivacy(value)}
                    className={`text-left flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${
                      privacy === value
                        ? "border-[#b08d57]/40 bg-[#b08d57]/[0.04]"
                        : "border-white/[0.08] bg-white/[0.01] hover:border-white/15"
                    }`}
                  >
                    <Icon size={16} className={privacy === value ? "text-[#b08d57]" : "text-white/35"} strokeWidth={1.8} />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${privacy === value ? "text-[#b08d57]" : "text-white/65"}`}>{label}</p>
                      <p className="text-[11px] text-white/35 leading-relaxed">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-3">Join Policy</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {JOIN_OPTIONS.map(({ value, icon: Icon, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setJoinPolicy(value)}
                    className={`text-left flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${
                      joinPolicy === value
                        ? "border-[#b08d57]/40 bg-[#b08d57]/[0.04]"
                        : "border-white/[0.08] bg-white/[0.01] hover:border-white/15"
                    }`}
                  >
                    <Icon size={16} className={joinPolicy === value ? "text-[#b08d57]" : "text-white/35"} strokeWidth={1.8} />
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${joinPolicy === value ? "text-[#b08d57]" : "text-white/65"}`}>{label}</p>
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
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#b08d57]/60 uppercase">04</span>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/70">Linked Organization</h2>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">(Optional)</span>
            </div>
            <p className="text-xs text-white/35 leading-relaxed mb-5 ml-[26px]">
              Link this group to a parent organization on WAC.
            </p>
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Parent Organization
              </label>
              <OrgSearchCombobox value={linkedOrg} onChange={setLinkedOrg} />
            </div>
          </div>

          {/* ── Save ────────────────────────────────────────────────────── */}
          <div className="pt-10">
            {saveError && <p className="mb-4 text-xs text-red-400">{saveError}</p>}
            {saved && (
              <p className="mb-4 text-xs text-emerald-400/80">Changes saved.</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-colors ${
                saving
                  ? "bg-[#b08d57]/50 text-black/50 cursor-not-allowed"
                  : "bg-[#b08d57] text-black hover:bg-[#9a7545]"
              }`}
            >
              {saving ? (
                <><Loader2 size={15} className="animate-spin text-[var(--accent)]" /> Saving…</>
              ) : (
                <><Save size={15} /> Save Changes</>
              )}
            </button>
          </div>

        </form>
        </div>
      </div>
    </div>
  );
}
