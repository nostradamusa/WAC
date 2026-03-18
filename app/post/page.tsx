"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import {
  Loader2, X, Link as LinkIcon,
  FileText, Calendar, MessageSquare, ImagePlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ContentType } from "@/lib/types/network-feed";

// ─── Config ──────────────────────────────────────────────────────────────────

type FormatConfig = {
  type: ContentType;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  description: string;
  defaultDistribute: { pulse: boolean; following: boolean; wall: boolean };
};

const FORMATS: FormatConfig[] = [
  {
    type: "post",
    label: "Update",
    icon: FileText,
    placeholder: "What's on your mind?",
    description: "Share an update, announcement, or opportunity",
    defaultDistribute: { pulse: true, following: true, wall: true },
  },
  {
    type: "event",
    label: "Event",
    icon: Calendar,
    placeholder: "What's happening?",
    description: "Promote an event with a link to register or learn more",
    defaultDistribute: { pulse: true, following: true, wall: true },
  },
  {
    type: "discussion",
    label: "Discussion",
    icon: MessageSquare,
    placeholder: "Start the conversation…",
    description: "Open a conversation with the community or a group",
    defaultDistribute: { pulse: true, following: true, wall: false },
  },
];


const SOURCE_TYPE_MAP = {
  person:       "user",
  business:     "business",
  organization: "organization",
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ComposePostPage() {
  const { currentActor, setCurrentActor, ownedEntities, isLoading } = useActor();
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const identityPickerRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<ContentType>("post");
  const [content, setContent] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [distributeToPulse, setDistributeToPulse] = useState(true);
  const [distributeToFollowing, setDistributeToFollowing] = useState(true);
  const [displayOnSourceWall, setDisplayOnSourceWall] = useState(true);
  const [showCta, setShowCta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const currentFormat = FORMATS.find((f) => f.type === format)!;

  // Close identity picker on outside click
  useEffect(() => {
    if (!showIdentityPicker) return;
    const handler = (e: MouseEvent) => {
      if (identityPickerRef.current && !identityPickerRef.current.contains(e.target as Node)) {
        setShowIdentityPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showIdentityPicker]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);


  async function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    setMediaPreview(URL.createObjectURL(file));
    setUploadedMediaUrl(null);
    setIsUploadingMedia(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("feed_media")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("feed_media")
        .getPublicUrl(path);

      setUploadedMediaUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Media upload failed:", err);
      setError("Media upload failed — post will publish without the image.");
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function removeMedia() {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setUploadedMediaUrl(null);
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  }

  function selectFormat(f: ContentType) {
    setFormat(f);
    const cfg = FORMATS.find((x) => x.type === f)!;
    setDistributeToPulse(cfg.defaultDistribute.pulse);
    setDistributeToFollowing(cfg.defaultDistribute.following);
    setDisplayOnSourceWall(cfg.defaultDistribute.wall);
    if (f === "event") { setShowCta(true); } else { setCtaUrl(""); setCtaLabel(""); setShowCta(false); }
  }

  // ── Loading / auth gates ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!currentActor) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-serif text-white mb-3">Sign in to post</h1>
        <p className="text-white/50 mb-8 text-sm">You need an account to post to the global network.</p>
        <Link href="/login" className="py-2 px-6 rounded-full bg-[var(--accent)] text-black font-bold text-sm">
          Log In
        </Link>
      </div>
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(asDraft = false) {
    if (!content.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!currentActor) throw new Error("No actor selected");

      const payload: Record<string, unknown> = {
        submitted_by:          user.id,
        content:               content.trim(),
        post_type:             "general", // legacy column
        content_type:          format,
        post_intent:           null,
        source_type:           SOURCE_TYPE_MAP[currentActor.type],
        source_id:             currentActor.id,
        visibility:            "public",
        distribute_to_pulse:   distributeToPulse,
        distribute_to_following: distributeToFollowing,
        display_on_source_wall:  displayOnSourceWall,
        status:                asDraft ? "draft" : "published",
        cta_url:               ctaUrl.trim() || null,
        cta_label:             ctaLabel.trim() || null,
        image_url:             uploadedMediaUrl || null,
      };

      // Legacy author columns for backward compat with existing feed queries
      if (currentActor.type === "person")       payload.author_profile_id      = currentActor.id;
      else if (currentActor.type === "business")     payload.author_business_id     = currentActor.id;
      else if (currentActor.type === "organization") payload.author_organization_id = currentActor.id;

      const { error: insertError } = await supabase.from("feed_posts").insert(payload);
      if (insertError) throw insertError;

      router.push("/community");
    } catch (err: any) {
      console.error("Failed to post:", err);
      setError(err.message || "Failed to post");
      setIsSubmitting(false);
    }
  }

  const canPublish = (content.trim().length > 0 || !!uploadedMediaUrl) && !isSubmitting && !isUploadingMedia;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)] animate-in slide-in-from-right-[100%] fade-in duration-500 ease-out">
      <div className="max-w-xl mx-auto px-4 pt-4 pb-32">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/[0.05] transition"
            aria-label="Cancel"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => handleSubmit(false)}
            className="py-1.5 px-5 text-sm font-bold rounded-full flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-lg shadow-[var(--accent)]/10"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Post
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
            {error}
          </p>
        )}

        {/* Identity switcher */}
        <div className="mb-5 relative" ref={identityPickerRef}>
          <button
            type="button"
            onClick={() => ownedEntities.length > 1 && setShowIdentityPicker(!showIdentityPicker)}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white/[0.02] border transition ${
              ownedEntities.length > 1
                ? "border-white/[0.06] hover:border-[var(--accent)]/25 cursor-pointer"
                : "border-white/[0.06] cursor-default"
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-sm font-bold shrink-0">
              {currentActor.avatar_url
                ? <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
                : currentActor.name.charAt(0).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[11px] text-white/35">Posting as</div>
              <div className="font-semibold text-sm text-white leading-tight truncate">{currentActor.name}</div>
            </div>
            {currentActor.type !== "person" && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--accent)]/60 bg-[var(--accent)]/8 border border-[var(--accent)]/15 px-1.5 py-0.5 rounded shrink-0">
                {currentActor.type === "organization" ? "Org" : "Biz"}
              </span>
            )}
            {ownedEntities.length > 1 && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                className={`text-white/25 shrink-0 transition-transform ${showIdentityPicker ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            )}
          </button>

          {showIdentityPicker && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#0e0e0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
              {ownedEntities.map((entity) => {
                const isActive = currentActor.id === entity.id;
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => { setCurrentActor(entity); setShowIdentityPicker(false); }}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-white/[0.04] ${
                      isActive ? "text-[var(--accent)]" : "text-white/60"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-[11px] font-bold shrink-0">
                      {entity.avatar_url
                        ? <img src={entity.avatar_url} alt={entity.name} className="w-full h-full object-cover" />
                        : entity.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{entity.name}</div>
                      <div className="text-[10px] text-white/35 capitalize mt-0.5">
                        {entity.type === "person" ? "Personal account" : entity.type}
                      </div>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Format selector */}
        <div className="flex gap-0.5 mb-5 p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          {FORMATS.map(({ type, label }) => {
            const active = format === type;
            return (
              <button
                key={type}
                onClick={() => selectFormat(type)}
                className={`flex-1 flex items-center justify-center py-[7px] rounded-[9px] text-[10px] font-semibold tracking-wide transition-all duration-150 ${
                  active
                    ? "bg-[var(--accent)]/[0.1] text-[var(--accent)] ring-1 ring-inset ring-[var(--accent)]/[0.22]"
                    : "text-white/45 hover:text-white/75 hover:bg-white/[0.03]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Compose Area */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={currentFormat.placeholder}
            rows={5}
            className="w-full bg-transparent text-[17px] focus:outline-none resize-none placeholder:text-white/20 leading-relaxed p-4 pb-3"
            disabled={isSubmitting}
            autoFocus
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="px-4 pb-3">
              <div className="relative inline-block">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-h-52 max-w-full rounded-xl object-cover border border-white/10"
                />
                {isUploadingMedia && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <Loader2 size={20} className="animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#1a1a1a] border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {/* Media / attach toolbar */}
          <div className="px-3 py-2 border-t border-white/[0.05] flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={isSubmitting || isUploadingMedia || !!mediaPreview}
              title="Add photo"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition disabled:opacity-25 disabled:cursor-not-allowed ${
                mediaPreview
                  ? "text-[var(--accent)] bg-[var(--accent)]/10"
                  : "text-white/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/[0.08]"
              }`}
            >
              <ImagePlus size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => setShowCta((v) => !v)}
              disabled={isSubmitting}
              title="Add call-to-action link"
              className={`w-9 h-9 flex items-center justify-center rounded-full transition disabled:opacity-25 disabled:cursor-not-allowed ${
                showCta
                  ? "text-[var(--accent)] bg-[var(--accent)]/10"
                  : "text-white/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/[0.08]"
              }`}
            >
              <LinkIcon size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* CTA fields */}
          {showCta && (
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/25 pt-2">
                Call to Action <span className="normal-case font-normal opacity-60">(optional)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] focus-within:border-[var(--accent)]/30 transition">
                <LinkIcon size={12} className="text-white/25 shrink-0" />
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://…"
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-white/20"
                  disabled={isSubmitting}
                />
              </div>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder='Button label — e.g. "Register", "Learn More", "Apply Now"'
                maxLength={40}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] focus:border-[var(--accent)]/30 focus:outline-none text-sm text-white placeholder:text-white/20 transition"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Discussion note */}
          {format === "discussion" && (
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
              <p className="text-[11px] text-white/25 pt-2">
                Discussions surface in The Pulse. Group targeting coming soon.
              </p>
            </div>
          )}
        </div>

        {/* Distribution toggles */}
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-3">Reach</div>
          <div className="space-y-3.5">
            <Toggle
              label="The Pulse"
              sub="Global community feed"
              on={distributeToPulse}
              set={setDistributeToPulse}
            />
            <Toggle
              label="Following Feed"
              sub="Sent to your followers"
              on={distributeToFollowing}
              set={setDistributeToFollowing}
            />
            <Toggle
              label="Your Wall"
              sub="Visible on your profile or page"
              on={displayOnSourceWall}
              set={setDisplayOnSourceWall}
            />
          </div>
        </div>

      </div>

      {/* Hidden file input */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleMediaSelect}
      />
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({
  label, sub, on, set,
}: {
  label: string; sub: string; on: boolean; set: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className="w-full flex items-center justify-between gap-4"
    >
      <div className="text-left">
        <div className={`text-sm font-medium transition-colors ${on ? "text-white" : "text-white/35"}`}>{label}</div>
        <div className="text-[11px] text-white/25">{sub}</div>
      </div>
      <div
        style={{ width: 38, height: 22 }}
        className={`relative rounded-full transition-colors shrink-0 ${on ? "bg-[var(--accent)]" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[16px]" : "translate-x-0"}`}
        />
      </div>
    </button>
  );
}
