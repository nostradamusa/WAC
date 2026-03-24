"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  MapPin,
  Globe,
  Clock,
  Link2,
  Loader2,
  RotateCcw,
  UserPlus,
  ChevronDown,
  Plus,
  Activity,
  Check,
  Bell,
  Radio,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useActor } from "@/components/providers/ActorProvider";
import PremiumSelect from "@/components/ui/PremiumSelect";
import WacDatePicker from "@/components/ui/WacDatePicker";
import WacTimePicker from "@/components/ui/WacTimePicker";
import { getEntitiesDirectory, getPeopleDirectory } from "@/lib/services/searchService";
import type { EventEntitySnapshot, EventHostingMetadata, EventPersonSnapshot } from "@/lib/events/hosting";
import type { PersonDirectoryRow } from "@/lib/types/person-directory";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionId = "basics" | "hosting" | "publishing" | "access" | "advanced";
type HostAs    = "me" | "organization" | "business" | "group";

interface QuestionItem {
  id:       string;
  text:     string;
  type:     "text" | "yesno" | "choice";
  required: boolean;
}

type DirectoryPersonOption = Pick<PersonDirectoryRow, "id" | "full_name" | "username" | "headline" | "avatar_url">;

type HostEntityOption = {
  id: string;
  type: "organization" | "business" | "group";
  name: string;
  slug: string | null;
  role?: string;
};

type SearchableEntityOption = {
  id: string;
  type: "organization" | "business" | "group";
  name: string;
  slug: string;
  subtitle: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS: { id: SectionId; label: string; sublabel: string }[] = [
  { id: "basics",     label: "Event Basics",      sublabel: "What, when, and where"          },
  { id: "hosting",    label: "Hosting & Network",  sublabel: "Who and how it's connected"     },
  { id: "publishing", label: "Publishing",         sublabel: "Calendar and discoverability"   },
  { id: "access",     label: "Access & RSVP",      sublabel: "Who can attend and how"         },
  { id: "advanced",   label: "Advanced Settings",  sublabel: "Questionnaire and reminders"    },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

const REPEAT_OPTIONS = [
  { value: "none",     label: "Does not repeat" },
  { value: "daily",    label: "Every day"        },
  { value: "weekly",   label: "Every week"       },
  { value: "biweekly", label: "Every 2 weeks"    },
  { value: "monthly",  label: "Every month"      },
  { value: "yearly",   label: "Every year"       },
];

const DISCOVERY_OPTIONS = [
  { value: "public",  label: "Public on WAC",      hint: "Visible to all WAC members in search and feeds"           },
  { value: "network", label: "My Network",          hint: "Only people you follow or who follow you"                 },
  { value: "group",   label: "Group members",       hint: "Only members of the linked group can find this"           },
  { value: "org",     label: "Org members",         hint: "Only members of the linked organization"                  },
  { value: "private", label: "Private / Link only", hint: "Not discoverable — only accessible via direct link"       },
];

const ACCESS_OPTIONS = [
  { value: "open",     label: "Open — anyone who can find it" },
  { value: "invite",   label: "Invite only"                   },
  { value: "approval", label: "Requires host approval"        },
  { value: "members",  label: "Members only"                  },
];

const CALENDAR_OPTIONS = [
  { value: "personal",  label: "My Calendar"       },
  { value: "group",     label: "Group Calendar"    },
  { value: "org",       label: "Org Calendar"      },
  { value: "business",  label: "Business Calendar" },
];

const REMINDER_OPTIONS = [
  { value: "off",   label: "Off"              },
  { value: "30min", label: "30 min before"    },
  { value: "1hr",   label: "1 hour before"    },
  { value: "3hr",   label: "3 hours before"   },
  { value: "1day",  label: "1 day before"     },
  { value: "2day",  label: "2 days before"    },
  { value: "1week", label: "1 week before"    },
];

const EVENT_CATEGORIES = [
  "Networking", "Professional", "Cultural", "Family",
  "Youth", "Business", "Social", "Volunteer", "Education",
];

const PRESET_QUESTIONS = [
  "Dietary restrictions",
  "Profession / Company",
  "Guest note",
  "T-shirt size",
  "Years in diaspora",
];

const TIME_HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const TIME_MINUTES = ["00", "15", "30", "45"];
const TIME_PERIODS = ["AM", "PM"] as const;
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_DRAFT_KEY = "events:new:draft";

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, color = "teal", disabled = false,
}: {
  checked: boolean; onChange: () => void; color?: "teal" | "rose"; disabled?: boolean;
}) {
  const isPulse = color === "rose";
  
  const trackOff = "bg-white/[0.08] border border-white/[0.05]";
  const trackOnPulse = "bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.30)] border border-rose-400/40";
  const trackOnStandard = "bg-emerald-500/90 border border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
  
  const trackClass = disabled 
    ? "bg-white/[0.04] border border-white/[0.02] opacity-50 cursor-not-allowed" 
    : checked 
      ? (isPulse ? trackOnPulse : trackOnStandard)
      : trackOff;

  let thumbClass = "absolute top-[1px] w-[18px] h-[18px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ";
  
  if (disabled && !checked) {
    thumbClass += "bg-white/20 left-[2px]";
  } else if (!checked) {
    thumbClass += "bg-white/60 left-[2px] shadow-sm";
  } else {
    thumbClass += "bg-white shadow-md left-[calc(100%-21px)]"; 
  }

  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onChange(); }}
      disabled={disabled}
      className={`relative box-border inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full transition-all duration-300 ${trackClass} ${disabled ? "" : "hover:brightness-110"}`}
      aria-checked={checked}
      role="switch"
    >
      <span className={thumbClass}>
        {checked && isPulse && (
          <Activity size={11} strokeWidth={3.5} className="text-rose-500" />
        )}
      </span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/28 mb-2">
      {children}
    </label>
  );
}

function NativeSelect({
  value, onChange, options, label,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; label?: string;
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <PremiumSelect
        value={value}
        onChange={onChange}
        options={options}
        triggerClassName="w-full border-white/[0.09] bg-white/[0.04] text-sm text-white/65"
      />
    </div>
  );
}

function ToggleRow({
  label, sublabel, checked, onChange, color = "teal", disabled = false,
}: {
  label: string; sublabel?: string;
  checked: boolean; onChange: () => void; color?: "teal" | "rose"; disabled?: boolean;
}) {
  return (
    <div className={`flex min-h-[76px] items-center justify-between gap-4 py-4 px-1 border-b border-white/[0.05] last:border-0 ${disabled ? "opacity-60 grayscale-[0.3]" : ""}`}>
      <div className="min-w-0 flex-1 pr-2">
        <div className={`text-sm font-medium ${disabled ? "text-white/50" : "text-white/80"}`}>{label}</div>
        {sublabel && <div className={`text-xs mt-1 leading-snug ${disabled ? "text-white/30" : "text-white/40"}`}>{sublabel}</div>}
      </div>
      <div className="shrink-0 flex items-center justify-end w-14">
        <Toggle checked={checked} onChange={onChange} color={color} disabled={disabled} />
      </div>
    </div>
  );
}

const dateInputCls =
  "w-full max-w-[14.5rem] sm:max-w-none bg-white/[0.04] border border-white/[0.09] rounded-xl px-5 py-2.5 text-sm text-white/70 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";
const timeInputCls =
  "w-[9.25rem] min-w-[9.25rem] shrink-0 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/60 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";

function to12HourParts(value: string) {
  const [rawHour = "18", minute = "00"] = value.split(":");
  const hour24 = Number(rawHour);
  const period: (typeof TIME_PERIODS)[number] = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: TIME_MINUTES.includes(minute) ? minute : "00",
    period,
  };
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function parseDateParts(value: string) {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw) || new Date().getFullYear();
  const month = Number(monthRaw) || 1;
  const day = Number(dayRaw) || 1;
  return { year, month, day };
}

function formatDateValue(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplayDate(value: string) {
  const { year, month, day } = parseDateParts(value);
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
}

function to24HourTime(hour: string, minute: string, period: (typeof TIME_PERIODS)[number]) {
  const parsedHour = Number(hour);
  let hour24 = parsedHour % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

// ── Cover image ───────────────────────────────────────────────────────────────

function CoverImageArea({
  value, onChange,
}: {
  value: string | null; onChange: (v: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `event-covers/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("feed_media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("feed_media").getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 200 }}>
        <img src={value} alt="Cover" className="w-full h-full object-cover" />
        <button
          onClick={() => onChange(null)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/65 backdrop-blur flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="w-full rounded-2xl border border-white/[0.07] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400/15 hover:bg-white/[0.015] transition-colors group"
        style={{ height: 160 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:bg-teal-500/[0.08] group-hover:border-teal-400/15 transition-colors">
          {uploading
            ? <Loader2 size={16} className="text-[var(--accent)] animate-spin" />
            : <Camera size={16} className="text-white/25 group-hover:text-teal-400/50 transition-colors" />
          }
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-white/30 group-hover:text-white/45 transition-colors">
            {uploading ? "Uploading…" : "Add cover photo"}
          </div>
          {!uploading && <div className="text-[10px] text-white/18 mt-0.5">Recommended: 1600 × 900px</div>}
        </div>
      </div>
    </>
  );
}

// ── Section nav item ──────────────────────────────────────────────────────────

function SectionNavItem({
  section, index, active, done, onClick,
}: {
  section: { id: SectionId; label: string; sublabel: string };
  index: number; active: boolean; done: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all ${
        active
          ? "bg-teal-500/[0.07] border border-teal-400/12 text-teal-400"
          : "text-white/36 hover:text-white/58 hover:bg-white/[0.025] border border-transparent"
      }`}
    >
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
        done  ? "bg-teal-500/15 text-teal-400"
        : active ? "bg-teal-400/10 text-teal-400"
        : "bg-white/[0.05] text-white/28"
      }`}>
        {done ? <Check size={9} strokeWidth={3} /> : index + 1}
      </span>
      <div className="min-w-0">
        <div className="font-medium truncate">{section.label}</div>
      </div>
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ index, section }: {
  index: number;
  section: { label: string; sublabel: string };
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-7 h-7 rounded-full bg-teal-500/[0.08] border border-teal-400/15 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-bold text-teal-400/65">{index + 1}</span>
      </div>
      <div>
        <h2 className="text-base font-semibold text-white leading-tight">{section.label}</h2>
        <p className="text-xs text-white/32 mt-0.5">{section.sublabel}</p>
      </div>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`wac-card p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

function getPersonLabel(person: DirectoryPersonOption) {
  return person.full_name || person.username || "WAC Member";
}

function getEntitySubtitle(entity: HostEntityOption | SearchableEntityOption) {
  if ("subtitle" in entity) return entity.subtitle;
  const parts = [entity.type === "organization" ? "Organization" : entity.type === "business" ? "Business" : "Group"];
  if (entity.role) parts.push(entity.role);
  return parts.join(" · ");
}

function hasElevatedEntityRole(role?: string | null) {
  if (!role) return false;
  return role !== "member";
}

function toPersonSnapshot(person: DirectoryPersonOption): EventPersonSnapshot {
  return {
    id: person.id,
    name: getPersonLabel(person),
    username: person.username ?? null,
    avatar_url: person.avatar_url ?? null,
    headline: person.headline ?? null,
  };
}

function toActorPersonSnapshot(actor: { id: string; name: string; slug?: string; avatar_url?: string }): EventPersonSnapshot {
  return {
    id: actor.id,
    name: actor.name,
    username: actor.slug ?? null,
    avatar_url: actor.avatar_url ?? null,
    headline: null,
  };
}

function toEntitySnapshot(entity: HostEntityOption | SearchableEntityOption): EventEntitySnapshot {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    slug: entity.slug,
    role: "role" in entity && typeof entity.role === "string" ? entity.role : null,
  };
}

function SelectedPill({
  label,
  sublabel,
  onRemove,
}: {
  label: string;
  sublabel?: string | null;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-teal-400/15 bg-teal-500/[0.06] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white/80">{label}</div>
        {sublabel ? <div className="truncate text-[11px] text-white/38">{sublabel}</div> : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/65"
        aria-label={`Remove ${label}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

function PersonDirectorySinglePicker({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: DirectoryPersonOption | null;
  onChange: (person: DirectoryPersonOption | null) => void;
  placeholder: string;
  helperText?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryPersonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);




  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await getPeopleDirectory({ q: trimmed });
      setResults(
        data.slice(0, 8).map((person) => ({
          id: person.id,
          full_name: person.full_name,
          username: person.username,
          headline: person.headline,
          avatar_url: person.avatar_url,
        }))
      );
      setLoading(false);
      setOpen(true);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div ref={containerRef}>
      <FieldLabel>{label}</FieldLabel>
      {value ? (
        <SelectedPill
          label={getPersonLabel(value)}
          sublabel={value.username ? `@${value.username}` : value.headline}
          onRemove={() => onChange(null)}
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/65 outline-none transition-colors placeholder:text-white/22 focus:border-teal-400/25"
          />
          {loading ? <div className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-[var(--accent)]/20 border-t-transparent animate-spin" /> : null}
          {open ? (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-white/[0.10] bg-[#161616] shadow-2xl">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/35">No WAC people found.</div>
              ) : (
                results.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onChange(person);
                      setQuery("");
                      setResults([]);
                      setOpen(false);
                    }}
                    className="block w-full border-b border-white/[0.05] px-4 py-3 text-left last:border-b-0 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm font-medium text-white/82">{getPersonLabel(person)}</div>
                    <div className="text-[11px] text-white/35">
                      {[person.username ? `@${person.username}` : null, person.headline].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
      {helperText ? <p className="mt-2 text-[11px] leading-relaxed text-white/28">{helperText}</p> : null}
    </div>
  );
}

function PersonDirectoryMultiPicker({
  label,
  values,
  onChange,
  placeholder,
  helperText,
  excludeIds = [],
}: {
  label: string;
  values: DirectoryPersonOption[];
  onChange: (people: DirectoryPersonOption[]) => void;
  placeholder: string;
  helperText?: string;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryPersonOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await getPeopleDirectory({ q: trimmed });
      const blockedIds = new Set([...excludeIds, ...values.map((person) => person.id)]);
      setResults(
        data
          .filter((person) => !blockedIds.has(person.id))
          .slice(0, 8)
          .map((person) => ({
            id: person.id,
            full_name: person.full_name,
            username: person.username,
            headline: person.headline,
            avatar_url: person.avatar_url,
          }))
      );
      setLoading(false);
      setOpen(true);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [excludeIds, query, values]);

  return (
    <div ref={containerRef}>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-3">
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {values.map((person) => (
              <SelectedPill
                key={person.id}
                label={getPersonLabel(person)}
                sublabel={person.username ? `@${person.username}` : person.headline}
                onRemove={() => onChange(values.filter((entry) => entry.id !== person.id))}
              />
            ))}
          </div>
        ) : null}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setOpen(true); }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/65 outline-none transition-colors placeholder:text-white/22 focus:border-teal-400/25"
          />
          {loading ? <div className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-[var(--accent)]/20 border-t-transparent animate-spin" /> : null}
          {open ? (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-white/[0.10] bg-[#161616] shadow-2xl">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/35">No additional WAC people found.</div>
              ) : (
                results.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onChange([...values, person]);
                      setQuery("");
                      setResults([]);
                      setOpen(false);
                    }}
                    className="block w-full border-b border-white/[0.05] px-4 py-3 text-left last:border-b-0 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm font-medium text-white/82">{getPersonLabel(person)}</div>
                    <div className="text-[11px] text-white/35">
                      {[person.username ? `@${person.username}` : null, person.headline].filter(Boolean).join(" · ")}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </div>
      {helperText ? <p className="mt-2 text-[11px] leading-relaxed text-white/28">{helperText}</p> : null}
    </div>
  );
}

function EntityPicker({
  label,
  value,
  onChange,
  options,
  query,
  onQueryChange,
  placeholder,
  emptyText,
  helperText,
}: {
  label?: string;
  value: HostEntityOption | SearchableEntityOption | null;
  onChange: (entity: HostEntityOption | SearchableEntityOption | null) => void;
  options: Array<HostEntityOption | SearchableEntityOption>;
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  emptyText: string;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={containerRef}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {value ? (
        <SelectedPill
          label={value.name}
          sublabel={getEntitySubtitle(value)}
          onRemove={() => onChange(null)}
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/65 outline-none transition-colors placeholder:text-white/22 focus:border-teal-400/25"
          />
          {open ? (
            <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-white/[0.10] bg-[#161616] shadow-2xl">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-white/35">{emptyText}</div>
              ) : (
                options.map((option) => (
                  <button
                    key={`${option.type}-${option.id}`}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      onQueryChange("");
                      setOpen(false);
                    }}
                    className="block w-full border-b border-white/[0.05] px-4 py-3 text-left last:border-b-0 hover:bg-white/[0.04]"
                  >
                    <div className="text-sm font-medium text-white/82">{option.name}</div>
                    <div className="text-[11px] text-white/35">{getEntitySubtitle(option)}</div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
      {helperText ? <p className="mt-2 text-[11px] leading-relaxed text-white/28">{helperText}</p> : null}
    </div>
  );
}

// ── Inline field (icon + borderless input row) ────────────────────────────────

function InlineField({
  icon: Icon, placeholder, value, onChange, multiline = false,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; multiline?: boolean;
}) {
  const base = "flex-1 bg-transparent text-sm text-white/65 placeholder:text-white/22 outline-none";
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <Icon size={13} className="text-white/28 mt-0.5 shrink-0" />
      {multiline ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} rows={2}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={base}
        />
      )}
    </div>
  );
}

function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const parts = to12HourParts(value);

  return (
    <div className="flex min-w-[14.25rem] shrink-0 items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5">
      <PremiumSelect
        value={parts.hour}
        onChange={(nextHour) => onChange(to24HourTime(nextHour, parts.minute, parts.period))}
        options={TIME_HOURS.map((hour) => ({ value: hour, label: hour }))}
        className="min-w-[3.75rem] flex-1"
        triggerClassName="rounded-lg border-white/[0.07] bg-white/[0.035] px-3.5 py-2 text-sm text-white/80"
      />
      <span className="text-sm text-white/20">:</span>
      <PremiumSelect
        value={parts.minute}
        onChange={(nextMinute) => onChange(to24HourTime(parts.hour, nextMinute, parts.period))}
        options={TIME_MINUTES.map((minute) => ({ value: minute, label: minute }))}
        className="min-w-[4.25rem] flex-1"
        triggerClassName="rounded-lg border-white/[0.07] bg-white/[0.035] px-3.5 py-2 text-sm text-white/80"
      />
      <PremiumSelect
        value={parts.period}
        onChange={(nextPeriod) => onChange(to24HourTime(parts.hour, parts.minute, nextPeriod as (typeof TIME_PERIODS)[number]))}
        options={TIME_PERIODS.map((period) => ({ value: period, label: period }))}
        className="min-w-[4.5rem] shrink-0"
        triggerClassName="rounded-lg border-white/[0.07] bg-white/[0.035] px-3.5 py-2 text-sm text-white/80"
      />
    </div>
  );
}

function MobileDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const initial = parseDateParts(value);
  const [draftYear, setDraftYear] = useState(initial.year);
  const [draftMonth, setDraftMonth] = useState(initial.month);
  const [draftDay, setDraftDay] = useState(initial.day);

  useEffect(() => {
    if (!open) {
      const next = parseDateParts(value);
      setDraftYear(next.year);
      setDraftMonth(next.month);
      setDraftDay(next.day);
    }
  }, [open, value]);

  const maxDay = getDaysInMonth(draftYear, draftMonth - 1);
  const clampedDay = Math.min(draftDay, maxDay);
  const yearOptions = Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 2 + index);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-left text-sm text-white/80 transition-colors hover:border-white/[0.14]"
        aria-label={`Choose ${label.toLowerCase()} date`}
      >
        <span>{formatDisplayDate(value)}</span>
        <Calendar size={18} className="text-white/55" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/60 sm:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close date picker"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full rounded-t-3xl border border-white/[0.08] bg-[#171513] px-4 pb-5 pt-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/10" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/82">{label} date</div>
                <div className="mt-1 text-xs text-white/38">Choose a date that fits comfortably on mobile.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/55"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Month</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {MONTH_NAMES.map((monthName, index) => {
                      const isActive = draftMonth === index + 1;
                      return (
                        <button
                          key={monthName}
                          type="button"
                          onClick={() => setDraftMonth(index + 1)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Day</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {Array.from({ length: maxDay }, (_, index) => index + 1).map((day) => {
                      const isActive = clampedDay === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDraftDay(day)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Year</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {yearOptions.map((year) => {
                      const isActive = draftYear === year;
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setDraftYear(year)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(formatDateValue(draftYear, draftMonth, clampedDay));
                setOpen(false);
              }}
              className="mt-5 w-full rounded-xl bg-teal-500/[0.14] px-4 py-3 text-sm font-semibold text-teal-300"
            >
              Apply date
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MobileTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parts = to12HourParts(value);
  const [draftHour, setDraftHour] = useState(parts.hour);
  const [draftMinute, setDraftMinute] = useState(parts.minute);
  const [draftPeriod, setDraftPeriod] = useState(parts.period);

  useEffect(() => {
    if (!open) {
      const next = to12HourParts(value);
      setDraftHour(next.hour);
      setDraftMinute(next.minute);
      setDraftPeriod(next.period);
    }
  }, [open, value]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-left text-sm text-white/80 transition-colors hover:border-white/[0.14]"
        aria-label={`Choose ${label.toLowerCase()} time`}
      >
        <span>
          {draftHour}:{draftMinute} {draftPeriod}
        </span>
        <Clock size={18} className="text-white/55" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end bg-black/60 sm:hidden">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close time picker"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full rounded-t-3xl border border-white/[0.08] bg-[#171513] px-4 pb-5 pt-4 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/10" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white/82">{label} time</div>
                <div className="mt-1 text-xs text-white/38">Choose a time in 15-minute increments.</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/55"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Hour</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {TIME_HOURS.map((hour) => {
                      const isActive = draftHour === hour;
                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => setDraftHour(hour)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Minute</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {TIME_MINUTES.map((minute) => {
                      const isActive = draftMinute === minute;
                      return (
                        <button
                          key={minute}
                          type="button"
                          onClick={() => setDraftMinute(minute)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {minute}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Period</FieldLabel>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-1.5">
                  <div className="space-y-1">
                    {TIME_PERIODS.map((period) => {
                      const isActive = draftPeriod === period;
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setDraftPeriod(period)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-teal-500/[0.14] text-teal-300"
                              : "text-white/70 hover:bg-white/[0.05]"
                          }`}
                        >
                          {period}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onChange(to24HourTime(draftHour, draftMinute, draftPeriod));
                setOpen(false);
              }}
              className="mt-5 w-full rounded-xl bg-teal-500/[0.14] px-4 py-3 text-sm font-semibold text-teal-300"
            >
              Apply time
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const today = todayStr();
  const router = useRouter();
  const { loggedInUserId, ownedEntities } = useActor();

  const [activeSection, setActiveSection] = useState<SectionId>("basics");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // ─ Event Basics ─
  const [eventKind,    setEventKind]    = useState<"event" | "task">("event");
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [startDate,    setStartDate]    = useState(today);
  const [startTime,    setStartTime]    = useState("18:00");
  const [endDate,      setEndDate]      = useState(today);
  const [endTime,      setEndTime]      = useState("20:00");
  const [allDay,       setAllDay]       = useState(false);
  const [repeat,       setRepeat]       = useState("none");
  const [location,     setLocation]     = useState("");
  const [guests,       setGuests]       = useState("");
  const [virtualLink,  setVirtualLink]  = useState("");
  const [coverImage,   setCoverImage]   = useState<string | null>(null);

  // ─ Hosting & Network ─
  const [hostAs,        setHostAs]        = useState<HostAs>("me");
  const [hostAsSearch,  setHostAsSearch]  = useState("");
  const [selectedHostEntity, setSelectedHostEntity] = useState<HostEntityOption | null>(null);
  const [hostRepresentative, setHostRepresentative] = useState("");
  const [selectedHostRepresentative, setSelectedHostRepresentative] = useState<DirectoryPersonOption | null>(null);
  const [coHosts,       setCoHosts]       = useState("");
  const [selectedCoHosts, setSelectedCoHosts] = useState<DirectoryPersonOption[]>([]);
  const [linkedType,    setLinkedType]    = useState<"" | "group" | "organization" | "business">("");
  const [linkedSearch,  setLinkedSearch]  = useState("");
  const [selectedLinkedEntity, setSelectedLinkedEntity] = useState<SearchableEntityOption | null>(null);
  const [category,      setCategory]      = useState("Networking");
  const [postToPulse,   setPostToPulse]   = useState(true);
  const [managedGroups, setManagedGroups] = useState<HostEntityOption[]>([]);
  const [linkedEntityResults, setLinkedEntityResults] = useState<SearchableEntityOption[]>([]);

  // ─ Publishing ─
  const [calendarDest,      setCalendarDest]      = useState("personal");
  const [discoveryScope,    setDiscoveryScope]    = useState("public");
  const [publishToEvents,   setPublishToEvents]   = useState(true);
  const [publishToEntity,   setPublishToEntity]   = useState(true);
  const [publishToMemberCal, setPublishToMemberCal] = useState(true);

  // ─ Access & RSVP ─
  const [rsvpEnabled,       setRsvpEnabled]       = useState(true);
  const [accessScope,       setAccessScope]       = useState("open");
  const [requireApproval,   setRequireApproval]   = useState(false);
  const [attendanceCap,     setAttendanceCap]     = useState("");
  const [waitlistEnabled,   setWaitlistEnabled]   = useState(false);
  const [plusOnes,          setPlusOnes]          = useState(false);
  const [requireGuestNames, setRequireGuestNames] = useState(false);

  // ─ Advanced ─
  const [questions,       setQuestions]       = useState<QuestionItem[]>([]);
  const [newQText,        setNewQText]        = useState("");
  const [newQType,        setNewQType]        = useState<QuestionItem["type"]>("text");
  const [rsvpReminder,    setRsvpReminder]    = useState("1day");
  const [eventReminder,   setEventReminder]   = useState("1hr");
  const [postEventFollowup, setPostEventFollowup] = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [notice,          setNotice]          = useState<string | null>(null);
  
  

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 640px)");
    const updateViewportMode = () => setIsMobileViewport(media.matches);

    updateViewportMode();
    media.addEventListener("change", updateViewportMode);
    return () => media.removeEventListener("change", updateViewportMode);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadManagedGroups() {
      if (!loggedInUserId) {
        setManagedGroups([]);
        return;
      }

      const { data, error } = await supabase
        .from("group_members")
        .select("role, group:groups!inner(id, name, slug)")
        .eq("profile_id", loggedInUserId)
        .eq("status", "active")
        .in("role", ["owner", "admin"]);

      if (error || cancelled) return;

      const options: HostEntityOption[] = (data ?? []).flatMap((row: any) =>
        row.group
          ? [{
              id: row.group.id,
              type: "group" as const,
              name: row.group.name,
              slug: row.group.slug ?? null,
              role: row.role,
            }]
          : []
      );

      setManagedGroups(options);
    }

    void loadManagedGroups();
    return () => {
      cancelled = true;
    };
  }, [loggedInUserId]);

  useEffect(() => {
    if (hostAs === "me") {
      setSelectedHostEntity(null);
      return;
    }

    if (selectedHostEntity && selectedHostEntity.type !== hostAs) {
      setSelectedHostEntity(null);
    }
  }, [hostAs, selectedHostEntity]);

  useEffect(() => {
    if (!linkedType) {
      setSelectedLinkedEntity(null);
      setLinkedEntityResults([]);
      return;
    }

    if (selectedLinkedEntity && selectedLinkedEntity.type !== linkedType) {
      setSelectedLinkedEntity(null);
    }
  }, [linkedType, selectedLinkedEntity]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = linkedSearch.trim();

    if (!linkedType || !trimmed) {
      setLinkedEntityResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      if (linkedType === "group") {
        const { data } = await supabase
          .from("groups")
          .select("id, name, slug, category")
          .ilike("name", `%${trimmed}%`)
          .order("name")
          .limit(8);

        if (cancelled) return;

        setLinkedEntityResults(
          (data ?? []).map((group: any) => ({
            id: group.id,
            type: "group",
            name: group.name,
            slug: group.slug,
            subtitle: group.category ?? "Group",
          }))
        );
        return;
      }

      const { businesses, organizations } = await getEntitiesDirectory({ q: trimmed });
      if (cancelled) return;

      if (linkedType === "business") {
        setLinkedEntityResults(
          businesses.slice(0, 8).map((business: BusinessProfile) => ({
            id: business.id,
            type: "business",
            name: business.name,
            slug: business.slug,
            subtitle: [business.industry_name, business.city, business.country].filter(Boolean).join(" · ") || "Business",
          }))
        );
        return;
      }

      setLinkedEntityResults(
        organizations.slice(0, 8).map((organization: OrganizationDirectoryEntry) => ({
          id: organization.id,
          type: "organization",
          name: organization.name,
          slug: organization.slug,
          subtitle: [organization.organization_type, organization.city, organization.country].filter(Boolean).join(" · ") || "Organization",
        }))
      );
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [linkedSearch, linkedType]);

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(EVENT_DRAFT_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as Partial<{
        eventKind: "event" | "task";
        title: string;
        description: string;
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
        allDay: boolean;
        repeat: string;
        location: string;
        guests: string;
        virtualLink: string;
        coverImage: string | null;
        hostAs: HostAs;
        hostAsSearch: string;
        selectedHostEntity: HostEntityOption | null;
        hostRepresentative: string;
        selectedHostRepresentative: DirectoryPersonOption | null;
        coHosts: string;
        selectedCoHosts: DirectoryPersonOption[];
        linkedType: "" | "group" | "organization" | "business";
        linkedSearch: string;
        selectedLinkedEntity: SearchableEntityOption | null;
        category: string;
        postToPulse: boolean;
        calendarDest: string;
        discoveryScope: string;
        publishToEvents: boolean;
        publishToEntity: boolean;
        publishToMemberCal: boolean;
        rsvpEnabled: boolean;
        accessScope: string;
        requireApproval: boolean;
        attendanceCap: string;
        waitlistEnabled: boolean;
        plusOnes: boolean;
        requireGuestNames: boolean;
        questions: QuestionItem[];
        rsvpReminder: string;
        eventReminder: string;
        postEventFollowup: boolean;
      }>;

      if (draft.eventKind) setEventKind(draft.eventKind);
      if (typeof draft.title === "string") setTitle(draft.title);
      if (typeof draft.description === "string") setDescription(draft.description);
      if (typeof draft.startDate === "string") setStartDate(draft.startDate);
      if (typeof draft.startTime === "string") setStartTime(draft.startTime);
      if (typeof draft.endDate === "string") setEndDate(draft.endDate);
      if (typeof draft.endTime === "string") setEndTime(draft.endTime);
      if (typeof draft.allDay === "boolean") setAllDay(draft.allDay);
      if (typeof draft.repeat === "string") setRepeat(draft.repeat);
      if (typeof draft.location === "string") setLocation(draft.location);
      if (typeof draft.guests === "string") setGuests(draft.guests);
      if (typeof draft.virtualLink === "string") setVirtualLink(draft.virtualLink);
      if (draft.coverImage === null || typeof draft.coverImage === "string") setCoverImage(draft.coverImage ?? null);
      if (draft.hostAs) setHostAs(draft.hostAs);
      if (typeof draft.hostAsSearch === "string") setHostAsSearch(draft.hostAsSearch);
      if (draft.selectedHostEntity) setSelectedHostEntity(draft.selectedHostEntity);
      if (typeof draft.hostRepresentative === "string") setHostRepresentative(draft.hostRepresentative);
      if (draft.selectedHostRepresentative) setSelectedHostRepresentative(draft.selectedHostRepresentative);
      if (typeof draft.coHosts === "string") setCoHosts(draft.coHosts);
      if (Array.isArray(draft.selectedCoHosts)) setSelectedCoHosts(draft.selectedCoHosts);
      if (draft.linkedType !== undefined) setLinkedType(draft.linkedType);
      if (typeof draft.linkedSearch === "string") setLinkedSearch(draft.linkedSearch);
      if (draft.selectedLinkedEntity) setSelectedLinkedEntity(draft.selectedLinkedEntity);
      if (typeof draft.category === "string") setCategory(draft.category);
      if (typeof draft.postToPulse === "boolean") setPostToPulse(draft.postToPulse);
      if (typeof draft.calendarDest === "string") setCalendarDest(draft.calendarDest);
      if (typeof draft.discoveryScope === "string") setDiscoveryScope(draft.discoveryScope);
      if (typeof draft.publishToEvents === "boolean") setPublishToEvents(draft.publishToEvents);
      if (typeof draft.publishToEntity === "boolean") setPublishToEntity(draft.publishToEntity);
      if (typeof draft.publishToMemberCal === "boolean") setPublishToMemberCal(draft.publishToMemberCal);
      if (typeof draft.rsvpEnabled === "boolean") setRsvpEnabled(draft.rsvpEnabled);
      if (typeof draft.accessScope === "string") setAccessScope(draft.accessScope);
      if (typeof draft.requireApproval === "boolean") setRequireApproval(draft.requireApproval);
      if (typeof draft.attendanceCap === "string") setAttendanceCap(draft.attendanceCap);
      if (typeof draft.waitlistEnabled === "boolean") setWaitlistEnabled(draft.waitlistEnabled);
      if (typeof draft.plusOnes === "boolean") setPlusOnes(draft.plusOnes);
      if (typeof draft.requireGuestNames === "boolean") setRequireGuestNames(draft.requireGuestNames);
      if (Array.isArray(draft.questions)) setQuestions(draft.questions);
      if (typeof draft.rsvpReminder === "string") setRsvpReminder(draft.rsvpReminder);
      if (typeof draft.eventReminder === "string") setEventReminder(draft.eventReminder);
      if (typeof draft.postEventFollowup === "boolean") setPostEventFollowup(draft.postEventFollowup);
    } catch {
      window.localStorage.removeItem(EVENT_DRAFT_KEY);
    }
  }, []);

  // Question helpers
  function addPreset(text: string) {
    if (questions.some((q) => q.text === text)) return;
    setQuestions((p) => [...p, { id: Date.now().toString(), text, type: "text", required: false }]);
  }
  function addCustomQ() {
    if (!newQText.trim()) return;
    setQuestions((p) => [...p, { id: Date.now().toString(), text: newQText.trim(), type: newQType, required: false }]);
    setNewQText("");
  }
  function removeQ(id: string) { setQuestions((p) => p.filter((q) => q.id !== id)); }
  function updateQ<K extends keyof QuestionItem>(i: number, key: K, val: QuestionItem[K]) {
    setQuestions((p) => p.map((q, idx) => (idx === i ? { ...q, [key]: val } : q)));
  }

  // Navigation
  const currentIdx = SECTION_IDS.indexOf(activeSection);
  const canPrev    = currentIdx > 0;
  const canNext    = currentIdx < SECTION_IDS.length - 1;

  function goTo(id: SectionId) {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const managedEntityOptions: HostEntityOption[] = [
    ...ownedEntities
      .filter((entity) =>
        (entity.type === "organization" || entity.type === "business") &&
        hasElevatedEntityRole(entity.role)
      )
      .map((entity) => ({
        id: entity.id,
        type: entity.type as "organization" | "business",
        name: entity.name,
        slug: entity.slug ?? null,
        role: entity.role,
      })),
    ...managedGroups,
  ];

  const filteredManagedHostOptions = managedEntityOptions.filter((entity) => {
    if (hostAs === "me") return false;
    if (entity.type !== hostAs) return false;
    const query = hostAsSearch.trim().toLowerCase();
    if (!query) return true;
    return `${entity.name} ${entity.slug ?? ""} ${entity.role ?? ""}`.toLowerCase().includes(query);
  });
  const personalHostActor =
    ownedEntities.find((entity) => entity.type === "person" && entity.id === loggedInUserId) ??
    ownedEntities.find((entity) => entity.type === "person") ??
    null;

  function handleSaveDraft() {
    const payload = {
      eventKind,
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      allDay,
      repeat,
      location,
      guests,
      virtualLink,
      coverImage,
      hostAs,
      hostAsSearch,
      selectedHostEntity,
      hostRepresentative,
      selectedHostRepresentative,
      coHosts,
      selectedCoHosts,
      linkedType,
      linkedSearch,
      selectedLinkedEntity,
      category,
      postToPulse,
      calendarDest,
      discoveryScope,
      publishToEvents,
      publishToEntity,
      publishToMemberCal,
      rsvpEnabled,
      accessScope,
      requireApproval,
      attendanceCap,
      waitlistEnabled,
      plusOnes,
      requireGuestNames,
      questions,
      rsvpReminder,
      eventReminder,
      postEventFollowup,
    };

    window.localStorage.setItem(EVENT_DRAFT_KEY, JSON.stringify(payload));
    setError(null);
    setNotice("Draft saved on this device.");
  }

  async function handlePublish() {
    if (!title.trim()) {
      toast.error("An event title is required.");
      return;
    }

    if (hostAs !== "me" && !selectedHostEntity) {
      toast.error("Choose the organization, business, or group that is hosting this event.");
      return;
    }

    if (hostAs !== "me" && !selectedHostRepresentative) {
      toast.error("Choose the WAC person who represents the hosting entity.");
      return;
    }

    if (
      hostAs !== "me" &&
      selectedHostEntity &&
      !managedEntityOptions.some((entity) => entity.id === selectedHostEntity.id && entity.type === selectedHostEntity.type)
    ) {
      toast.error("You can only host as an organization or business when you have a role above Member on WAC.");
      return;
    }

    const start = new Date(`${startDate}T${allDay ? "00:00" : startTime}:00`);
    if (Number.isNaN(start.getTime())) {
      toast.error("Please choose a valid start date and time.");
      return;
    }

    let end = new Date(`${endDate}T${allDay ? "23:59" : endTime}:00`);
    if (Number.isNaN(end.getTime()) || end <= start) {
      end = new Date(start);
      end.setHours(end.getHours() + (allDay ? 24 : 2));
    }

    setIsSubmitting(true);
    setNotice(null);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to publish an event.");
      }

      const visibilityMap: Record<string, string> = {
        public: "public",
        private: "private",
        network: "members",
        group: "members",
        org: "members",
      };

      const capacityValue = attendanceCap.trim() ? Number(attendanceCap.trim()) : null;
      if (capacityValue !== null && (!Number.isInteger(capacityValue) || capacityValue < 1)) {
        throw new Error("Capacity must be a whole number greater than 0.");
      }

      const primaryHost =
        hostAs === "me"
          ? personalHostActor
            ? toActorPersonSnapshot(personalHostActor)
            : {
                id: user.id,
                name: "WAC Member",
                username: null,
                avatar_url: null,
                headline: null,
              }
          : selectedHostRepresentative
          ? toPersonSnapshot(selectedHostRepresentative)
          : null;
      const hostEntity = hostAs === "me" || !selectedHostEntity ? null : toEntitySnapshot(selectedHostEntity);
      const linkedEntity = publishToEntity && selectedLinkedEntity ? toEntitySnapshot(selectedLinkedEntity) : null;
      const hostingMetadata: EventHostingMetadata = {
        version: 1,
        host_mode: hostAs === "me" ? "person" : hostAs,
        primary_host: primaryHost,
        host_entity: hostEntity,
        representative: hostAs === "me" ? primaryHost : primaryHost,
        co_hosts: selectedCoHosts.map(toPersonSnapshot),
        linked_entity: linkedEntity,
      };
      const effectiveOrganizationId =
        linkedEntity?.type === "organization"
          ? linkedEntity.id
          : hostEntity?.type === "organization"
          ? hostEntity.id
          : null;

      const { data: insertedEvent, error: insertError } = await supabase
        .from("events")
        .insert({
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        location_name: location.trim() || null,
        event_type: category || null,
        virtual_link: virtualLink.trim() || null,
        cover_image_url: coverImage,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        visibility: visibilityMap[discoveryScope] ?? "public",
        rsvp_enabled: rsvpEnabled,
        access_mode: accessScope,
        requires_approval: requireApproval,
        capacity: capacityValue,
        waitlist_enabled: waitlistEnabled,
        allow_plus_ones: plusOnes,
        require_guest_names: requireGuestNames,
        organization_id: effectiveOrganizationId,
        host_entity_type: hostEntity?.type ?? null,
        host_entity_id: hostEntity?.id ?? null,
        linked_entity_type: linkedEntity?.type ?? null,
        linked_entity_id: linkedEntity?.id ?? null,
        hosting_metadata: hostingMetadata,
        created_by: user.id,
      })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      const questionRows = questions
        .map((question, index) => ({
          event_id: insertedEvent.id,
          question_text: question.text.trim(),
          question_type: question.type,
          is_required: question.required,
          sort_order: index,
        }))
        .filter((question) => question.question_text.length > 0);

      if (questionRows.length > 0) {
        const { error: questionsError } = await supabase.from("event_questions").insert(questionRows);
        if (questionsError) {
          throw questionsError;
        }
      }

      window.localStorage.removeItem(EVENT_DRAFT_KEY);
      router.push("/events");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish event.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-32">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-white/36 hover:text-white/65 transition-colors"
          >
            <ChevronLeft size={15} strokeWidth={2} />
            Events
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-white/22 font-semibold">Create Event</span>
        </div>

        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white mb-6">
          <span className="italic font-light opacity-90 text-teal-400">New</span> Event
        </h1>

        {/* Cover */}
        <CoverImageArea value={coverImage} onChange={setCoverImage} />

        {/* Two-column layout */}
        <div className="mt-8 flex gap-6 lg:gap-10 items-start">

          {/* Left sidebar nav */}
          <aside className="hidden md:block w-44 shrink-0 sticky top-24 self-start">
            <nav className="space-y-0.5">
              {SECTIONS.map((section, idx) => (
                <SectionNavItem
                  key={section.id}
                  section={section}
                  index={idx}
                  active={activeSection === section.id}
                  done={SECTION_IDS.indexOf(section.id) < currentIdx}
                  onClick={() => goTo(section.id)}
                />
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">

            {/* Mobile tabs */}
            <div
              className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 mb-6"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {SECTIONS.map((section, idx) => (
                <button
                  key={section.id}
                  onClick={() => goTo(section.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    activeSection === section.id
                      ? "border-teal-400/25 bg-teal-500/[0.08] text-teal-400"
                      : "border-white/[0.09] text-white/36 hover:text-white/58"
                  }`}
                >
                  {idx + 1}. {section.label}
                </button>
              ))}
            </div>

            {/* ── 1. Event Basics ─────────────────────────────────────────── */}
            {activeSection === "basics" && (
              <div className="space-y-4">
                <SectionHeader index={0} section={SECTIONS[0]} />

                {/* What */}
                <Card>
                  {/* Event / Task toggle */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full w-fit mb-5">
                    {(["event", "task"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setEventKind(k)}
                        className={`px-4 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                          eventKind === k
                            ? "bg-teal-500/[0.12] text-teal-400"
                            : "text-white/36 hover:text-white/60"
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>

                  {/* Title */}
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                    autoFocus
                    className="w-full text-lg font-semibold bg-transparent border-b border-white/[0.09] pb-3 mb-4 text-white placeholder:text-white/20 outline-none focus:border-teal-400/25 transition-colors"
                  />

                  {/* Description */}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this event — what to expect, who it's for, why it matters..."
                    rows={3}
                    className="w-full bg-transparent text-sm text-white/65 placeholder:text-white/20 outline-none resize-none border-b border-white/[0.06] pb-3 focus:border-teal-400/20 transition-colors"
                  />
                </Card>

                {/* When */}
                <Card>
                  <FieldLabel>Start</FieldLabel>
                  <div className="mb-4 flex w-full max-w-[46rem] flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <WacDatePicker
                        value={startDate}
                        onChange={setStartDate}
                      />
                    </div>
                    {!allDay && (
                      <div className="flex shrink-0 items-center w-full sm:w-auto sm:min-w-[140px]">
                        <WacTimePicker
                          value={startTime}
                          onChange={setStartTime}
                        />
                      </div>
                    )}
                  </div>

                  <FieldLabel>End</FieldLabel>
                  <div className="mb-4 flex w-full max-w-[46rem] flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <WacDatePicker
                        value={endDate}
                        onChange={setEndDate}
                      />
                    </div>
                    {!allDay && (
                      <div className="flex shrink-0 items-center w-full sm:w-auto sm:min-w-[140px]">
                        <WacTimePicker
                          value={endTime}
                          onChange={setEndTime}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex w-full max-w-[46rem] items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Toggle checked={allDay} onChange={() => setAllDay(!allDay)} />
                      <span className="text-sm text-white/48">All day</span>
                    </label>
                    <div className="flex items-center gap-2 text-sm text-white/45">
                      <span className="text-white/25 text-xs">Repeat</span>
                      <PremiumSelect
                        value={repeat}
                        onChange={setRepeat}
                        options={REPEAT_OPTIONS}
                        className="min-w-[14rem]"
                        triggerClassName="border-white/[0.1] bg-white/[0.02] text-sm text-white/62"
                      />
                    </div>
                  </div>
                </Card>

                {/* Where & who */}
                <Card>
                  <InlineField icon={MapPin}   placeholder="Add location or venue"               value={location}    onChange={setLocation} />
                  <InlineField icon={Globe}    placeholder="Virtual link (Zoom, Meet, etc.)"     value={virtualLink} onChange={setVirtualLink} />
                  <InlineField icon={UserPlus} placeholder="Invite guests (names, emails, @handles)" value={guests}  onChange={setGuests} />
                </Card>
              </div>
            )}

            {/* ── 2. Hosting & Network ──────────────────────────────────────── */}
            {activeSection === "hosting" && (
              <div className="space-y-4">
                <SectionHeader index={1} section={SECTIONS[1]} />

                {/* Host identity */}
                <Card>
                  <p className="mb-4 text-xs leading-relaxed text-white/42">
                    Start with a person on WAC first. If an organization, business, or group is hosting, keep a clear person attached as the representative or point of contact.
                  </p>
                  <FieldLabel>Host as</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(["me", "organization", "business", "group"] as HostAs[]).map((opt) => {
                      const label = {
                        me: "Person first",
                        organization: "Organization host",
                        business: "Business host",
                        group: "Group host",
                      }[opt];
                      const active = hostAs === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setHostAs(opt)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                            active
                              ? "border-teal-400/22 bg-teal-500/[0.08] text-teal-400"
                              : "border-white/[0.09] text-white/42 hover:text-white/62 hover:border-white/14"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {hostAs === "me" ? (
                    <div className="rounded-xl border border-teal-400/12 bg-teal-500/[0.05] px-4 py-3 text-xs leading-relaxed text-white/52 mb-4">
                      Your person profile is the primary host. You can still link an organization, business, or group below so people understand who this event is connected to.
                    </div>
                  ) : (
                    <div className="space-y-4 mb-4">
                      <div className="rounded-xl border border-amber-400/12 bg-amber-500/[0.05] px-4 py-3 text-xs leading-relaxed text-white/52">
                        Use an entity as the host only when the hosting person actually represents it on WAC, such as the creator, owner, or an assigned admin. If that relationship is not established yet, keep the person as the host and link the entity below instead.
                      </div>
                      <EntityPicker
                        label={`Choose ${hostAs === "organization" ? "organization" : hostAs === "business" ? "business" : "group"} you manage`}
                        value={selectedHostEntity}
                        onChange={(entity) => setSelectedHostEntity(entity as HostEntityOption | null)}
                        options={filteredManagedHostOptions}
                        query={hostAsSearch}
                        onQueryChange={setHostAsSearch}
                        placeholder={`Search your ${hostAs === "organization" ? "organizations" : hostAs === "business" ? "businesses" : "groups"}...`}
                        emptyText={`No managed ${hostAs === "organization" ? "organizations" : hostAs === "business" ? "businesses" : "groups"} found for this search.`}
                        helperText={filteredManagedHostOptions.length === 0 && managedEntityOptions.filter((entity) => entity.type === hostAs).length === 0
                          ? hostAs === "group"
                            ? "You do not currently manage any groups on WAC. Keep the event person-hosted unless that access is added first."
                            : `You need a role above Member on a ${hostAs === "organization" ? "WAC organization" : "WAC business"} to host on its behalf. Keep the event person-hosted unless that access is added first.`
                          : hostAs === "group"
                          ? "Only groups you manage on WAC appear here."
                          : "Only organizations and businesses where you have a role above Member appear here."}
                      />
                      <PersonDirectorySinglePicker
                        label="Primary representative on WAC"
                        value={selectedHostRepresentative}
                        onChange={(person) => {
                          setSelectedHostRepresentative(person);
                          setHostRepresentative(person ? getPersonLabel(person) : "");
                        }}
                        placeholder="Search the person who will represent this host..."
                        helperText="This keeps the hosting entity clear while showing members who the real point of contact is."
                      />
                    </div>
                  )}

                  <div className="border-t border-white/[0.05] pt-4">
                    <PersonDirectoryMultiPicker
                      label="Co-host people on WAC"
                      values={selectedCoHosts}
                      onChange={(people) => {
                        setSelectedCoHosts(people);
                        setCoHosts(people.map((person) => getPersonLabel(person)).join(", "));
                      }}
                      placeholder="Search people in WAC Directory by name or @handle"
                      helperText="Add people first by their WAC profile. If they represent an organization or business, their person profile should still be the primary co-host entry."
                      excludeIds={[
                        ...(selectedHostRepresentative ? [selectedHostRepresentative.id] : []),
                        ...(loggedInUserId ? [loggedInUserId] : []),
                      ]}
                    />
                  </div>
                </Card>

                {/* Network links */}
                <Card>
                  <FieldLabel>Link a supporting organization, business, or group</FieldLabel>
                  <p className="text-[11px] text-white/28 mb-3 leading-relaxed">
                    Use this when the event should appear on an entity page, even if the primary host is still a person. This is the clearest option when a staff member is the point of contact but the organization is the real host.
                  </p>
                  <div className="flex gap-2 mb-5">
                    <PremiumSelect
                      value={linkedType}
                      onChange={(nextValue) => {
                        setLinkedType(nextValue as typeof linkedType);
                        setLinkedSearch("");
                        setSelectedLinkedEntity(null);
                      }}
                      options={[
                        { value: "", label: "None" },
                        { value: "group", label: "Group" },
                        { value: "organization", label: "Organization" },
                        { value: "business", label: "Business" },
                      ]}
                      className="w-40 shrink-0"
                      triggerClassName="bg-white/[0.04] text-sm text-white/60"
                    />
                    {linkedType ? (
                      <div className="flex-1">
                        <EntityPicker
                          label=""
                          value={selectedLinkedEntity}
                          onChange={(entity) => setSelectedLinkedEntity(entity as SearchableEntityOption | null)}
                          options={linkedEntityResults.filter((entity) => entity.type === linkedType)}
                          query={linkedSearch}
                          onQueryChange={setLinkedSearch}
                          placeholder={`Search ${linkedType}s in WAC Directory...`}
                          emptyText={`No ${linkedType}s found in WAC Directory.`}
                        />
                      </div>
                    ) : null}
                  </div>

                  <NativeSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </Card>

              </div>
            )}

            {/* ── 3. Publishing ──────────────────────────────────────────────── */}
            {activeSection === "publishing" && (
              <div className="space-y-4">
                <SectionHeader index={2} section={SECTIONS[2]} />

                <div className="rounded-2xl border border-emerald-400/12 bg-emerald-500/[0.05] px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                      Highly Recommended
                    </span>
                    <span className="text-sm font-medium text-white/76">Publish broadly by default</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/44">
                    This gives the event the best chance to spread across WAC quickly, surface in Pulse, appear in event discovery, and reach followers where they already pay attention.
                  </p>
                </div>

                {/* Publish surfaces */}
                <Card>
                  <FieldLabel>Publish to</FieldLabel>
                  <div className="flex min-h-[76px] items-center justify-between gap-4 border-b border-white/[0.05] py-4 px-1 pb-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3 pr-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-400/12 bg-rose-500/[0.08]">
                        <Activity size={13} className="text-rose-400/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white/80">Publish to Pulse</div>
                        <div className="text-xs text-white/40 mt-1 leading-snug">
                          Pulse is the fastest way to push this event across WAC and get it seen beyond people already browsing the directory.
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-end w-14">
                      <Toggle checked={postToPulse} onChange={() => setPostToPulse(!postToPulse)} color="rose" />
                    </div>
                  </div>
                  <ToggleRow
                    label="Events directory"
                    sublabel="Appears in WAC Events, search, and discovery feeds"
                    checked={publishToEvents}
                    onChange={() => setPublishToEvents(!publishToEvents)}
                  />
                  <ToggleRow
                    label={linkedType ? `${linkedType.charAt(0).toUpperCase() + linkedType.slice(1)} page` : "Entity page"}
                    sublabel={linkedType ? `Shows on the linked ${linkedType}'s profile` : "Link to an entity in Hosting to enable this"}
                    checked={publishToEntity && !!linkedType}
                    onChange={() => { if (linkedType) setPublishToEntity(!publishToEntity); }}
                  />
                  <ToggleRow
                    label="Follower calendars"
                    sublabel="Surfaces automatically in followers' My Calendar"
                    checked={publishToMemberCal}
                    onChange={() => setPublishToMemberCal(!publishToMemberCal)}
                  />
                </Card>

                {/* Calendar destination */}
                <Card>
                  <NativeSelect
                    label="Add to calendar"
                    value={calendarDest}
                    onChange={setCalendarDest}
                    options={CALENDAR_OPTIONS}
                  />
                </Card>

                {/* Discoverability */}
                <Card>
                  <FieldLabel>Who can find this event</FieldLabel>
                  <div className="space-y-2">
                    {DISCOVERY_OPTIONS.map((opt) => {
                      const active = discoveryScope === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setDiscoveryScope(opt.value)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
                            active
                              ? "border-teal-400/22 bg-teal-500/[0.07]"
                              : "border-white/[0.07] hover:border-white/12 hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border overflow-hidden transition-colors ${
                            active ? "border-teal-400 bg-teal-400/12" : "border-white/25"
                          }`}>
                            <div className={`h-2 w-2 rounded-full transition-colors ${active ? "bg-teal-400" : "bg-transparent"}`} />
                          </div>
                          <div>
                            <div className={`text-sm font-medium transition-colors ${active ? "text-teal-400" : "text-white/65"}`}>
                              {opt.label}
                            </div>
                            <div className="text-xs text-white/28 mt-0.5 leading-snug">{opt.hint}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* ── 4. Access & RSVP ──────────────────────────────────────────── */}
            {activeSection === "access" && (
              <div className="space-y-4">
                <SectionHeader index={3} section={SECTIONS[3]} />

                <Card>
                  <ToggleRow
                    label="Accept RSVPs"
                    sublabel="Allow guests to register for this event"
                    checked={rsvpEnabled}
                    onChange={() => setRsvpEnabled(!rsvpEnabled)}
                  />

                  {rsvpEnabled && (
                    <div className="mt-2 pt-2 border-t border-white/[0.05] space-y-0">
                      <NativeSelect
                        label="Invite rules"
                        value={accessScope}
                        onChange={setAccessScope}
                        options={ACCESS_OPTIONS}
                      />
                    </div>
                  )}
                </Card>

                {rsvpEnabled && (
                  <>
                    <Card>
                      <FieldLabel>Attendance cap</FieldLabel>
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="text-sm text-white/55">Limit total attendees</div>
                        <Toggle
                          checked={!!attendanceCap}
                          onChange={() => setAttendanceCap(attendanceCap ? "" : "100")}
                        />
                      </div>
                      {attendanceCap && (
                        <input
                          type="number"
                          value={attendanceCap}
                          onChange={(e) => setAttendanceCap(e.target.value)}
                          placeholder="Maximum guests"
                          min="1"
                          className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors"
                        />
                      )}
                    </Card>

                    <Card>
                      <ToggleRow
                        label="Require approval"
                        sublabel="Review and approve each RSVP before it's confirmed"
                        checked={requireApproval}
                        onChange={() => setRequireApproval(!requireApproval)}
                      />
                      {!!attendanceCap && (
                        <ToggleRow
                          label="Enable waitlist"
                          sublabel="Continue accepting RSVPs after capacity is reached"
                          checked={waitlistEnabled}
                          onChange={() => setWaitlistEnabled(!waitlistEnabled)}
                        />
                      )}
                      <ToggleRow
                        label="Allow plus ones"
                        sublabel="Guests can bring additional people"
                        checked={plusOnes}
                        onChange={() => setPlusOnes(!plusOnes)}
                      />
                      <ToggleRow
                        label="Collect guest names"
                        sublabel="Require names for all guests, including plus ones"
                        checked={requireGuestNames}
                        onChange={() => setRequireGuestNames(!requireGuestNames)}
                      />
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ── 5. Advanced Settings ──────────────────────────────────────── */}
            {activeSection === "advanced" && (
              <div className="space-y-4">
                <SectionHeader index={4} section={SECTIONS[4]} />

                {/* Questionnaire */}
                <Card>
                  <FieldLabel>RSVP questionnaire</FieldLabel>
                  <p className="text-[11px] text-white/28 mb-4 leading-relaxed">
                    Collect information from guests when they RSVP.
                  </p>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {PRESET_QUESTIONS.map((q) => {
                      const added = questions.some((item) => item.text === q);
                      return (
                        <button
                          key={q}
                          onClick={() => addPreset(q)}
                          disabled={added}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            added
                              ? "border-teal-400/18 bg-teal-500/[0.06] text-teal-400/55 cursor-default"
                              : "border-white/[0.09] text-white/40 hover:text-white/60 hover:border-white/16"
                          }`}
                        >
                          {added ? <Check size={9} strokeWidth={3} /> : <Plus size={9} />}
                          {q}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question list */}
                  {questions.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {questions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.07] rounded-xl">
                          <div className="flex-1 min-w-0 space-y-2">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => updateQ(i, "text", e.target.value)}
                              className="w-full bg-transparent text-sm text-white/68 outline-none"
                            />
                            <div className="flex items-center gap-3">
                              <PremiumSelect
                                value={q.type}
                                onChange={(nextValue) => updateQ(i, "type", nextValue as QuestionItem["type"])}
                                options={[
                                  { value: "text", label: "Short answer" },
                                  { value: "yesno", label: "Yes / No" },
                                  { value: "choice", label: "Multiple choice" },
                                ]}
                                triggerClassName="min-h-8 rounded-lg border-white/[0.07] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55"
                              />
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <Toggle checked={q.required} onChange={() => updateQ(i, "required", !q.required)} />
                                <span className="text-[11px] text-white/32">Required</span>
                              </label>
                            </div>
                          </div>
                          <button
                            onClick={() => removeQ(q.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/22 hover:text-white/50 hover:bg-white/[0.05] transition-colors shrink-0 mt-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add custom question */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQText}
                      onChange={(e) => setNewQText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomQ()}
                      placeholder="Add a custom question..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors"
                    />
                    <PremiumSelect
                      value={newQType}
                      onChange={(nextValue) => setNewQType(nextValue as QuestionItem["type"])}
                      options={[
                        { value: "text", label: "Short" },
                        { value: "yesno", label: "Yes/No" },
                        { value: "choice", label: "Choice" },
                      ]}
                      className="shrink-0 min-w-[8.5rem]"
                      triggerClassName="bg-white/[0.04] text-sm text-white/55"
                    />
                    <button
                      onClick={addCustomQ}
                      disabled={!newQText.trim()}
                      className="w-10 h-10 rounded-xl bg-teal-500/[0.08] border border-teal-400/15 flex items-center justify-center text-teal-400/55 hover:text-teal-400 hover:bg-teal-500/[0.13] transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </Card>

                {/* Reminders */}
                <Card>
                  <FieldLabel>Reminders</FieldLabel>

                  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <Bell size={13} className="text-white/25 shrink-0" />
                      <div>
                        <div className="text-sm text-white/68">RSVP reminder</div>
                        <div className="text-xs text-white/28 mt-0.5">Remind guests who haven&apos;t responded</div>
                      </div>
                    </div>
                    <NativeSelect value={rsvpReminder} onChange={setRsvpReminder} options={REMINDER_OPTIONS} />
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <Radio size={13} className="text-white/25 shrink-0" />
                      <div>
                        <div className="text-sm text-white/68">Event reminder</div>
                        <div className="text-xs text-white/28 mt-0.5">Notify confirmed attendees before the event</div>
                      </div>
                    </div>
                    <NativeSelect value={eventReminder} onChange={setEventReminder} options={REMINDER_OPTIONS} />
                  </div>

                  <ToggleRow
                    label="Post-event follow-up"
                    sublabel="Send a message to attendees after the event ends"
                    checked={postEventFollowup}
                    onChange={() => setPostEventFollowup(!postEventFollowup)}
                  />
                </Card>

                {/* Stubs */}
                <Card className="opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/55">Media &amp; Photo Album</div>
                      <div className="text-xs text-white/28 mt-0.5">Guest photo uploads and event album</div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 border border-white/[0.1] px-2.5 py-1 rounded-full">
                      Coming soon
                    </span>
                  </div>
                </Card>

                <Card className="opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/55">Guest permissions</div>
                      <div className="text-xs text-white/28 mt-0.5">Who can invite, share, and see the guest list</div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25 border border-white/[0.1] px-2.5 py-1 rounded-full">
                      Coming soon
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--background)]/92 backdrop-blur-xl border-t border-white/[0.07]">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

          <button
            onClick={() => canPrev && goTo(SECTION_IDS[currentIdx - 1] as SectionId)}
            disabled={!canPrev}
            className="flex items-center gap-1.5 text-xs font-medium text-white/32 hover:text-white/58 transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft size={13} />
            <span className="hidden sm:inline">{canPrev ? SECTIONS[currentIdx - 1].label : ""}</span>
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SECTIONS.map(({ id }, idx) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`rounded-full transition-all ${
                  activeSection === id ? "w-5 h-1.5 bg-teal-400" : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={handleSaveDraft} className="wac-btn-secondary wac-btn-md">
              Save Draft
            </button>
            {canNext ? (
              <button
                onClick={() => goTo(SECTION_IDS[currentIdx + 1] as SectionId)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-medium tracking-[0.02em] text-white/62 hover:bg-white/[0.09] hover:text-white/80 transition-colors"
              >
                <span className="hidden sm:inline">{SECTIONS[currentIdx + 1].label}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={12} />
              </button>
            ) : (
              <button
                onClick={() => void handlePublish()}
                disabled={!title.trim() || isSubmitting}
                className="wac-btn-primary wac-btn-md disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Publishing..." : "Publish Event"}
              </button>
            )}
          </div>
        </div>
      </div>

      {(notice || error) && (
        <div className="fixed bottom-20 right-4 z-50 max-w-sm">
          {notice && (
            <div className="mb-2 rounded-xl border border-teal-400/25 bg-teal-500/10 px-4 py-3 text-sm text-teal-100">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
