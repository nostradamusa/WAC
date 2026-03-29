"use client";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventsResults from "@/components/events/EventsResults";
import PremiumSelect from "@/components/ui/PremiumSelect";
import WacDatePicker from "@/components/ui/WacDatePicker";
import WacTimePicker from "@/components/ui/WacTimePicker";
import { supabase } from "@/lib/supabase";
import SectionLabel from "@/components/ui/SectionLabel";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Building2,
  Network,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Link2,
  Trash2,
  AlignJustify,
  LayoutGrid,
  CalendarRange,
  X,
  ChevronDown,
  RotateCcw,
  UserPlus,
  AlignLeft,
  Eye,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  Check,
  Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Lens        = "discover" | "calendar";
type CalViewMode = "month" | "agenda";
type TabId       = "basics" | "hosting" | "publishing" | "advanced";

interface EventDraft {
  type:        "event" | "task";
  title:       string;
  startDate:   string;
  startTime:   string;
  endDate:     string;
  endTime:     string;
  allDay:      boolean;
  repeat:      string;
  guests:      string;
  location:    string;
  description: string;
  calendar:    string;
  visibility:  string;
}

interface QuestionItem {
  id:       string;
  text:     string;
  type:     "text" | "yesno" | "choice";
  required: boolean;
}

type CalSource = "group" | "org" | "business";
type CalendarSourceFilter = "wac" | CalSource;
type CalendarSourcePreferences = Record<CalendarSourceFilter, boolean>;
type SavedCalendarEntity = {
  id: string;
  name: string;
  entityType: "organization" | "business" | "group";
};

// ── Two-level source bucket model ────────────────────────────────────────────
type SourceBucketMode = "off" | "all" | "custom";
type SourceBucketState = {
  mode: SourceBucketMode;
  selected: Set<string>; // entity IDs when mode === "custom"
};
type SourceBucketPreferences = Record<CalendarSourceFilter, SourceBucketState>;

const DEFAULT_BUCKET_STATE: SourceBucketState = { mode: "all", selected: new Set() };
const DEFAULT_SOURCE_BUCKETS: SourceBucketPreferences = {
  wac:      { mode: "all", selected: new Set() },
  org:      { mode: "all", selected: new Set() },
  group:    { mode: "all", selected: new Set() },
  business: { mode: "all", selected: new Set() },
};

// Legacy flat preferences (still used for DB persistence format)
const DEFAULT_CALENDAR_SOURCE_PREFERENCES: CalendarSourcePreferences = {
  wac: true,
  org: true,
  group: true,
  business: true,
};

const CORE_CALENDAR_SOURCE_IDS: CalendarSourceFilter[] = ["wac", "org", "group", "business"];

// Convert bucket preferences → legacy flat format for DB save (backward compat)
function bucketsToLegacyPreferences(buckets: SourceBucketPreferences): CalendarSourcePreferences {
  return {
    wac:      buckets.wac.mode !== "off",
    org:      buckets.org.mode !== "off",
    group:    buckets.group.mode !== "off",
    business: buckets.business.mode !== "off",
  };
}

// Convert bucket preferences → flat Set<string> for backward-compat with activeSources consumers
function bucketsToActiveSourceSet(buckets: SourceBucketPreferences): Set<string> {
  return new Set(CORE_CALENDAR_SOURCE_IDS.filter((id) => buckets[id].mode !== "off"));
}

// Serializable form of bucket preferences for localStorage persistence
type SerializedBucketPreferences = Record<CalendarSourceFilter, { mode: SourceBucketMode; selected: string[] }>;

function serializeBuckets(buckets: SourceBucketPreferences): SerializedBucketPreferences {
  const result = {} as SerializedBucketPreferences;
  for (const key of CORE_CALENDAR_SOURCE_IDS) {
    result[key] = { mode: buckets[key].mode, selected: Array.from(buckets[key].selected) };
  }
  return result;
}

function deserializeBuckets(raw: unknown): SourceBucketPreferences | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Partial<SerializedBucketPreferences>;
  const result = { ...DEFAULT_SOURCE_BUCKETS };
  for (const key of CORE_CALENDAR_SOURCE_IDS) {
    const entry = record[key];
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const mode = (entry as { mode?: string }).mode;
      const selected = (entry as { selected?: string[] }).selected;
      if (mode === "off" || mode === "all" || mode === "custom") {
        result[key] = {
          mode,
          selected: new Set(Array.isArray(selected) ? selected : []),
        };
      }
    }
  }
  return result;
}

const LS_BUCKET_KEY = "wac_source_buckets";

const WAC_EVENT_COLORS: {
  bg: string; text: string; border: string; dot: string; rule: string; hover: string;
} = {
  bg: "bg-white/[0.05]",
  text: "text-white/70",
  border: "border-white/[0.10]",
  dot: "bg-white/55",
  rule: "bg-white/[0.18]",
  hover: "hover:bg-white/[0.09]",
};

const SOURCE_COLORS: Record<CalSource, {
  bg: string; text: string; border: string; dot: string; rule: string; hover: string;
}> = {
  group:    { bg: "bg-amber-500/[0.16]",   text: "text-amber-300",   border: "border-amber-400/[0.22]",   dot: "bg-amber-400",   rule: "bg-amber-500/30",   hover: "hover:bg-amber-500/[0.26]"   },
  org:      { bg: "bg-emerald-500/[0.16]", text: "text-emerald-300", border: "border-emerald-400/[0.22]", dot: "bg-emerald-400", rule: "bg-emerald-500/30", hover: "hover:bg-emerald-500/[0.26]" },
  business: { bg: "bg-blue-500/[0.16]",    text: "text-blue-300",    border: "border-blue-400/[0.22]",    dot: "bg-blue-400",    rule: "bg-blue-500/30",    hover: "hover:bg-blue-500/[0.26]"    },
};

const SOURCE_LABELS: Record<CalSource, string> = {
  group: "Group Event",
  org: "Organization Event",
  business: "Business Event",
};

function eventColors(source?: CalSource | null) {
  return source ? SOURCE_COLORS[source] : WAC_EVENT_COLORS;
}

function eventSourceLabel(source?: CalSource | null) {
  return source ? SOURCE_LABELS[source] : "WAC Event";
}

function sourceFilterId(source?: CalSource | null): CalendarSourceFilter {
  return source ?? "wac";
}

function normalizeCalendarSourcePreferences(value: unknown): CalendarSourcePreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_CALENDAR_SOURCE_PREFERENCES;
  }

  const record = value as Partial<Record<CalendarSourceFilter, unknown>>;
  return {
    wac: typeof record.wac === "boolean" ? record.wac : DEFAULT_CALENDAR_SOURCE_PREFERENCES.wac,
    org: typeof record.org === "boolean" ? record.org : DEFAULT_CALENDAR_SOURCE_PREFERENCES.org,
    group: typeof record.group === "boolean" ? record.group : DEFAULT_CALENDAR_SOURCE_PREFERENCES.group,
    business: typeof record.business === "boolean" ? record.business : DEFAULT_CALENDAR_SOURCE_PREFERENCES.business,
  };
}

function buildCalendarSourceSet(preferences: CalendarSourcePreferences): Set<string> {
  return new Set(
    CORE_CALENDAR_SOURCE_IDS.filter((id) => preferences[id])
  );
}

function getCalendarSourcePreferencesFromSet(activeSources: Set<string>): CalendarSourcePreferences {
  return {
    wac: activeSources.has("wac"),
    org: activeSources.has("org"),
    group: activeSources.has("group"),
    business: activeSources.has("business"),
  };
}

function monthCellPriority(event: CalEvent): number {
  if (event.source === null && event.is_major) return 0;
  if (event.current_user_rsvp_status && event.current_user_rsvp_status !== "not_going") return 1;
  if (event.source === null) return 2;
  if (event.source === "org") return 3;
  if (event.source === "group") return 4;
  if (event.source === "business") return 5;
  return 6;
}

function getEventMetaBadge(event: CalEvent): { label: string; className: string } | null {
  if (event.current_user_approval_status === "pending") {
    return {
      label: "Pending",
      className: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
    };
  }

  if (typeof event.capacity === "number" && typeof event.attending_count === "number") {
    const remaining = Math.max(event.capacity - event.attending_count, 0);
    if (remaining === 0) {
      return {
        label: "Full",
        className: "bg-red-500/15 text-red-300 border border-red-500/20",
      };
    }
    if (remaining <= 5) {
      return {
        label: `${remaining} left`,
        className: "bg-amber-500/15 text-amber-300 border border-amber-500/20",
      };
    }
  }

  if (event.access_mode === "approval") {
    return {
      label: "Approval",
      className: "bg-white/[0.06] text-white/55 border border-white/[0.10]",
    };
  }

  return null;
}

interface CalEvent {
  id:          string;
  title:       string;
  start_time:  string;   // ISO timestamp stored in UTC
  end_time:    string | null;
  location:    string | null;
  description: string | null;
  created_by:  string | null;
  access_mode?: string | null;
  capacity?: number | null;
  requires_approval?: boolean;
  
  // New fields
  source_type: "wac" | "organization" | "group" | "business";
  source_id: string | null;
  display_mode: "calendar" | "feed" | "both";
  status: "draft" | "published" | "cancelled" | "completed";
  event_type: "event" | "announcement" | "feature_drop" | "alert";
  is_major: boolean;

  attending_count?: number;
  current_user_rsvp_status?: "going" | "interested" | "not_going" | null;
  current_user_approval_status?: "approved" | "pending" | "declined" | "waitlisted" | null;
  source?:     CalSource | null; // classified after fetch from source_type / source_id
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + minutes;
  const nh     = Math.floor(total / 60) % 24;
  const nm     = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function getDurationMinutes(
  startDate: string, startTime: string,
  endDate: string,   endTime: string,
): number {
  const s = new Date(`${startDate}T${startTime}`);
  const e = new Date(`${endDate}T${endTime}`);
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

function getDurationLabel(
  startDate: string, startTime: string,
  endDate: string,   endTime: string,
): string {
  const mins = getDurationMinutes(startDate, startTime, endDate, endTime);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const DURATION_CHIPS = [
  { label: "30m",  minutes: 30  },
  { label: "1h",   minutes: 60  },
  { label: "2h",   minutes: 120 },
  { label: "3h",   minutes: 180 },
];

const EVENT_DRAFT_KEY = "events:new:draft";

// ── Draft factory ──────────────────────────────────────────────────────────────
// endTime defaults to startTime + 1h; pass explicitEndTime to override (e.g. from week-grid drag)

function makeDraft(date: Date, startTime = "09:00", explicitEndTime?: string): EventDraft {
  const p  = (n: number) => String(n).padStart(2, "0");
  const ds = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  return {
    type: "event", title: "", startDate: ds, startTime,
    endDate: ds, endTime: explicitEndTime ?? addMinutesToTime(startTime, 60),
    allDay: false, repeat: "none",
    guests: "", location: "", description: "", calendar: "personal", visibility: "public",
  };
}

// ── Timezone helpers ──────────────────────────────────────────────────────────
// Events are saved in UTC (via .toISOString()). These convert back to local
// date/time strings so the form and display always show the user's local time.

function isoToLocalDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

function localDateKey(iso: string): string {
  // Returns "YYYY-MM-DD" in the user's local timezone for calendar mapping
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function calEventToDraft(ev: CalEvent): EventDraft {
  const start = isoToLocalDateParts(ev.start_time);
  const end   = ev.end_time
    ? isoToLocalDateParts(ev.end_time)
    : { date: start.date, time: addMinutesToTime(start.time, 60) };
  return {
    type: "event", title: ev.title,
    startDate: start.date, startTime: start.time,
    endDate:   end.date,   endTime:   end.time,
    allDay: false, repeat: "none",
    guests: "", location: ev.location ?? "",
    description: ev.description ?? "",
    calendar: "personal", visibility: "public",
  };
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const FEATURED: {
  id: string; href: string; title: string; source: string;
  sourceType: "org" | "group"; date: string; time: string;
  location: string; networkSignal: string;
}[] = [
  {
    id: "f1", href: "/events/albanian-professionals-summer-gala",
    title: "Albanian Professionals Summer Gala",
    source: "Albanian Professionals Association", sourceType: "org",
    date: "Jun 21", time: "7:00 PM", location: "Manhattan, NY",
    networkSignal: "Arben + 14 attending",
  },
  {
    id: "f2", href: "/events/wac-annual-leadership-summit",
    title: "WAC Annual Leadership Summit",
    source: "World Albanian Congress", sourceType: "org",
    date: "Jul 12", time: "9:00 AM", location: "Washington, D.C.",
    networkSignal: "22 from your network",
  },
  {
    id: "f3", href: "/events/nyc-founders-circle-dinner",
    title: "NYC Founders Circle Dinner",
    source: "Albanian Founders Circle", sourceType: "group",
    date: "May 30", time: "7:30 PM", location: "Brooklyn, NY",
    networkSignal: "Blerina + 8 attending",
  },
];

const FILTER_CATEGORIES = [
  "Professional", "Community", "Cultural", "Family",
  "Social", "Education", "Fundraising", "Faith",
];
const FILTER_FORMATS   = ["In Person", "Online", "Hybrid"];
const FILTER_DATES     = ["Today", "This Week", "This Weekend", "This Month"];
const EVENT_SOURCES: Array<{
  id: string; label: string; description: string; dot: string; hierarchical: boolean;
}> = [
  { id: "people",        label: "People",        description: "Events posted by people you follow.",        dot: "bg-white/55",    hierarchical: false },
  { id: "groups",        label: "Groups",        description: "Events from groups you follow.",             dot: "bg-amber-400",   hierarchical: true  },
  { id: "organizations", label: "Organizations", description: "Events from organizations you follow.",      dot: "bg-emerald-400", hierarchical: true  },
  { id: "businesses",    label: "Businesses",    description: "Events from businesses you follow.",         dot: "bg-blue-400",    hierarchical: true  },
];
const FILTER_PATHS = [
  { id: "Roots", dot: "bg-amber-400" },
  { id: "Growth", dot: "bg-teal-400" },
  { id: "Living", dot: "bg-purple-400" },
  { id: "Leadership", dot: "bg-rose-400" },
];
const FILTER_SORTS     = ["Relevant", "Soonest", "Closest", "Popular"];
const QUICK_FILTERS    = ["Near Me", "This Week", "My Network", "Online", "Popular"] as const;

type HierarchicalSourceId = "groups" | "organizations" | "businesses";
type HierarchicalSourceMode = "off" | "all" | "custom";
interface HierarchicalSourceState {
  mode: HierarchicalSourceMode;
  selected: string[]; // entity IDs when mode === "custom"
}
const DEFAULT_HIER: HierarchicalSourceState = { mode: "off", selected: [] };

// Mock followed-entity data (replace with Supabase query in production)
const MOCK_FOLLOWED: Record<HierarchicalSourceId, Array<{ id: string; name: string }>> = {
  groups: [
    { id: "g1", name: "Albanian Professionals NYC" },
    { id: "g2", name: "Balkan Tech Network" },
    { id: "g3", name: "WAC Youth Chapter" },
  ],
  organizations: [
    { id: "o1", name: "Albanian American League" },
    { id: "o2", name: "NAAAP" },
  ],
  businesses: [
    { id: "b1", name: "Shkodra Coffee Co." },
    { id: "b2", name: "Adriatic Capital Group" },
  ],
};

interface EventFilters {
  categories:    string[];
  formats:       string[];
  date:          string | null;
  sources:       string[];   // for "people" only (simple toggle)
  groups:        HierarchicalSourceState;
  organizations: HierarchicalSourceState;
  businesses:    HierarchicalSourceState;
  paths:         string[];
  lifeStages:    string[];
  sort:          string;
  quick:         string[];
}

const DEFAULT_FILTERS: EventFilters = {
  categories: [], formats: [], date: null, sources: [],
  groups: DEFAULT_HIER, organizations: DEFAULT_HIER, businesses: DEFAULT_HIER,
  paths: [], lifeStages: [], sort: "Relevant", quick: [],
};

const LENSES: { id: Lens; label: string; icon: React.ElementType }[] = [
  { id: "discover", label: "Discover",  icon: LayoutGrid   },
  { id: "calendar", label: "Calendar",  icon: CalendarDays },
];

// ── Calendar constants ────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBREVS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const WEEK_HOURS  = Array.from({ length: 15 }, (_, i) => i + 7);

function formatHour(h: number): string {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

const CAL_SOURCES: Array<{ id: CalendarSourceFilter | "imported"; label: string; dot: string; disabled: boolean }> = [
  { id: "wac",      label: "WAC Master",           dot: "bg-white/55",     disabled: false },
  { id: "group",    label: "Group Calendars",      dot: "bg-amber-400",    disabled: false },
  { id: "org",      label: "Organization Calendars", dot: "bg-emerald-400",  disabled: false },
  { id: "business", label: "Business Calendars",   dot: "bg-blue-400",     disabled: false },
  { id: "imported",   label: "Imported Calendars",     dot: "bg-white/25",    disabled: true  },
];

const CAL_VIEW_TABS: { id: CalViewMode; label: string; icon: React.ElementType }[] = [
  { id: "month",  label: "Month",  icon: LayoutGrid   },
  { id: "agenda", label: "Agenda", icon: AlignJustify  },
];



// ── Event composer constants ──────────────────────────────────────────────────

const REPEAT_OPTIONS = [
  { value: "none",     label: "Does not repeat" },
  { value: "daily",    label: "Every day"        },
  { value: "weekly",   label: "Every week"       },
  { value: "biweekly", label: "Every 2 weeks"    },
  { value: "monthly",  label: "Every month"      },
  { value: "yearly",   label: "Every year"       },
];

const CALENDAR_OPTIONS = [
  { value: "personal", label: "Private Items" },
  { value: "group",    label: "Group Calendar"  },
  { value: "org",      label: "Org Calendar"    },
  { value: "business", label: "Business Cal."   },
];

const DISCOVERY_OPTIONS = [
  { value: "public",   label: "Public on WAC"    },
  { value: "network",  label: "My Network"       },
  { value: "group",    label: "Group Members"    },
  { value: "org",      label: "Org Members"      },
  { value: "private",  label: "Private / Link only" },
];

const ACCESS_OPTIONS = [
  { value: "open",     label: "Anyone who can find it" },
  { value: "invite",   label: "Invite only"            },
  { value: "approval", label: "Requires approval"      },
  { value: "members",  label: "Members only"           },
];

const HOST_AS_OPTIONS = [
  { value: "me",           label: "Myself"           },
  { value: "organization", label: "My Organization"  },
  { value: "business",     label: "My Business"      },
  { value: "group",        label: "A Group"          },
];

const REMINDER_OPTIONS = [
  { value: "off",   label: "Off"                },
  { value: "30min", label: "30 min before"      },
  { value: "1hr",   label: "1 hour before"      },
  { value: "3hr",   label: "3 hours before"     },
  { value: "1day",  label: "1 day before"       },
  { value: "2day",  label: "2 days before"      },
  { value: "1week", label: "1 week before"      },
];

const EVENT_CATEGORIES = [
  "Networking","Professional","Family","Youth",
  "Business","Social","Volunteer","Education",
];

const EDITOR_TABS: { id: TabId; label: string }[] = [
  { id: "basics",     label: "Basics"      },
  { id: "hosting",    label: "Hosting"     },
  { id: "publishing", label: "Publishing"  },
  { id: "advanced",   label: "Advanced"    },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function Toggle({
  checked, onChange, color = "teal",
}: {
  checked: boolean; onChange: () => void; color?: "teal" | "rose";
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 shrink-0 ${
        checked
          ? color === "rose" ? "bg-rose-500" : "bg-teal-500"
          : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`absolute top-1/2 left-[3px] w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "-translate-y-1/2 translate-x-[18px] bg-white" : "-translate-y-1/2 translate-x-0 bg-white/50"
        }`}
      />
    </button>
  );
}

function SelectField({
  value, onChange, options, icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ElementType;
}) {
  return (
    <div className="relative flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-white/30 shrink-0" />}
      <PremiumSelect
        value={value}
        onChange={onChange}
        options={options}
        className="flex-1"
        compact
        triggerClassName="w-full rounded-lg border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs text-white/60"
      />
    </div>
  );
}

function InlineField({
  icon: Icon, placeholder, value, onChange, multiline = false,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; multiline?: boolean;
}) {
  const baseCls = "flex-1 bg-transparent text-xs text-white/65 placeholder:text-white/25 outline-none";
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.05] last:border-0">
      <Icon size={12} className="text-white/30 mt-0.5 shrink-0" />
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${baseCls} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseCls}
        />
      )}
    </div>
  );
}

const dateInputCls =
  "flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";
const timeInputCls =
  "w-24 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white/60 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";

// ── CreateEventModal ──────────────────────────────────────────────────────────

function CreateEventModal({
  draft: initialDraft, onClose, onSave, onMoreOptions,
}: {
  draft: EventDraft;
  onClose: () => void;
  onSave: (d: EventDraft) => Promise<void>;
  onMoreOptions: (d: EventDraft) => void;
}) {
  const [draft, setDraft]       = useState<EventDraft>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved]       = useState(false);

  const set = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // When start time changes, preserve the current duration
  const handleStartTimeChange = (newTime: string) => {
    const durMins = Math.max(
      getDurationMinutes(draft.startDate, draft.startTime, draft.endDate, draft.endTime),
      60,
    );
    set({ startTime: newTime, endTime: addMinutesToTime(newTime, durMins) });
  };

  const handleStartDateChange = (newDate: string) => {
    // Keep end date in sync if they were the same day
    if (draft.startDate === draft.endDate) {
      set({ startDate: newDate, endDate: newDate });
    } else {
      set({ startDate: newDate });
    }
  };

  const setDuration = (minutes: number) => {
    set({ endTime: addMinutesToTime(draft.startTime, minutes), endDate: draft.startDate });
  };

  const durationLabel = !draft.allDay
    ? getDurationLabel(draft.startDate, draft.startTime, draft.endDate, draft.endTime)
    : "";

  const handleCreate = async () => {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save. Please try again.");
      setIsSaving(false);
    }
  };

  const isTask = draft.type === "task";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col min-h-0 overflow-hidden max-h-[92dvh] sm:max-h-[84vh]">

        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-3 sm:px-5 sm:pt-4 shrink-0">
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full">
            {(["event", "task"] as const).map((t) => {
              const disabled = t === "task";
              return (
                <button key={t} onClick={() => !disabled && set({ type: t })}
                  disabled={disabled}
                  title={disabled ? "Coming soon" : undefined}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                    disabled
                      ? "cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-white/24"
                      : draft.type === t ? "bg-teal-500/[0.14] text-teal-400" : "text-white/38 hover:text-white/65"
                  }`}>
                  <span>{t}</span>
                  {disabled && <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-white/18">Soon</span>}
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.05] transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* Title */}
        <div className="px-4 pb-4 shrink-0 sm:px-5">
          <input
            type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={isTask ? "What needs to be done?" : "Add title"} autoFocus
            className="w-full text-base font-semibold bg-transparent border-b border-white/[0.1] pb-2 text-white placeholder:text-white/22 outline-none focus:border-teal-400/30 transition-colors"
          />
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 space-y-4 sm:px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* ── TASK mode — lightweight ── */}
          {isTask && (
            <>
              <div>
                <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1.5">Due date</label>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <WacDatePicker value={draft.startDate} onChange={(v) => set({ startDate: v })} />
                  <WacTimePicker value={draft.startTime} onChange={(v) => set({ startTime: v })} />
                </div>
              </div>
              <div className="border-t border-white/[0.06]" />
              <InlineField icon={AlignLeft} placeholder="Notes (optional)…" value={draft.description} onChange={(v) => set({ description: v })} multiline />
            </>
          )}

          {/* ── EVENT mode — full composer ── */}
          {!isTask && (
            <>
              {/* Start */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">Start</label>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <WacDatePicker value={draft.startDate} onChange={handleStartDateChange} />
                    {!draft.allDay && (
                      <WacTimePicker value={draft.startTime} onChange={handleStartTimeChange} />
                    )}
                  </div>
                </div>

                {/* Duration chips */}
                {!draft.allDay && (
                  <div>
                    <div className="flex flex-wrap gap-1 items-center">
                      {DURATION_CHIPS.map(({ label, minutes }) => {
                        const expectedEnd = addMinutesToTime(draft.startTime, minutes);
                        const isActive    = draft.endTime === expectedEnd && draft.startDate === draft.endDate;
                        return (
                          <button key={label} onClick={() => setDuration(minutes)}
                            type="button"
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              isActive
                                ? "bg-teal-500/[0.15] text-teal-400 border border-teal-400/25"
                                : "border border-white/[0.10] text-white/38 hover:text-white/65 hover:border-white/18"
                            }`}>
                            {label}
                          </button>
                        );
                      })}
                      {/* Custom duration badge — only when no preset chip matches */}
                      {durationLabel && !DURATION_CHIPS.some(({ minutes }) =>
                        addMinutesToTime(draft.startTime, minutes) === draft.endTime && draft.startDate === draft.endDate
                      ) && (
                        <span className="text-[9px] font-semibold text-teal-400/70 bg-teal-500/[0.10] px-1.5 py-0.5 rounded-full leading-none ml-1">
                          {durationLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* End */}
                <div>
                  <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">End</label>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <WacDatePicker value={draft.endDate} onChange={(v) => set({ endDate: v })} />
                    {!draft.allDay && (
                      <WacTimePicker value={draft.endTime} onChange={(v) => set({ endTime: v })} />
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 pt-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <Toggle checked={draft.allDay} onChange={() => set({ allDay: !draft.allDay })} />
                    <span className="text-xs text-white/48">All day</span>
                  </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <RotateCcw size={10} className="text-white/25 shrink-0" />
                      <PremiumSelect
                        value={draft.repeat}
                        onChange={(nextValue) => set({ repeat: nextValue })}
                        options={REPEAT_OPTIONS}
                        compact
                        className="min-w-[11.5rem]"
                        triggerClassName="border-white/[0.08] bg-white/[0.03] text-xs text-white/58"
                      />
                    </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              <div>
                <InlineField icon={UserPlus}  placeholder="Add guests"      value={draft.guests}      onChange={(v) => set({ guests: v })} />
                <InlineField icon={MapPin}    placeholder="Add location"    value={draft.location}    onChange={(v) => set({ location: v })} />
                <InlineField icon={AlignLeft} placeholder="Add description" value={draft.description} onChange={(v) => set({ description: v })} multiline />
              </div>

              <div className="border-t border-white/[0.06]" />

              <div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2">
                <SelectField icon={CalendarDays} value={draft.calendar}   onChange={(v) => set({ calendar: v })}   options={CALENDAR_OPTIONS}   />
                <SelectField icon={Eye}          value={draft.visibility} onChange={(v) => set({ visibility: v })} options={DISCOVERY_OPTIONS} />
              </div>
            </>
          )}

          {saveError && <p className="text-xs text-red-400 pb-1">{saveError}</p>}
        </div>

        {/* Footer */}
        <div className="px-4 py-3.5 border-t border-white/[0.07] shrink-0 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onClose} className="text-left text-xs font-medium text-white/38 hover:text-white/60 transition-colors">Cancel</button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isTask && (
              <button onClick={() => onMoreOptions(draft)}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-full border border-white/[0.1] text-xs font-medium text-white/38 hover:text-white/65 hover:border-white/18 transition-colors">
                Full Event Builder
              </button>
            )}
            <button
              disabled={!draft.title.trim() || isSaving || saved}
              onClick={handleCreate}
              className="w-full sm:w-auto wac-btn-primary wac-btn-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {saved
                ? <><CheckCircle2 size={11} />Saved!</>
                : isSaving
                  ? <><Loader2 size={11} className="animate-spin text-[var(--accent)]" />{isTask ? "Saving…" : "Creating…"}</>
                  : isTask ? "Save Task" : "Create"
              }
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FullEventEditorModal ──────────────────────────────────────────────────────
// Four-tab structure: Basics · Hosting · Publishing · Advanced
// Carries all CreateEventModal fields; adds host identity, co-hosts,
// discovery/access split, RSVP depth, questionnaire, and reminders.

function FullEventEditorModal({
  draft: initialDraft, onClose, onSave,
}: {
  draft: EventDraft;
  onClose: () => void;
  onSave: (d: EventDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<EventDraft>(initialDraft);
  const set = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }));

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved]       = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("basics");

  // Hosting & Network
  const [hostAs,       setHostAs]       = useState<"me" | "organization" | "business" | "group">("me");
  const [hostAsSearch, setHostAsSearch] = useState("");
  const [coHosts,      setCoHosts]      = useState("");
  const [linkedType,   setLinkedType]   = useState<"" | "group" | "organization" | "business">("");
  const [linkedSearch, setLinkedSearch] = useState("");
  const [postToPulse,  setPostToPulse]  = useState(false);
  const [category,     setCategory]     = useState("Networking");

  // Publishing
  const [discoveryScope, setDiscoveryScope] = useState("public");
  const [accessScope,    setAccessScope]    = useState("open");
  const [rsvpEnabled,    setRsvpEnabled]    = useState(true);
  const [attendanceCap,  setAttendanceCap]  = useState("");
  const [externalUrl,    setExternalUrl]    = useState("");

  // Advanced
  const [requireApproval,   setRequireApproval]   = useState(false);
  const [waitlistEnabled,   setWaitlistEnabled]   = useState(false);
  const [plusOnes,          setPlusOnes]          = useState(false);
  const [requireGuestNames, setRequireGuestNames] = useState(false);
  const [questions,         setQuestions]         = useState<QuestionItem[]>([]);
  const [rsvpReminder,      setRsvpReminder]      = useState("1day");
  const [eventReminder,     setEventReminder]     = useState("1hr");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      { id: Math.random().toString(36).slice(2), text: "", type: "text", required: false },
    ]);
  }
  function removeQuestion(i: number) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }
  function updateQuestion<K extends keyof QuestionItem>(i: number, key: K, value: QuestionItem[K]) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [key]: value } : q)));
  }
  function addPresetQuestion(text: string) {
    setQuestions((qs) => [
      ...qs,
      { id: Math.random().toString(36).slice(2), text, type: "text", required: false },
    ]);
  }

  async function handleSaveEvent() {
    if (!draft.title.trim() || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save. Please try again.");
      setIsSaving(false);
    }
  }

  // Preserve current duration when start time changes
  const handleEditorStartTimeChange = (newTime: string) => {
    const durMins = Math.max(
      getDurationMinutes(draft.startDate, draft.startTime, draft.endDate, draft.endTime),
      60,
    );
    set({ startTime: newTime, endTime: addMinutesToTime(newTime, durMins) });
  };

  const setEditorDuration = (minutes: number) => {
    set({ endTime: addMinutesToTime(draft.startTime, minutes), endDate: draft.startDate });
  };

  const editorDurationLabel = !draft.allDay
    ? getDurationLabel(draft.startDate, draft.startTime, draft.endDate, draft.endTime)
    : "";

  function goNextTab() {
    const idx = EDITOR_TABS.findIndex((t) => t.id === activeTab);
    if (idx < EDITOR_TABS.length - 1) setActiveTab(EDITOR_TABS[idx + 1].id);
  }
  const isLastTab = activeTab === "advanced";

  const sectionHead = "text-[10px] font-semibold tracking-[0.13em] uppercase text-white/30 mb-3";
  const labelSm     = "text-[10px] text-white/30 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-xl bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col min-h-0 overflow-hidden max-h-[96dvh] sm:max-h-[88vh]">

        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] shrink-0 sm:px-5">
          <h2 className="text-sm font-semibold text-white/80">New Event</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.05] transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4 py-2 shrink-0 sm:px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EDITOR_TABS.map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active ? "border-teal-400/25 bg-teal-500/[0.12] text-teal-400" : "border-white/[0.08] text-white/35 hover:text-white/60 hover:border-white/[0.14]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* ────────────── BASICS ────────────── */}
          {activeTab === "basics" && (
            <div className="px-4 py-4 space-y-4 sm:px-5">
              {/* Event / Task */}
              <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full w-fit">
                {(["event", "task"] as const).map((t) => {
                  const disabled = t === "task";
                  return (
                    <button key={t} onClick={() => !disabled && set({ type: t })}
                      disabled={disabled}
                      title={disabled ? "Coming soon" : undefined}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                        disabled
                          ? "cursor-not-allowed border border-white/[0.06] bg-white/[0.02] text-white/24"
                          : draft.type === t ? "bg-teal-500/[0.14] text-teal-400" : "text-white/38 hover:text-white/65"
                      }`}>
                      <span>{t}</span>
                      {disabled && <span className="ml-1 text-[9px] uppercase tracking-[0.12em] text-white/18">Soon</span>}
                    </button>
                  );
                })}
              </div>

              {/* Title */}
              <input type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })}
                placeholder="Event title" autoFocus
                className="w-full text-base font-semibold bg-transparent border-b border-white/[0.1] pb-2 text-white placeholder:text-white/22 outline-none focus:border-teal-400/30 transition-colors" />

              {/* Description */}
              <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })}
                placeholder="Describe your event…" rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 resize-none transition-colors" />

              {/* Date & Time */}
              <div>
                <div className={sectionHead}>Date &amp; Time</div>
                <div className="space-y-2.5">
                  <div className="space-y-1.5 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
                    <span className="text-[10px] text-white/30 w-8 shrink-0">Start</span>
                    <div className="grid gap-1.5 flex-1 sm:grid-cols-2">
                      <WacDatePicker value={draft.startDate} onChange={(v) => set({ startDate: v })} />
                      {!draft.allDay && <WacTimePicker value={draft.startTime} onChange={handleEditorStartTimeChange} />}
                    </div>
                  </div>

                  {/* Duration chips */}
                  {!draft.allDay && (
                    <div className="sm:pl-10">
                      <div className="flex gap-1 flex-wrap">
                        {DURATION_CHIPS.map(({ label, minutes }) => {
                          const expectedEnd = addMinutesToTime(draft.startTime, minutes);
                          const isActive    = draft.endTime === expectedEnd && draft.startDate === draft.endDate;
                          return (
                            <button key={label} onClick={() => setEditorDuration(minutes)} type="button"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                                isActive
                                  ? "bg-teal-500/[0.15] text-teal-400 border border-teal-400/25"
                                  : "border border-white/[0.10] text-white/38 hover:text-white/65 hover:border-white/18"
                              }`}>
                              {label}
                            </button>
                          );
                        })}
                        {editorDurationLabel && !DURATION_CHIPS.some(({ minutes }) =>
                          addMinutesToTime(draft.startTime, minutes) === draft.endTime && draft.startDate === draft.endDate
                        ) && (
                          <span className="self-center text-[10px] font-semibold text-teal-400/60 bg-teal-500/[0.08] px-1.5 py-0.5 rounded-full leading-none">
                            {editorDurationLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
                    <span className="text-[10px] text-white/30 w-8 shrink-0">End</span>
                    <div className="grid gap-1.5 flex-1 sm:grid-cols-2">
                      <WacDatePicker value={draft.endDate} onChange={(v) => set({ endDate: v })} />
                      {!draft.allDay && <WacTimePicker value={draft.endTime} onChange={(v) => set({ endTime: v })} />}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-3 pt-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Toggle checked={draft.allDay} onChange={() => set({ allDay: !draft.allDay })} />
                      <span className="text-xs text-white/48">All day</span>
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <RotateCcw size={10} className="text-white/25 shrink-0" />
                      <PremiumSelect
                        value={draft.repeat}
                        onChange={(nextValue) => set({ repeat: nextValue })}
                        options={REPEAT_OPTIONS}
                        compact
                        className="min-w-[11.5rem]"
                        triggerClassName="border-white/[0.08] bg-white/[0.03] text-xs text-white/58"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location + Guests */}
              <div>
                <InlineField icon={MapPin}    placeholder="Add location" value={draft.location} onChange={(v) => set({ location: v })} />
                <InlineField icon={UserPlus}  placeholder="Add guests"   value={draft.guests}   onChange={(v) => set({ guests: v })} />
              </div>
            </div>
          )}

          {/* ────────────── HOSTING ────────────── */}
          {activeTab === "hosting" && (
            <div className="px-4 py-4 space-y-5 sm:px-5">

              {/* Host as */}
              <div>
                <div className={sectionHead}>Host as</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HOST_AS_OPTIONS.map(({ value, label }) => {
                    const active = hostAs === value;
                    return (
                      <button key={value}
                        onClick={() => { setHostAs(value as typeof hostAs); setHostAsSearch(""); }}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                          active
                            ? "border-teal-400/30 bg-teal-500/[0.08] text-teal-400/80"
                            : "border-white/[0.08] text-white/45 hover:border-white/15 hover:text-white/65"
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                {hostAs !== "me" && (
                  <input type="text" value={hostAsSearch} onChange={(e) => setHostAsSearch(e.target.value)}
                    placeholder={`Search ${hostAs === "group" ? "groups" : hostAs === "organization" ? "organizations" : "businesses"}…`}
                    className="mt-2 w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors" />
                )}
              </div>

              {/* Co-hosts */}
              <div>
                <div className={sectionHead}>Co-hosts</div>
                <InlineField icon={Users} placeholder="Add people as co-hosts" value={coHosts} onChange={setCoHosts} />
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Link to entity */}
              <div>
                <div className={sectionHead}>Link to Group / Org / Business</div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <PremiumSelect
                    value={linkedType}
                    onChange={(nextValue) => setLinkedType(nextValue as typeof linkedType)}
                    options={[
                      { value: "", label: "Type" },
                      { value: "group", label: "Group" },
                      { value: "organization", label: "Org" },
                      { value: "business", label: "Business" },
                    ]}
                    compact
                    className="shrink-0 sm:w-auto min-w-[7rem]"
                    triggerClassName="w-full rounded-lg border-white/[0.08] bg-white/[0.04] text-xs text-white/58"
                  />
                  <input type="text" value={linkedSearch} onChange={(e) => setLinkedSearch(e.target.value)}
                    placeholder={linkedType ? `Search ${linkedType}s…` : "Select type first"}
                    disabled={!linkedType}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 placeholder:text-white/22 outline-none focus:border-teal-400/25 disabled:opacity-38 transition-colors" />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className={sectionHead}>Category</div>
                <PremiumSelect
                  value={category}
                  onChange={setCategory}
                  options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  compact
                  triggerClassName="w-full rounded-lg border-white/[0.08] bg-white/[0.04] text-xs text-white/60"
                />
              </div>

              {/* Post to Pulse */}
              <label className="flex items-center justify-between gap-4 cursor-pointer py-0.5">
                <div>
                  <span className="text-xs text-white/60">Post to Pulse</span>
                  <p className="text-[10px] text-white/28 mt-0.5">Share this event to the community feed</p>
                </div>
                <Toggle checked={postToPulse} onChange={() => setPostToPulse((v) => !v)} color="rose" />
              </label>
            </div>
          )}

          {/* ────────────── PUBLISHING ────────────── */}
          {activeTab === "publishing" && (
            <div className="px-4 py-4 space-y-5 sm:px-5">

              {/* Calendar destination */}
              <div>
                <div className={sectionHead}>Calendar destination</div>
                <SelectField icon={CalendarDays} value={draft.calendar} onChange={(v) => set({ calendar: v })} options={CALENDAR_OPTIONS} />
                {draft.calendar === "personal" && (
                  <p className="text-[10px] text-white/28 mt-1.5 leading-relaxed">
                    Private by default. Lightweight personal scheduling — you can share or publish it later if needed.
                  </p>
                )}
              </div>

              {/* Discovery — who can find it */}
              <div>
                <div className={sectionHead}>Who can find this event</div>
                <p className="text-[10px] text-white/28 mb-2 -mt-2">Controls visibility in search and network feeds.</p>
                <SelectField icon={Eye} value={discoveryScope} onChange={setDiscoveryScope} options={DISCOVERY_OPTIONS} />
              </div>

              {/* Access — who can RSVP */}
              <div>
                <div className={sectionHead}>Who can RSVP / attend</div>
                <p className="text-[10px] text-white/28 mb-2 -mt-2">Independent from visibility — controls who can actually join.</p>
                <SelectField value={accessScope} onChange={setAccessScope} options={ACCESS_OPTIONS} />
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* RSVP enabled */}
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <span className="text-xs text-white/55">RSVP enabled</span>
                <Toggle checked={rsvpEnabled} onChange={() => setRsvpEnabled((v) => !v)} />
              </label>

              {rsvpEnabled && (
                <div>
                  <label className={labelSm}>Attendance cap (optional — leave blank for unlimited)</label>
                  <input type="number" value={attendanceCap} onChange={(e) => setAttendanceCap(e.target.value)}
                    placeholder="Unlimited" min="1"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 placeholder:text-white/22 outline-none focus:border-teal-400/25 [color-scheme:dark]" />
                </div>
              )}

              {/* External link */}
              <div>
                <label className={labelSm}>External registration link (optional)</label>
                <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 placeholder:text-white/22 outline-none focus:border-teal-400/25 [color-scheme:dark]" />
              </div>
            </div>
          )}

          {/* ────────────── ADVANCED ────────────── */}
          {activeTab === "advanced" && (
            <div className="px-4 py-4 space-y-5 sm:px-5">

              {/* RSVP Controls */}
              <div>
                <div className={sectionHead}>RSVP Controls</div>
                <div className="space-y-3.5">
                  <label className="flex items-start justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs text-white/60">Require approval</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Manually approve each RSVP before confirming</p>
                    </div>
                    <Toggle checked={requireApproval} onChange={() => setRequireApproval((v) => !v)} />
                  </label>
                  <label className="flex items-start justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs text-white/60">Enable waitlist</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Allow people to join a waitlist when capacity is reached</p>
                    </div>
                    <Toggle checked={waitlistEnabled} onChange={() => setWaitlistEnabled((v) => !v)} />
                  </label>
                  <label className="flex items-start justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs text-white/60">Allow plus ones</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Guests can bring additional people</p>
                    </div>
                    <Toggle checked={plusOnes} onChange={() => setPlusOnes((v) => !v)} />
                  </label>
                  <label className="flex items-start justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs text-white/60">Require guest names</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Guests must enter names of anyone they bring</p>
                    </div>
                    <Toggle checked={requireGuestNames} onChange={() => setRequireGuestNames((v) => !v)} />
                  </label>
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Questionnaire */}
              <div>
                <div className={sectionHead}>RSVP Questionnaire</div>
                <p className="text-[10px] text-white/28 mb-3 -mt-2">
                  Guests are asked these questions when they RSVP.
                </p>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["Dietary restrictions", "Profession / Company", "Guest note"].map((preset) => (
                    <button key={preset} onClick={() => addPresetQuestion(preset)}
                      className="px-2.5 py-1 rounded-full border border-white/[0.1] text-[10px] text-white/40 hover:text-white/65 hover:border-[var(--accent)]/20 transition-colors">
                      + {preset}
                    </button>
                  ))}
                </div>

                {/* Question list */}
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.07]">
                      <div className="flex items-start gap-2">
                        <input type="text" value={q.text}
                          onChange={(e) => updateQuestion(i, "text", e.target.value)}
                          placeholder="Question…"
                          className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/22 outline-none" />
                        <button onClick={() => removeQuestion(i)}
                          className="text-white/20 hover:text-white/55 transition-colors shrink-0 mt-0.5">
                          <X size={11} />
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <PremiumSelect
                          value={q.type}
                          onChange={(nextValue) => updateQuestion(i, "type", nextValue as QuestionItem["type"])}
                          options={[
                            { value: "text", label: "Short answer" },
                            { value: "yesno", label: "Yes / No" },
                            { value: "choice", label: "Multiple choice" },
                          ]}
                          compact
                          triggerClassName="min-h-7 border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] text-white/52"
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer sm:ml-auto">
                          <span className="text-[10px] text-white/30">Required</span>
                          <Toggle checked={q.required} onChange={() => updateQuestion(i, "required", !q.required)} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={addQuestion}
                  className="mt-2.5 flex items-center gap-1.5 text-xs text-teal-400/60 hover:text-teal-400 transition-colors">
                  <Plus size={11} />Add custom question
                </button>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Reminders */}
              <div>
                <div className={sectionHead}>Reminders</div>
                <div className="space-y-3.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <span className="text-xs text-white/55">RSVP reminder</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Remind guests who haven't responded yet</p>
                    </div>
                    <PremiumSelect
                      value={rsvpReminder}
                      onChange={setRsvpReminder}
                      options={REMINDER_OPTIONS}
                      compact
                      className="shrink-0 min-w-[10rem]"
                      triggerClassName="w-full rounded-lg border-white/[0.08] bg-white/[0.04] text-xs text-white/58"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <span className="text-xs text-white/55">Event reminder</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Send to all RSVPs before the event starts</p>
                    </div>
                    <PremiumSelect
                      value={eventReminder}
                      onChange={setEventReminder}
                      options={REMINDER_OPTIONS}
                      compact
                      className="shrink-0 min-w-[10rem]"
                      triggerClassName="w-full rounded-lg border-white/[0.08] bg-white/[0.04] text-xs text-white/58"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {/* Photo album — stub */}
              <div>
                <div className={sectionHead}>Photo Album</div>
                <p className="text-[10px] text-white/28 mb-3 -mt-2">Guests can view and contribute photos after the event.</p>
                <div className="py-6 text-center rounded-xl border border-dashed border-white/[0.07]">
                  <p className="text-xs text-white/25">Photo album settings coming soon.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-3.5 border-t border-white/[0.07] shrink-0 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-1">
            <button onClick={onClose}
              className="text-xs font-medium text-white/38 hover:text-white/60 transition-colors">
              Cancel
            </button>
            {saveError && <p className="text-[10px] text-red-400">{saveError}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isLastTab && (
              <button onClick={goNextTab}
                className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-full border border-white/[0.1] text-xs font-medium text-white/45 hover:text-white/70 hover:border-white/18 transition-colors">
                Next
              </button>
            )}
            <button
              disabled={!draft.title.trim() || isSaving || saved}
              onClick={handleSaveEvent}
              className="w-full sm:w-auto wac-btn-primary wac-btn-md disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
              {saved
                ? <><CheckCircle2 size={12} />Saved!</>
                : isSaving
                  ? <><Loader2 size={12} className="animate-spin text-[var(--accent)]" />Saving…</>
                  : "Save Event"
              }
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FeaturedCard ──────────────────────────────────────────────────────────────

function FeaturedCard({ event }: { event: typeof FEATURED[0] }) {
  const SourceIcon = event.sourceType === "org" ? Building2 : Users;
  return (
    <Link href={event.href}
      className="wac-card group flex flex-col p-0 overflow-hidden hover:border-white/15 transition-colors h-full">
      <div className="px-4 pt-3.5 pb-0 flex items-center gap-1.5">
        <SourceIcon size={11} className="text-white/25 shrink-0" />
        <span className="text-[11px] text-white/30 truncate">{event.source}</span>
      </div>
      <div className="px-4 pt-2 pb-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-white leading-snug mb-2.5 line-clamp-2 group-hover:text-teal-400 transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40 mb-3">
          <span className="flex items-center gap-1"><CalendarDays size={10} />{event.date}</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1"><Clock size={10} />{event.time}</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1 min-w-0"><MapPin size={10} className="shrink-0" /><span className="truncate">{event.location}</span></span>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-white/20" />
            <span className="text-[10px] text-white/30">{event.networkSignal}</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="wac-btn-primary wac-btn-sm">
            RSVP
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── CalEventDetailModal ───────────────────────────────────────────────────────

function CalEventDetailModal({
  event, onClose, onEdit, onDelete,
}: {
  event:    CalEvent;
  onClose:  () => void;
  onEdit:   () => void;
  onDelete: () => Promise<void>;
}) {
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const c          = eventColors(event.source);
  const relLabel   = eventSourceLabel(event.source);

  const start      = new Date(event.start_time);
  const end        = event.end_time ? new Date(event.end_time) : null;
  const dateLabel  = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeLabel  = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endLabel   = end?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const remainingSpots =
    typeof event.capacity === "number" && typeof event.attending_count === "number"
      ? Math.max(event.capacity - event.attending_count, 0)
      : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError("");
    try { await onDelete(); onClose(); }
    catch (e: any) { setDeleteError(e.message || "Delete failed"); setIsDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative z-10 flex max-h-[calc(100vh-10px)] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/[0.09] bg-[#0e0e0e] shadow-2xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl">

        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
        </div>

        {/* Relationship color accent bar */}
        <div className={`h-[2px] w-full mt-3 sm:mt-0 ${c.rule}`} />

        {/* Header — title + source badge + close */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
          <div className="flex-1 min-w-0">
            {/* Source badge */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full mb-2.5 ${c.bg} border ${c.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
              <span className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${c.text}`}>{relLabel}</span>
            </div>
            <h2 className="text-[15px] font-semibold leading-snug text-white sm:text-[16px]">{event.title}</h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/28 hover:text-white/60 hover:bg-white/[0.06] shrink-0 transition-colors mt-0.5">
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
        {/* Metadata section */}
        <div className="px-4 pb-4 space-y-2.5 border-b border-white/[0.07] sm:px-5">

          {/* Date + time row */}
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
              <CalendarDays size={12} className={c.text} />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-white/72 leading-snug">{dateLabel}</div>
              <div className={`text-[11px] font-medium mt-0.5 ${c.text} opacity-80`}>
                {timeLabel}{endLabel ? ` – ${endLabel}` : ""}
              </div>
            </div>
          </div>

          {/* Location row */}
          {event.location && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <MapPin size={12} className="text-white/35" />
              </div>
              <span className="text-[12.5px] text-white/58 leading-snug truncate">{event.location}</span>
            </div>
          )}

          {(event.access_mode || remainingSpots !== null || event.current_user_approval_status || event.current_user_rsvp_status) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {event.access_mode && event.access_mode !== "open" && (
                <span className="text-[10px] font-medium text-white/60 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  {event.access_mode === "approval" ? "Approval Required" : event.access_mode}
                </span>
              )}
              {remainingSpots !== null && (
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                  remainingSpots === 0
                    ? "text-red-300 border-red-500/20 bg-red-500/10"
                    : remainingSpots <= 5
                    ? "text-amber-300 border-amber-500/20 bg-amber-500/10"
                    : "text-white/60 border-white/[0.08] bg-white/[0.05]"
                }`}>
                  {remainingSpots === 0 ? "Full" : `${remainingSpots} spots left`}
                </span>
              )}
              {event.current_user_approval_status === "pending" && (
                <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Pending Approval
                </span>
              )}
              {event.current_user_approval_status === "waitlisted" && event.current_user_rsvp_status === "going" && (
                <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Waitlisted
                </span>
              )}
              {event.current_user_approval_status === "declined" && event.current_user_rsvp_status === "going" && (
                <span className="text-[10px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  Declined
                </span>
              )}
              {event.current_user_rsvp_status === "not_going" && (
                <span className="text-[10px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  Not Going
                </span>
              )}
              {event.current_user_approval_status === "approved" && event.current_user_rsvp_status === "going" && (
                <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Going
                </span>
              )}
              {event.current_user_rsvp_status === "interested" && (
                <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Interested
                </span>
              )}
            </div>
          )}

        </div>

        {/* Description section */}
        {event.description && (
          <div className="px-4 py-4 border-b border-white/[0.07] sm:px-5">
            <div className="flex items-start gap-2.5">
              <AlignLeft size={12} className="text-white/25 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-white/50 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </div>
        )}
        </div>

        {/* Actions */}
        <div className="border-t border-white/[0.07] px-4 py-4 sm:px-5">
          {/* Destructive — left aligned, text-only */}
          <div className="mb-3 min-w-0 sm:mb-0 sm:flex-1">
            <button onClick={handleDelete} disabled={isDeleting}
              className="text-[11px] font-medium text-red-400/45 hover:text-red-400 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              {isDeleting && <Loader2 size={10} className="animate-spin text-[var(--accent)]" />}
              {isDeleting ? "Deleting…" : "Delete event"}
            </button>
            {deleteError && <p className="text-[10px] text-red-400 mt-0.5">{deleteError}</p>}
          </div>
          {/* Confirm/edit — right aligned */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button onClick={onClose}
              className="w-full rounded-full border border-white/[0.09] px-4 py-2 text-xs font-medium text-white/35 transition-colors hover:border-white/[0.16] hover:text-white/58 sm:w-auto sm:py-1.5">
              Close
            </button>
            <button onClick={onEdit}
              className={`w-full rounded-full px-4 py-2 text-xs font-semibold transition-colors ${c.bg} ${c.text} border ${c.border} ${c.hover} sm:w-auto sm:py-1.5`}>
              Edit Event
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── MobileEventStrip ─────────────────────────────────────────────────────────
// Compact below-calendar event list shown on mobile only (lg:hidden).
// Replaces the sidebar "This Week/Month" panel when sidebar is collapsed.

function MobileEventStrip({
  label, events, loading, onOpen,
}: {
  label: string;
  events: CalEvent[];
  loading: boolean;
  onOpen: (ev: CalEvent) => void;
}) {
  if (loading) return null; // toolbar spinner already covers this
  if (events.length === 0) return (
    <div className="lg:hidden mt-3 px-1">
      <p className="text-[10px] text-white/20">No events — tap + to add one.</p>
    </div>
  );
  const visible = events.slice(0, 4);
  const extra   = events.length - visible.length;
  return (
    <div className="lg:hidden mt-4 space-y-1">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">{label}</span>
        <span className="text-[10px] text-white/18">{events.length} event{events.length !== 1 ? "s" : ""}</span>
      </div>
      {visible.map((ev) => {
        const c = eventColors(ev.source);
        const d = new Date(ev.start_time);
        return (
          <button key={ev.id} onClick={() => onOpen(ev)}
            className="w-full text-left flex items-center gap-2.5 px-0.5 py-1.5 group">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} opacity-50`} />
            <span className="text-[10px] text-white/28 shrink-0 tabular-nums">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className={`text-[11px] font-medium truncate ${c.text} group-hover:opacity-100 opacity-75 transition-opacity`}>{ev.title}</span>
          </button>
        );
      })}
      {extra > 0 && (
        <p className="text-[10px] text-white/20 pl-4">+{extra} more</p>
      )}
    </div>
  );
}

// ── ImportedCal type ──────────────────────────────────────────────────────────

type ImportedCal = {
  id: string;
  name: string;
  icsUrl: string;
  colorDot: string;
};

const IMPORT_COLORS = [
  { dot: "bg-violet-400",  label: "Violet"  },
  { dot: "bg-sky-400",     label: "Sky"     },
  { dot: "bg-pink-400",    label: "Pink"    },
  { dot: "bg-lime-400",    label: "Lime"    },
  { dot: "bg-orange-400",  label: "Orange"  },
  { dot: "bg-cyan-400",    label: "Cyan"    },
];

const LS_KEY = "wac_imported_cals";

function loadImportedCals(): ImportedCal[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}

function saveImportedCals(cals: ImportedCal[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cals));
}

// ── ImportCalendarModal ───────────────────────────────────────────────────────

function ImportCalendarModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (cal: ImportedCal) => void;
}) {
  const [name,     setName]     = useState("");
  const [icsUrl,   setIcsUrl]   = useState("");
  const [colorDot, setColorDot] = useState(IMPORT_COLORS[0].dot);
  const [error,    setError]    = useState("");
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim())   { setError("Give this calendar a name."); return; }
    if (!icsUrl.trim()) { setError("Paste the ICS feed URL."); return; }
    const url = icsUrl.trim();
    if (!url.startsWith("http") && !url.startsWith("webcal")) {
      setError("URL should start with https:// or webcal://");
      return;
    }
    onSave({ id: `imp_${Date.now()}`, name: name.trim(), icsUrl: url, colorDot });
  }

  const providerGuides = [
    { id: "google", label: "Google Calendar", steps: "Open Google Calendar → Settings → select your calendar → scroll to \"Secret address in iCal format\" → copy the URL." },
    { id: "outlook", label: "Outlook / Microsoft 365", steps: "Settings → Calendar → Shared calendars → Publish a calendar → select the calendar → copy the ICS link." },
    { id: "apple", label: "Apple Calendar / ICS", steps: "Right-click a calendar → Share Calendar → copy the webcal:// URL and paste it above." },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#0c0c0e] flex flex-col" style={{ height: "100dvh" }}>

      {/* ── Header ── */}
      <div className="shrink-0 bg-[#0c0c0e]">
        <div className="flex items-center gap-3 px-4 h-[56px]">
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-all">
            <X size={18} />
          </button>
          <div>
            <h2 className="text-[16px] font-semibold text-white/95 tracking-tight">Connect Calendar</h2>
          </div>
        </div>
        <div className="h-px bg-white/[0.07]" />
        <div className="px-5 py-3">
          <p className="text-[12px] text-white/35 leading-relaxed">
            Sync a Google Calendar, Outlook, Apple Calendar, or ICS feed into WAC.
          </p>
        </div>
        <div className="h-px bg-white/[0.05]" />
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
        <div className="px-5 pt-6 pb-8 space-y-7">

          {/* Calendar Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-2.5">Calendar Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Work, Family, Team Events"
              className="w-full h-[48px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-[15px] text-white placeholder:text-white/20 outline-none focus:border-teal-400/30 focus:bg-white/[0.05] transition-colors"
            />
          </div>

          {/* Calendar Feed URL */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-2.5">Calendar Feed URL</label>
            <input
              type="url"
              value={icsUrl}
              onChange={(e) => { setIcsUrl(e.target.value); setError(""); }}
              placeholder="https://calendar.google.com/…/basic.ics"
              className="w-full h-[48px] bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 text-[15px] text-white placeholder:text-white/20 outline-none focus:border-teal-400/30 focus:bg-white/[0.05] transition-colors"
            />
          </div>

          {/* Provider guides — collapsible */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-2.5">Where to find your URL</label>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              {providerGuides.map(({ id, label, steps }, i) => {
                const isOpen = openGuide === id;
                return (
                  <div key={id}>
                    {i > 0 && <div className="h-px bg-white/[0.05]" />}
                    <button
                      onClick={() => setOpenGuide(isOpen ? null : id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors text-left"
                    >
                      <span className="text-[13px] font-medium text-white/55">{label}</span>
                      <ChevronDown size={14} className={`text-white/25 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 -mt-1">
                        <p className="text-[12px] text-white/35 leading-relaxed">{steps}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Color */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/30 mb-3">Calendar Color</label>
            <div className="flex gap-3">
              {IMPORT_COLORS.map(({ dot, label }) => (
                <button
                  key={dot}
                  onClick={() => setColorDot(dot)}
                  title={label}
                  className={`w-8 h-8 rounded-full transition-all ${dot} ${colorDot === dot ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0c0c0e] scale-110" : "opacity-45 hover:opacity-75"}`}
                />
              ))}
            </div>
          </div>

          {/* Sync behavior */}
          <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <RotateCcw size={14} className="text-teal-400/50 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-medium text-white/50 mb-1">One-way sync</p>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  WAC periodically re-fetches your calendar feed. Changes in the source app appear in WAC automatically. Connected calendars are read-only — events are managed in the source app.
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/[0.06] border border-red-400/15 px-4 py-3">
              <p className="text-[12px] text-red-400/80">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div className="shrink-0 border-t border-white/[0.07] bg-[#0c0c0e] px-5 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-[46px] rounded-xl bg-white/[0.06] hover:bg-white/[0.10] active:bg-white/[0.13] text-[14px] font-medium text-white/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] h-[46px] rounded-xl bg-teal-500/90 hover:bg-teal-500 active:bg-teal-400 text-[14px] font-semibold text-white transition-colors"
          >
            Connect Calendar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── CalendarModeView ──────────────────────────────────────────────────────────

function CalendarModeView({
  registerFilterTrigger,
  onActiveSourceCountChange,
}: {
  registerFilterTrigger?: (fn: () => void) => void;
  onActiveSourceCountChange?: (n: number) => void;
}) {
  const router = useRouter();
  const today = new Date();

  const [calView, setCalView] = useState<CalViewMode>("month");
  const [isCompactCalendar, setIsCompactCalendar] = useState(false);
  const [navDate, setNavDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  useEffect(() => {
    const syncCompactMode = () => setIsCompactCalendar(window.innerWidth < 640);
    syncCompactMode();
    window.addEventListener("resize", syncCompactMode);
    return () => window.removeEventListener("resize", syncCompactMode);
  }, []);

  function switchCalView(v: CalViewMode) {
    if (v === "agenda" && calView !== "agenda") {
      setNavDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    } else if (v === "month" && calView !== "month") {
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), 1));
    }
    setCalView(v);
    setSelectedDay(null);
    setSelDayIdx(null); setSelStartH(null); setSelEndH(null);
    setMobileWeekDayIdx(null);
  }

  function prevPeriod() {
    if (calView === "agenda") {
      setNavDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
      setMobileWeekDayIdx(null);
    } else {
      setNavDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  }
  function nextPeriod() {
    if (calView === "agenda") {
      setNavDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
      setMobileWeekDayIdx(null);
    } else {
      setNavDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }

  // ── Two-level source bucket state ──────────────────────────────────────────
  const [sourceBuckets, setSourceBuckets] = useState<SourceBucketPreferences>(() => {
    // Try loading from localStorage first
    if (typeof window !== "undefined") {
      try {
        const raw = JSON.parse(localStorage.getItem(LS_BUCKET_KEY) || "null");
        const parsed = deserializeBuckets(raw);
        if (parsed) return parsed;
      } catch { /* fallback to default */ }
    }
    return { ...DEFAULT_SOURCE_BUCKETS };
  });

  // Persist bucket preferences to localStorage on every change
  useEffect(() => {
    localStorage.setItem(LS_BUCKET_KEY, JSON.stringify(serializeBuckets(sourceBuckets)));
  }, [sourceBuckets]);

  // Derived: flat Set<string> for backward compat with all existing consumers
  const activeSources = useMemo(() => bucketsToActiveSourceSet(sourceBuckets), [sourceBuckets]);

  const [calendarPrefsUserId, setCalendarPrefsUserId] = useState<string | null>(null);
  const [calendarPrefsReady, setCalendarPrefsReady] = useState(false);
  const [calendarEntitySubscriptions, setCalendarEntitySubscriptions] = useState<{
    organization: Set<string>;
    business: Set<string>;
  }>({
    organization: new Set(),
    business: new Set(),
  });
  const [savedCalendarEntities, setSavedCalendarEntities] = useState<{
    organizations: SavedCalendarEntity[];
    businesses: SavedCalendarEntity[];
  }>({
    organizations: [],
    businesses: [],
  });
  // Groups the user has joined (for calendar source drill-down)
  const [savedGroupEntities, setSavedGroupEntities] = useState<SavedCalendarEntity[]>([]);

  const lastSavedCalendarPreferencesRef = useRef<string | null>(null);

  // Toggle a core source bucket between all/off (simple toggle for desktop chips and quick controls)
  function toggleSource(id: string) {
    if (CORE_CALENDAR_SOURCE_IDS.includes(id as CalendarSourceFilter)) {
      const key = id as CalendarSourceFilter;
      setSourceBuckets((prev) => ({
        ...prev,
        [key]: { ...prev[key], mode: prev[key].mode === "off" ? (prev[key].selected.size > 0 ? "custom" : "all") : "off" },
      }));
    }
  }

  // Set a specific bucket mode
  function setBucketMode(key: CalendarSourceFilter, mode: SourceBucketMode) {
    setSourceBuckets((prev) => ({ ...prev, [key]: { ...prev[key], mode } }));
  }

  // Update custom selection for a bucket
  function setBucketCustomSelection(key: CalendarSourceFilter, selected: Set<string>) {
    setSourceBuckets((prev) => ({
      ...prev,
      [key]: { mode: selected.size === 0 ? "off" : "custom", selected },
    }));
  }

  // Drill-down state: which source bucket is being configured
  const [drillDownSource, setDrillDownSource] = useState<CalendarSourceFilter | null>(null);

  const [showSourceSheet,  setShowSourceSheet]  = useState(false);
  const [showImportModal,  setShowImportModal]  = useState(false);
  const [importedCals,     setImportedCals]     = useState<ImportedCal[]>(() => loadImportedCals());

  useEffect(() => {
    let cancelled = false;

    async function applyCalendarSourcePreferences(userId: string | null) {
      if (cancelled) return;

      setCalendarPrefsReady(false);
      setCalendarPrefsUserId(userId);

      if (!userId) {
        lastSavedCalendarPreferencesRef.current = null;
        // Reset to defaults for logged-out users
        setSourceBuckets({ ...DEFAULT_SOURCE_BUCKETS });
        setCalendarPrefsReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("calendar_source_preferences")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error && error.code !== "PGRST204") {
        console.error("Failed to load calendar source preferences", error);
      }

      // Load legacy flat prefs from DB and reconcile with local bucket state
      const preferences = normalizeCalendarSourcePreferences(data?.calendar_source_preferences);
      lastSavedCalendarPreferencesRef.current = data?.calendar_source_preferences
        ? JSON.stringify(preferences)
        : null;

      // Merge DB on/off with local bucket modes — DB "off" → bucket off, DB "on" → keep existing bucket mode
      setSourceBuckets((prev) => {
        const next = { ...prev };
        for (const key of CORE_CALENDAR_SOURCE_IDS) {
          if (!preferences[key]) {
            next[key] = { ...prev[key], mode: "off" };
          } else if (prev[key].mode === "off") {
            next[key] = { ...prev[key], mode: prev[key].selected.size > 0 ? "custom" : "all" };
          }
        }
        return next;
      });
      setCalendarPrefsReady(true);
    }

    async function loadInitialCalendarSourcePreferences() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      await applyCalendarSourcePreferences(session?.user?.id ?? null);
    }

    loadInitialCalendarSourcePreferences();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyCalendarSourcePreferences(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Persist bucket on/off state to Supabase as legacy flat preferences
  useEffect(() => {
    if (!calendarPrefsReady || !calendarPrefsUserId) return;

    const calendarSourcePreferences = bucketsToLegacyPreferences(sourceBuckets);
    const serializedPreferences = JSON.stringify(calendarSourcePreferences);
    if (lastSavedCalendarPreferencesRef.current === serializedPreferences) return;
    lastSavedCalendarPreferencesRef.current = serializedPreferences;

    void supabase
      .from("user_settings")
      .upsert(
        {
          user_id: calendarPrefsUserId,
          calendar_source_preferences: calendarSourcePreferences,
        },
        { onConflict: "user_id" }
      )
      .then(({ error }) => {
        if (error && error.code !== "PGRST204") {
          lastSavedCalendarPreferencesRef.current = null;
          console.error("Failed to save calendar source preferences", error);
        }
      });
  }, [sourceBuckets, calendarPrefsReady, calendarPrefsUserId]);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendarEntitySubscriptions() {
      if (!calendarPrefsUserId) {
        setCalendarEntitySubscriptions({
          organization: new Set(),
          business: new Set(),
        });
        setSavedCalendarEntities({
          organizations: [],
          businesses: [],
        });
        setSavedGroupEntities([]);
        return;
      }

      // Fetch org/business subscriptions + group membership IDs in parallel
      const [subsResult, groupMembersResult] = await Promise.all([
        supabase
          .from("user_calendar_entity_subscriptions")
          .select("entity_type, entity_id")
          .eq("user_id", calendarPrefsUserId)
          .in("entity_type", ["organization", "business"]),
        supabase
          .from("group_members")
          .select("group_id")
          .eq("profile_id", calendarPrefsUserId),
      ]);

      if (cancelled) return;

      if (subsResult.error) {
        console.error("Failed to load calendar entity subscriptions", subsResult.error);
      }
      if (groupMembersResult.error) {
        console.error("Failed to load group memberships", groupMembersResult.error);
      }

      const organization = new Set<string>();
      const business = new Set<string>();

      for (const row of subsResult.data ?? []) {
        if (row.entity_type === "organization") organization.add(row.entity_id);
        if (row.entity_type === "business") business.add(row.entity_id);
      }

      const groupIds = (groupMembersResult.data ?? []).map((r) => r.group_id).filter(Boolean);

      // Fetch entity names for orgs, businesses, and groups
      const [organizationDirectory, businessDirectory, groupsDirectory] = await Promise.all([
        organization.size > 0
          ? supabase
              .from("organizations_directory_v1")
              .select("id, name")
              .in("id", Array.from(organization))
          : Promise.resolve({ data: [], error: null }),
        business.size > 0
          ? supabase
              .from("businesses_directory_v1")
              .select("id, name")
              .in("id", Array.from(business))
          : Promise.resolve({ data: [], error: null }),
        groupIds.length > 0
          ? supabase
              .from("groups")
              .select("id, name")
              .in("id", groupIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (organizationDirectory.error) {
        console.error("Failed to load saved organization calendars", organizationDirectory.error);
      }
      if (businessDirectory.error) {
        console.error("Failed to load saved business calendars", businessDirectory.error);
      }
      if (groupsDirectory.error) {
        console.error("Failed to load saved group calendars", groupsDirectory.error);
      }

      setCalendarEntitySubscriptions({ organization, business });
      setSavedCalendarEntities({
        organizations: (organizationDirectory.data ?? []).map((entity) => ({
          id: entity.id,
          name: entity.name,
          entityType: "organization",
        })),
        businesses: (businessDirectory.data ?? []).map((entity) => ({
          id: entity.id,
          name: entity.name,
          entityType: "business",
        })),
      });
      setSavedGroupEntities(
        (groupsDirectory.data ?? []).map((g) => ({ id: g.id, name: g.name, entityType: "group" as const }))
      );
    }

    loadCalendarEntitySubscriptions();

    return () => {
      cancelled = true;
    };
  }, [calendarPrefsUserId]);

  async function removeSavedCalendar(entity: SavedCalendarEntity) {
    if (!calendarPrefsUserId) return;

    const { error } = await supabase
      .from("user_calendar_entity_subscriptions")
      .delete()
      .eq("user_id", calendarPrefsUserId)
      .eq("entity_type", entity.entityType)
      .eq("entity_id", entity.id);

    if (error) {
      console.error("Failed to remove saved calendar", error);
      return;
    }

    setCalendarEntitySubscriptions((prev) => {
      const next = {
        organization: new Set(prev.organization),
        business: new Set(prev.business),
      };
      if (entity.entityType === "organization") next.organization.delete(entity.id);
      if (entity.entityType === "business") next.business.delete(entity.id);
      return next;
    });

    setSavedCalendarEntities((prev) => ({
      organizations: entity.entityType === "organization"
        ? prev.organizations.filter((item) => item.id !== entity.id)
        : prev.organizations,
      businesses: entity.entityType === "business"
        ? prev.businesses.filter((item) => item.id !== entity.id)
        : prev.businesses,
    }));
  }

  const hasSavedCalendars =
    savedCalendarEntities.organizations.length > 0 ||
    savedCalendarEntities.businesses.length > 0;

  function addImportedCal(cal: ImportedCal) {
    const next = [...importedCals, cal];
    setImportedCals(next);
    saveImportedCals(next);
    setShowImportModal(false);
  }

  function removeImportedCal(id: string) {
    const next = importedCals.filter((c) => c.id !== id);
    setImportedCals(next);
    saveImportedCals(next);
  }

  // Counts for the source control panel
  const activeSourceCount = CORE_CALENDAR_SOURCE_IDS.filter((id) => sourceBuckets[id].mode !== "off").length;
  const allSourcesActive = activeSourceCount === CORE_CALENDAR_SOURCE_IDS.length;
  const anySourcesActive = activeSourceCount > 0;

  // Register the filter sheet trigger so EventsPage's top-row button can open it
  useEffect(() => {
    registerFilterTrigger?.(() => setShowSourceSheet(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerFilterTrigger]);

  // Report active source count upward so top-row button can show badge
  useEffect(() => {
    onActiveSourceCountChange?.(activeSourceCount);
  }, [activeSourceCount, onActiveSourceCountChange]);

  // Helper: get entity list for a given source bucket
  function getEntitiesForBucket(key: CalendarSourceFilter): SavedCalendarEntity[] {
    if (key === "org") return savedCalendarEntities.organizations;
    if (key === "business") return savedCalendarEntities.businesses;
    if (key === "group") return savedGroupEntities;
    return []; // WAC has no sub-entities
  }

  // Summary label for a bucket row on the main screen
  function bucketSummaryLabel(key: CalendarSourceFilter): string {
    const bucket = sourceBuckets[key];
    if (bucket.mode === "off") return "Off";
    if (bucket.mode === "all") return "All";
    if (key === "wac") return "On"; // WAC has no sub-entities
    const entities = getEntitiesForBucket(key);
    const total = entities.length;
    if (total === 0) return "All";
    const activeCount = entities.filter((e) => bucket.selected.has(e.id)).length;
    return `${activeCount} of ${total}`;
  }

  function showAllSources() {
    setSourceBuckets((prev) => {
      const next = { ...prev };
      for (const key of CORE_CALENDAR_SOURCE_IDS) {
        next[key] = { ...prev[key], mode: "all" };
      }
      return next;
    });
  }

  function hideAllSources() {
    setSourceBuckets((prev) => {
      const next = { ...prev };
      for (const key of CORE_CALENDAR_SOURCE_IDS) {
        next[key] = { ...prev[key], mode: "off" };
      }
      return next;
    });
  }

  // Navbar `+` in Calendar mode → open Quick Create
  const [selectedDay,      setSelectedDay]      = useState<number | null>(null);
  const [selDayIdx,        setSelDayIdx]        = useState<number | null>(null);
  const [selStartH,        setSelStartH]        = useState<number | null>(null);
  const [selEndH,          setSelEndH]          = useState<number | null>(null);
  const [mobileWeekDayIdx, setMobileWeekDayIdx] = useState<number | null>(null);
  const isSelectingRef                = useRef(false);

  useEffect(() => {
    const stop = () => { isSelectingRef.current = false; };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  // ── Event data ─────────────────────────────────────────────────────────────
  const [calEvents,    setCalEvents]    = useState<CalEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [calRefreshKey, setCalRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchVisibleEvents() {
      let start: Date, end: Date;
      if (calView === "agenda") {
        // Agenda follows week context — fetch the current week's events
        const dow = navDate.getDay();
        start = new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - dow, 0, 0, 0);
        end   = new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - dow + 6, 23, 59, 59);
      } else {
        start = new Date(navDate.getFullYear(), navDate.getMonth(), 1);
        end   = new Date(navDate.getFullYear(), navDate.getMonth() + 1, 0, 23, 59, 59);
      }
      console.log("[CalFetch] view:", calView, "range:", start.toISOString(), "→", end.toISOString());
      setEventsLoading(true);
      const [{ data, error }, { data: { user: authUser } }] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, start_time, end_time, location, description, created_by, access_mode, capacity, requires_approval, source_type, source_id, display_mode, status, event_type, is_major")
          .in("display_mode", ["calendar", "both"])
          .eq("status", "published")
          .gte("start_time", start.toISOString())
          .lte("start_time", end.toISOString())
          .order("start_time", { ascending: true }),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (error) {
        console.error("[CalFetch] error:", error.message);
        setCalEvents([]);
      } else {
        const uid = authUser?.id ?? null;
        const eventRows = ((data ?? []) as Omit<CalEvent, "source">[]);
        const eventIds = eventRows.map((event) => event.id);
        let rsvpRows: Array<{
          event_id: string;
          user_id: string;
          status: "going" | "interested" | "not_going";
          approval_status: "approved" | "pending" | "declined" | "waitlisted";
        }> = [];

        if (eventIds.length > 0) {
          const { data: rsvpData, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("event_id, user_id, status, approval_status")
            .in("event_id", eventIds);

          if (rsvpError) {
            console.error("[CalFetch] RSVP error:", rsvpError.message);
          } else {
            rsvpRows = rsvpData ?? [];
          }
        }

        const attendeeCountByEvent = new Map<string, number>();
        const currentUserRsvpByEvent = new Map<string, typeof rsvpRows[number]>();
        for (const rsvp of rsvpRows) {
          if (rsvp.status === "going" && rsvp.approval_status !== "declined" && rsvp.approval_status !== "waitlisted") {
            attendeeCountByEvent.set(rsvp.event_id, (attendeeCountByEvent.get(rsvp.event_id) ?? 0) + 1);
          }
          if (uid && rsvp.user_id === uid) {
            currentUserRsvpByEvent.set(rsvp.event_id, rsvp);
          }
        }

        const classified = eventRows.map((ev): CalEvent => {
          const currentUserRsvp = currentUserRsvpByEvent.get(ev.id);
          const source =
            ev.source_type === "wac"
              ? null
              : ev.source_type === "organization" && ev.source_id
              ? "org"
              : ev.source_type === "group" && ev.source_id
              ? "group"
              : ev.source_type === "business" && ev.source_id
              ? "business"
              : null;

          return {
            ...ev,
            attending_count: attendeeCountByEvent.get(ev.id) ?? 0,
            current_user_rsvp_status: currentUserRsvp?.status ?? null,
            current_user_approval_status: currentUserRsvp?.approval_status ?? null,
            source,
          };
        });
        console.log("[CalFetch] fetched", classified.length, "events:", classified);
        setCalEvents(classified);
      }
      setEventsLoading(false);
    }
    fetchVisibleEvents();
    return () => { cancelled = true; };
  }, [navDate, calView, calRefreshKey]);

  const [modalDraft,       setModalDraft]       = useState<EventDraft | null>(null);
  const [showFullEditor,   setShowFullEditor]   = useState(false);
  const [editingEventId,   setEditingEventId]   = useState<string | null>(null);
  const [selectedCalEvent, setSelectedCalEvent] = useState<CalEvent | null>(null);

  useEffect(() => {
    const handler = () => router.push("/events/new");
    window.addEventListener("events-compose", handler);
    return () => window.removeEventListener("events-compose", handler);
  }, [router]);

  function openCreateEventPage(draft: EventDraft) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EVENT_DRAFT_KEY, JSON.stringify({
        eventKind: draft.type,
        title: draft.title,
        description: draft.description,
        startDate: draft.startDate,
        startTime: draft.startTime,
        endDate: draft.endDate,
        endTime: draft.endTime,
        allDay: draft.allDay,
        repeat: draft.repeat,
        location: draft.location,
        guests: draft.guests,
      }));
    }
    router.push("/events/new");
  }

  function closeModal() {
    setModalDraft(null); setShowFullEditor(false); setEditingEventId(null);
    setSelectedDay(null); setSelDayIdx(null); setSelStartH(null); setSelEndH(null);
  }
  function handleMoreOptions(draft: EventDraft) { setModalDraft(draft); setShowFullEditor(true); }

  function openEventDetail(ev: CalEvent) { setSelectedCalEvent(ev); }
  function openEventEdit(ev: CalEvent) {
    setEditingEventId(ev.id);
    setModalDraft(calEventToDraft(ev));
    setShowFullEditor(false);
    setSelectedCalEvent(null);
  }
  async function handleEventDelete(id: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setCalRefreshKey((k) => k + 1);
  }

  async function handleEventSave(draft: EventDraft): Promise<void> {
    const visMap: Record<string, string> = {
      public: "public", private: "private",
      network: "members", group: "members", org: "members",
    };
    const { data: { user } } = await supabase.auth.getUser();
    // Save in UTC — new Date("YYYY-MM-DDTHH:MM:SS") is local time, .toISOString() converts to UTC
    const payload: Record<string, unknown> = {
      title:       draft.title.trim(),
      description: draft.description || null,
      location:    draft.location    || null,
      start_time:  new Date(`${draft.startDate}T${draft.startTime}:00`).toISOString(),
      end_time:    new Date(`${draft.endDate}T${draft.endTime}:00`).toISOString(),
      visibility:  visMap[draft.visibility] ?? "public",
      created_by:  user?.id ?? null,
    };
    console.log("[EventSave] payload:", payload);
    let dbError;
    if (editingEventId) {
      // This in-page editor currently updates timing/basic fields only.
      // It does not persist host/source context changes, so source-aware fields
      // remain untouched here until edit support recomputes them explicitly.
      const res = await supabase.from("events").update(payload).eq("id", editingEventId);
      dbError = res.error;
    } else {
      const res = await supabase.from("events").insert({
        ...payload,
        event_type: "event",
        source_type: "wac",
        source_id: null,
        display_mode: "calendar",
        status: "published",
      });
      dbError = res.error;
    }
    if (dbError) throw new Error(dbError.message);
    console.log("[EventSave] success");
    setEditingEventId(null);
    setCalRefreshKey((k) => k + 1);
  }

  const [agendaDay, setAgendaDay] = useState<number | null>(null);
  const calendarRegionRef = useRef<HTMLDivElement | null>(null);

  function scrollCalendarRegionIntoView() {
    if (typeof window === "undefined" || window.innerWidth < 1024) return;
    calendarRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setAgendaDay((prev) => {
      const next = prev === day ? null : day;
      if (next !== null) {
        requestAnimationFrame(() => {
          scrollCalendarRegionIntoView();
        });
      }
      return next;
    });
  }

  function openDayAgenda(day: number) {
    setSelectedDay(day);
    setAgendaDay(day);
    requestAnimationFrame(() => {
      scrollCalendarRegionIntoView();
    });
  }

  function handleSlotMouseDown(dayIdx: number, hour: number, e: React.MouseEvent) {
    e.preventDefault();
    isSelectingRef.current = true;
    setSelDayIdx(dayIdx); setSelStartH(hour); setSelEndH(hour);
  }
  function handleSlotMouseEnter(dayIdx: number, hour: number) {
    if (!isSelectingRef.current || dayIdx !== selDayIdx) return;
    setSelEndH(hour);
  }
  function handleGridMouseUp() {
    if (isSelectingRef.current && selDayIdx !== null && selStartH !== null) {
      const lo   = Math.min(selStartH, selEndH ?? selStartH);
      const hi   = Math.max(selStartH, selEndH ?? selStartH);
      const date = weekDays[selDayIdx];
      const st   = `${String(lo).padStart(2, "0")}:00`;
      const et   = `${String(Math.min(hi + 1, 23)).padStart(2, "0")}:00`;
      openCreateEventPage(makeDraft(date, st, et));
    }
    isSelectingRef.current = false;
  }

  const isCurrentMonth =
    navDate.getFullYear() === today.getFullYear() && navDate.getMonth() === today.getMonth();

  const { firstDay, daysInMonth } = useMemo(() => {
    const y = navDate.getFullYear(), m = navDate.getMonth();
    return { firstDay: new Date(y, m, 1).getDay(), daysInMonth: new Date(y, m + 1, 0).getDate() };
  }, [navDate]);

  const monthCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  const weekStart = useMemo(() => {
    const d = new Date(navDate), dow = d.getDay();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  }, [navDate]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 6); return d;
  }, [weekStart]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
    }),
    [weekStart]
  );

  // Reset mobile week day selection when the week changes
  useEffect(() => { setMobileWeekDayIdx(null); }, [weekStart.getTime()]);

  // Filter events by two-level source bucket model
  const filteredCalEvents = useMemo(
    () =>
      calEvents.filter((ev) => {
        const bucketKey = sourceFilterId(ev.source);
        const bucket = sourceBuckets[bucketKey];
        // Level 1: bucket off → hide everything in this source
        if (bucket.mode === "off") return false;
        // Level 1: bucket all → show (with entity subscription check for logged-in users)
        if (bucket.mode === "all") {
          if (!calendarPrefsUserId) return true;
          if (ev.source_type === "organization") {
            return !!ev.source_id && calendarEntitySubscriptions.organization.has(ev.source_id);
          }
          if (ev.source_type === "business") {
            return !!ev.source_id && calendarEntitySubscriptions.business.has(ev.source_id);
          }
          return true;
        }
        // Level 2: bucket custom → only show selected entity IDs
        if (!ev.source_id) return false;
        return bucket.selected.has(ev.source_id);
      }),
    [calEvents, sourceBuckets, calendarEntitySubscriptions, calendarPrefsUserId]
  );

  // Map "YYYY-MM-DD" (local) → CalEvent[] for O(1) lookup in month + week cells
  // Uses localDateKey() so events at e.g. 11 PM in UTC-5 still land on the correct local date
  const eventsMap = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of filteredCalEvents) {
      const dk = localDateKey(ev.start_time);
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk)!.push(ev);
    }
    return map;
  }, [filteredCalEvents]);

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const periodLabel =
    calView === "agenda"
      ? weekStart.getMonth() === weekEnd.getMonth()
        ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekStart.getFullYear()}`
        : `${MONTH_NAMES[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()].slice(0,3)} ${weekEnd.getDate()}`
      : `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`;

  const visibleMonthLineCount = isCompactCalendar ? 5 : 7;
  const selectedDayAgenda = useMemo(() => {
    if (calView !== "month" || agendaDay === null) return null;

    const dateKey = `${navDate.getFullYear()}-${String(navDate.getMonth() + 1).padStart(2, "0")}-${String(agendaDay).padStart(2, "0")}`;
    const dayEvs = filteredCalEvents.filter((ev) => localDateKey(ev.start_time) === dateKey);
    const date = new Date(navDate.getFullYear(), navDate.getMonth(), agendaDay);
    const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    return { date, dateLabel, dayEvs };
  }, [agendaDay, calView, filteredCalEvents, navDate]);

  const selLo = selStartH !== null && selEndH !== null ? Math.min(selStartH, selEndH) : null;
  const selHi = selStartH !== null && selEndH !== null ? Math.max(selStartH, selEndH) : null;

  function isSlotSelected(dayIdx: number, hour: number) {
    if (selDayIdx !== dayIdx || selLo === null || selHi === null) return false;
    return hour >= selLo && hour <= selHi;
  }

  return (
    <>
    <div ref={calendarRegionRef} className="mt-2 md:mt-4 flex flex-col lg:flex-row gap-4 lg:gap-6 xl:gap-8 min-h-[calc(100vh-240px)] scroll-mt-24">

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="sticky top-[64px] sm:top-[72px] z-20 mb-3 space-y-2 rounded-2xl border border-white/[0.06] bg-[var(--background)]/92 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">

          {/* ── Nav row: prev / period label / next + filter button (mobile) ── */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.09] text-white/40 hover:text-white/75 hover:border-white/[0.18] transition-colors shrink-0">
                <ChevronLeft size={15} />
              </button>
              <span className="flex-1 text-[14px] font-semibold text-white/85 text-center tracking-tight truncate">{periodLabel}</span>
              <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.09] text-white/40 hover:text-white/75 hover:border-white/[0.18] transition-colors shrink-0">
                <ChevronRight size={15} />
              </button>
            </div>
            {eventsLoading && <Loader2 size={12} className="animate-spin text-[var(--accent)] shrink-0 hidden lg:block" />}
            {/* Filter button moved to top-row mode selector in EventsPage */}
            {eventsLoading && <Loader2 size={12} className="animate-spin text-[var(--accent)] shrink-0 lg:hidden" />}
          </div>

          {/* ── View switcher — full-width segmented control ── */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1">
            {CAL_VIEW_TABS.map(({ id, label, icon: Icon }) => {
              const active = calView === id;
              return (
                <button key={id} onClick={() => switchCalView(id)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] sm:text-xs font-medium transition-all ${
                    active ? "bg-white/[0.09] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "text-white/38 hover:text-white/65"
                  }`}>
                  <Icon size={11} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Compact source summary — desktop only ── */}
          <div className="hidden lg:flex items-center gap-2 pt-0.5">
            <span className="text-[10px] text-white/28">
              Sources: {activeSourceCount} active
            </span>
            <div className="flex items-center gap-1">
              {CAL_SOURCES.filter((s) => s.id !== "imported").map(({ id, dot }) => {
                const isActive = sourceBuckets[id as CalendarSourceFilter].mode !== "off";
                return <span key={id} className={`w-1.5 h-1.5 rounded-full ${dot} ${isActive ? "opacity-65" : "opacity-15"} transition-opacity`} />;
              })}
            </div>
          </div>
        </div>

        {/* Month */}
        {calView === "month" && (
          <>
            <div className="wac-card p-0 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-white/[0.05]">
                {DAY_ABBREVS.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold tracking-wider text-white/25 uppercase">
                    <span className="sm:hidden">{d.slice(0, 1)}</span>
                    <span className="hidden sm:inline">{d}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((day, i) => {
                  const isToday    = isCurrentMonth && day === today.getDate();
                  const isSelected = day !== null && day === selectedDay && !isToday;
                  const isWeekend  = i % 7 === 0 || i % 7 === 6;
                  const lastInRow  = i % 7 === 6;
                  const dateKey    = day !== null
                    ? `${navDate.getFullYear()}-${String(navDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : null;
                  const dayEvs = dateKey ? (eventsMap.get(dateKey) ?? []) : [];
                  const prioritizedDayEvs = [...dayEvs].sort((a, b) => {
                    const priorityDiff = monthCellPriority(a) - monthCellPriority(b);
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                  });
                  return (
                    <div key={i} onClick={() => day !== null && handleDayClick(day)}
                      className={`relative min-h-[104px] sm:min-h-[128px] p-1 sm:p-1.5 border-b border-r border-white/[0.04] transition-colors ${lastInRow ? "border-r-0" : ""} ${
                        day === null ? "bg-white/[0.01]"
                        : isSelected ? "bg-white/[0.045] ring-1 ring-inset ring-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] cursor-pointer"
                        : isWeekend  ? "bg-white/[0.012] cursor-pointer hover:bg-white/[0.03]"
                        : "cursor-pointer hover:bg-white/[0.025]"
                      }`}>
                      {day !== null && (
                        <>
                          {dayEvs.length > 0 && (
                            <span className="absolute right-1 top-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-semibold leading-none text-white/42">
                              {dayEvs.length}
                            </span>
                          )}
                          <span className={`inline-flex items-center justify-center w-6 h-6 text-[11px] rounded-full ${
                            isToday    ? "bg-teal-500/20 text-teal-400 font-semibold ring-1 ring-teal-400/40"
                            : isSelected ? "bg-white/12 text-white/90 font-semibold ring-1 ring-white/[0.14]"
                            : "text-white/35 font-medium"
                          }`}>
                            {day}
                          </span>
                          {/* Compact density lines — fits more events per day without crowding the cell */}
                          <div className="mt-1.5 space-y-1">
                            {prioritizedDayEvs.slice(0, visibleMonthLineCount).map((ev) => {
                              const c = eventColors(ev.source);
                              const badge = getEventMetaBadge(ev);
                              const sourceLabel = eventSourceLabel(ev.source);
                              return (
                                <button
                                  key={ev.id}
                                  title={`${sourceLabel}: ${ev.title}`}
                                  onClick={(e) => { e.stopPropagation(); openEventDetail(ev); }}
                                  className="w-full text-left transition-opacity hover:opacity-100 opacity-90"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className={`h-[4px] w-[4px] shrink-0 rounded-full ${c.dot} opacity-85`} />
                                    <span className={`h-[4px] flex-1 rounded-full ${c.rule}`} />
                                    {badge && (
                                      <span className={`shrink-0 rounded-full px-1 py-0.5 text-[7px] font-semibold leading-none ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            {prioritizedDayEvs.length > visibleMonthLineCount && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openDayAgenda(day); }}
                                className="w-full rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-1 text-left text-[8px] font-semibold leading-none text-white/42 transition-colors hover:border-white/[0.12] hover:text-white/68">
                                View +{prioritizedDayEvs.length - visibleMonthLineCount} more
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 py-2 px-3 rounded-xl border border-dashed border-white/[0.06] hidden sm:block">
              <p className="text-xs text-white/28">{calendarPrefsUserId ? "Toggle sources above to focus the view. WAC follows its source toggle, groups stay category-based, and org/business events come from calendars you've added. Click a day to see its agenda, or click and drag in week view to create an event." : "Toggle calendar sources above to focus the view. Signed-out browsing uses category filters only. Click a day to see its agenda, or click and drag in week view to create an event."}</p>
            </div>

            {/* Day Agenda Sheet — slides up when a day is tapped */}
            {selectedDayAgenda && (
                <div className="mt-3 rounded-2xl border border-white/[0.09] bg-[#111]/90 backdrop-blur-xl p-4 lg:hidden">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{selectedDayAgenda.dateLabel}</p>
                      <p className="mt-1 text-[10px] text-white/24">{selectedDayAgenda.dayEvs.length} scheduled</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          openCreateEventPage(makeDraft(selectedDayAgenda.date));
                          setAgendaDay(null);
                        }}
                        className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45 hover:text-white/75 transition-colors"
                      >
                        <Plus size={10} />
                        Add event
                      </button>
                      <button
                        onClick={() => { setAgendaDay(null); setSelectedDay(null); }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-white/35 hover:text-white/65 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                  {selectedDayAgenda.dayEvs.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-white/28">No events on this day.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto [scrollbar-width:none]">
                      {selectedDayAgenda.dayEvs.map((ev) => {
                        const c = eventColors(ev.source);
                        const sourceLabel = eventSourceLabel(ev.source);
                        const timeLabel = new Date(ev.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        return (
                          <button key={ev.id}
                            onClick={() => { openEventDetail(ev); setAgendaDay(null); setSelectedDay(null); }}
                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left transition-colors hover:border-white/[0.12]"
                          >
                            <div className={`h-8 w-1 shrink-0 rounded-full ${c.rule}`} />
                            <div className="min-w-0">
                              <p className={`truncate text-[13px] font-medium leading-snug ${c.text}`}>{ev.title}</p>
                              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/24">{sourceLabel}</p>
                              <p className="text-[10px] text-white/35">{timeLabel}{ev.location ? ` · ${ev.location}` : ""}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
            )}

            {/* Mobile: compact event summary strip */}
            <MobileEventStrip
              label={MONTH_NAMES[navDate.getMonth()]}
              events={filteredCalEvents}
              loading={eventsLoading}
              onOpen={openEventDetail}
            />
          </>
        )}

        {/* Agenda — weekly day selector + selected day agenda */}
        {calView === "agenda" && (
          <div className="space-y-3">
            {/* ── Horizontal week day selector strip ── */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map((d, i) => {
                const dayKey   = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                const evMapKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const isToday  = dayKey === todayKey;
                const todayInWeek = weekDays.some((wd) => `${wd.getFullYear()}-${wd.getMonth()}-${wd.getDate()}` === todayKey);
                const isSelected = mobileWeekDayIdx === i || (mobileWeekDayIdx === null && isToday) || (mobileWeekDayIdx === null && !todayInWeek && i === 0);
                const dayEvs = eventsMap.get(evMapKey) ?? [];

                // Build source dots (max 3, deduplicated by source type)
                const sourceDots: string[] = [];
                const seenSources = new Set<string>();
                for (const ev of dayEvs) {
                  const src = ev.source ?? "wac";
                  if (!seenSources.has(src) && sourceDots.length < 3) {
                    seenSources.add(src);
                    const c = eventColors(ev.source);
                    sourceDots.push(c.dot);
                  }
                }

                return (
                  <button key={i} onClick={() => setMobileWeekDayIdx(i)}
                    className={`flex flex-col items-center gap-1.5 pt-3 pb-2.5 sm:pt-3.5 sm:pb-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-teal-500/[0.10] border-teal-400/25 shadow-[0_0_12px_rgba(20,184,166,0.06)]"
                        : isToday
                        ? "border-teal-400/20 bg-teal-500/[0.03]"
                        : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]"
                    }`}>
                    <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider leading-none ${isSelected ? "text-teal-400/80" : isToday ? "text-teal-400/55" : "text-white/30"}`}>
                      {DAY_ABBREVS[d.getDay()]}
                    </span>
                    <span className={`text-[20px] sm:text-[22px] font-semibold leading-tight ${isSelected ? "text-teal-300" : isToday ? "text-teal-400" : "text-white/55"}`}>
                      {d.getDate()}
                    </span>
                    {/* Source-colored event dots (max 3) */}
                    <div className="flex items-center gap-1 h-2.5">
                      {sourceDots.length > 0
                        ? sourceDots.map((dotClass, di) => (
                            <span key={di} className={`w-[6px] h-[6px] rounded-full ${dotClass} ${isSelected ? "opacity-80" : "opacity-45"} transition-opacity`} />
                          ))
                        : <span className="w-[6px] h-[6px] rounded-full bg-transparent" />
                      }
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Selected day agenda ── */}
            {(() => {
              const todayInWeek = weekDays.findIndex((wd) => `${wd.getFullYear()}-${wd.getMonth()}-${wd.getDate()}` === todayKey);
              const safeIdx     = mobileWeekDayIdx !== null ? mobileWeekDayIdx : todayInWeek >= 0 ? todayInWeek : 0;
              const selDay      = weekDays[safeIdx];
              const dayKey      = `${selDay.getFullYear()}-${selDay.getMonth()}-${selDay.getDate()}`;
              const evMapKey    = `${selDay.getFullYear()}-${String(selDay.getMonth() + 1).padStart(2, "0")}-${String(selDay.getDate()).padStart(2, "0")}`;
              const isToday     = dayKey === todayKey;
              const dayEvs      = eventsMap.get(evMapKey) ?? [];
              const dayLabel    = selDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
              return (
                <div className="wac-card p-0 overflow-hidden min-h-[280px] flex flex-col">
                  {/* Day header */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] shrink-0">
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${isToday ? "text-teal-400" : "text-white/38"}`}>
                        {isToday ? "Today" : DAY_ABBREVS[selDay.getDay()]}
                      </p>
                      <p className="text-[13px] font-medium text-white/60 mt-0.5">{dayLabel}</p>
                    </div>
                    <button
                      onClick={() => openCreateEventPage(makeDraft(selDay))}
                      className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45 hover:text-white/75 transition-colors"
                    >
                      <Plus size={10} />
                      Add
                    </button>
                  </div>
                  {/* Day events */}
                  {eventsLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                    </div>
                  ) : dayEvs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                      <p className="text-[12px] text-white/28">No events scheduled</p>
                      <p className="text-[10px] text-white/18 mt-1">Tap Add to create one</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04] flex-1">
                      {dayEvs.map((ev) => {
                        const c = eventColors(ev.source);
                        const badge = getEventMetaBadge(ev);
                        const timeLabel = new Date(ev.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        const endLabel = ev.end_time ? new Date(ev.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : null;
                        const sourceLabel = eventSourceLabel(ev.source);
                        return (
                          <button key={ev.id}
                            onClick={() => openEventDetail(ev)}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                          >
                            <div className={`h-11 w-1 shrink-0 rounded-full ${c.rule}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <p className={`text-[13px] font-medium leading-snug truncate ${c.text}`}>{ev.title}</p>
                                {badge && (
                                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[10px] text-white/35">
                                {timeLabel}{endLabel ? ` – ${endLabel}` : ""}{ev.location ? ` · ${ev.location}` : ""}
                              </p>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot} opacity-85`} />
                                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/22">{sourceLabel}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Sidebar — desktop only; mobile uses toolbar + button for actions */}
      <div className="hidden lg:block shrink-0 space-y-3 lg:w-[17.5rem] xl:w-[18.5rem]">

        {calView === "month" && !selectedDayAgenda && (
          <div className="wac-card p-4 lg:sticky lg:top-[112px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25">Selected Day</div>
                <p className="mt-1 text-[13px] font-medium text-white/42 leading-snug">Choose a date</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-white/24">
              Select a day to preview its agenda here and keep the month view in focus.
            </p>
          </div>
        )}

        {selectedDayAgenda && (
          <div className="wac-card p-4 lg:sticky lg:top-[112px]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25">Selected Day</div>
                <p className="mt-1 text-[13px] font-medium text-white/68 leading-snug">{selectedDayAgenda.dateLabel}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-white/34">
                  {selectedDayAgenda.dayEvs.length}
                </span>
                <button
                  onClick={() => { setAgendaDay(null); setSelectedDay(null); }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.05] text-white/35 hover:text-white/65 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => {
                  openCreateEventPage(makeDraft(selectedDayAgenda.date));
                  setAgendaDay(null);
                }}
                className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/45 hover:text-white/75 transition-colors"
              >
                <Plus size={10} />
                Add event
              </button>
              <span className="text-[10px] text-white/24">Scheduled</span>
            </div>
            {selectedDayAgenda.dayEvs.length === 0 ? (
              <p className="py-4 text-center text-[11px] text-white/22">No events on this day.</p>
            ) : (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {selectedDayAgenda.dayEvs.map((ev) => {
                  const c = eventColors(ev.source);
                  const sourceLabel = eventSourceLabel(ev.source);
                  const timeLabel = new Date(ev.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  return (
                    <button
                      key={ev.id}
                      onClick={() => { openEventDetail(ev); setAgendaDay(null); setSelectedDay(null); }}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left transition-colors hover:border-white/[0.12]"
                    >
                      <div className={`h-8 w-1 shrink-0 rounded-full ${c.rule}`} />
                      <div className="min-w-0">
                        <p className={`truncate text-[13px] font-medium leading-snug ${c.text}`}>{ev.title}</p>
                        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/24">{sourceLabel}</p>
                        <p className="text-[10px] text-white/35">{timeLabel}{ev.location ? ` · ${ev.location}` : ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Source Manager ── */}
        <div className="wac-card p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25">Sources</div>
            <div className="flex items-center gap-3">
              <button
                onClick={showAllSources}
                disabled={allSourcesActive}
                className="text-[9.5px] text-white/30 transition-colors hover:text-white/55 disabled:cursor-default disabled:opacity-30"
              >
                Select all
              </button>
              <button
                onClick={hideAllSources}
                disabled={!anySourcesActive}
                className="text-[9.5px] text-white/30 transition-colors hover:text-white/55 disabled:cursor-default disabled:opacity-30"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* ── WAC Master ── */}
          {(() => {
            const wacBucket = sourceBuckets.wac;
            const wacActive = wacBucket.mode !== "off";
            return (
              <div className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 bg-white/55 ${wacActive ? "opacity-75" : "opacity-18"} transition-opacity`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-medium transition-colors ${wacActive ? "text-white/65" : "text-white/25"}`}>WAC Master</div>
                    <div className={`text-[9.5px] mt-0.5 transition-colors ${wacActive ? "text-white/28" : "text-white/14"}`}>Official WAC events and platform-wide dates</div>
                  </div>
                  <button onClick={() => toggleSource("wac")} className="shrink-0">
                    <div className={`relative w-[36px] h-[20px] rounded-full transition-colors duration-200 ${wacActive ? "bg-teal-500/90" : "bg-white/[0.08]"}`}>
                      <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-full shadow-sm transition-all duration-200 ${wacActive ? "left-[19px] bg-white" : "left-[3px] bg-white/40"}`} />
                    </div>
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="border-t border-white/[0.05]" />

          {/* ── Source buckets ── */}
          {(["group", "org", "business"] as CalSource[]).map((key) => {
            const source = CAL_SOURCES.find((s) => s.id === key)!;
            const bucket = sourceBuckets[key];
            const isActive = bucket.mode !== "off";
            const entities = getEntitiesForBucket(key);
            const statusText = bucket.mode === "off" ? "" : bucket.mode === "all" ? (entities.length > 0 ? `All · ${entities.length}` : "") : `Custom · ${bucket.selected.size}`;
            const sourceDesc = key === "group" ? "Calendars from groups you follow" : key === "org" ? "Calendars from organizations you follow" : "Calendars from businesses you follow";
            const emptyLabel = key === "group" ? "No group calendars yet" : key === "org" ? "No organization calendars yet" : "No business calendars yet";
            const ctaLabel = key === "group" ? "Find groups" : key === "org" ? "Find organizations" : "Find businesses";
            const ctaHref = key === "group" ? "/groups" : key === "org" ? "/organizations" : "/businesses";

            return (
              <div key={key} className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${source.dot} ${isActive ? "opacity-75" : "opacity-18"} transition-opacity`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium transition-colors ${isActive ? "text-white/65" : "text-white/25"}`}>{source.label}</span>
                      {statusText && (
                        <span className={`text-[9px] font-medium ${bucket.mode === "custom" ? "text-teal-400/50" : "text-white/20"}`}>{statusText}</span>
                      )}
                    </div>
                    <div className={`text-[9.5px] mt-0.5 transition-colors ${isActive ? "text-white/28" : "text-white/14"}`}>{sourceDesc}</div>
                  </div>
                  <button onClick={() => toggleSource(key)} className="shrink-0">
                    <div className={`relative w-[36px] h-[20px] rounded-full transition-colors duration-200 ${isActive ? "bg-teal-500/90" : "bg-white/[0.08]"}`}>
                      <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-full shadow-sm transition-all duration-200 ${isActive ? "left-[19px] bg-white" : "left-[3px] bg-white/40"}`} />
                    </div>
                  </button>
                </div>

                {/* Inline entity list when bucket is active */}
                {isActive && entities.length > 0 && (
                  <div className="mt-2 ml-[18px] space-y-0.5">
                    {entities.map((entity) => {
                      const isSelected = bucket.mode === "all" || bucket.selected.has(entity.id);
                      return (
                        <button
                          key={entity.id}
                          onClick={() => {
                            if (bucket.mode === "all") {
                              const selected = new Set(entities.map((e) => e.id));
                              selected.delete(entity.id);
                              setBucketCustomSelection(key, selected);
                            } else {
                              const next = new Set(bucket.selected);
                              if (isSelected) next.delete(entity.id); else next.add(entity.id);
                              setBucketCustomSelection(key, next);
                            }
                          }}
                          className="w-full flex items-center gap-2 py-1 text-left group"
                        >
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-teal-500/80" : "border border-white/[0.12] bg-white/[0.03]"
                          }`}>
                            {isSelected && <Check size={9} className="text-white" />}
                          </div>
                          <span className={`text-[10px] truncate flex-1 transition-colors ${isSelected ? "text-white/50" : "text-white/22"}`}>
                            {entity.name}
                          </span>
                        </button>
                      );
                    })}
                    {bucket.mode === "custom" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setBucketMode(key, "all")}
                          className="text-[9px] font-medium text-white/22 hover:text-white/45 transition-colors"
                        >
                          Select all
                        </button>
                        <button
                          onClick={() => setBucketCustomSelection(key, new Set())}
                          className="text-[9px] font-medium text-white/22 hover:text-white/45 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {isActive && entities.length === 0 && (
                  <div className="mt-2 ml-[18px]">
                    <p className="text-[10px] text-white/20">{emptyLabel}</p>
                    <Link
                      href={ctaHref}
                      className="inline-block mt-1 text-[9.5px] font-medium text-teal-400/50 hover:text-teal-400/75 transition-colors"
                    >
                      {ctaLabel} →
                    </Link>
                  </div>
                )}

                {key !== "business" && <div className="border-t border-white/[0.05] mt-2.5" />}
              </div>
            );
          })}

          {/* ── External Calendars ── */}
          <div className="border-t border-white/[0.05] mt-1 pt-3">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-2 h-2 rounded-full shrink-0 bg-purple-400/60" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-white/50">External Calendars</div>
                <div className="text-[9.5px] mt-0.5 text-white/22">Connected personal or imported calendars</div>
              </div>
            </div>
            {importedCals.length > 0 ? (
              <div className="space-y-1.5 ml-[18px] mb-3">
                {importedCals.map((cal) => (
                  <div key={cal.id} className="flex items-center gap-2 group">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${cal.colorDot} opacity-75`} />
                    <span className="text-[10px] truncate text-white/50 flex-1">{cal.name}</span>
                    <button onClick={() => removeImportedCal(cal.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/70 transition-all shrink-0">
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-white/18 ml-[18px] mb-2.5">No external calendars connected</p>
            )}
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] text-[10px] font-medium text-white/30 hover:text-white/55 hover:border-white/14 transition-colors">
              <Plus size={10} />Connect Calendar
            </button>
          </div>
        </div>

        {/* This period's events — real data from calendar fetch */}
        <div className="wac-card p-4">
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25 mb-3">
            {calView === "agenda" ? "This Week" : `${MONTH_NAMES[navDate.getMonth()]}`}
          </div>
          {calEvents.length === 0 ? (
            <p className="text-[11px] text-white/22 leading-relaxed">
              No events this period.
            </p>
          ) : (
            <div className="space-y-3">
              {calEvents.slice(0, 5).map((ev) => {
                const c = eventColors(ev.source);
                const badge = getEventMetaBadge(ev);
                const d = new Date(ev.start_time);
                return (
                  <button key={ev.id} onClick={() => openEventDetail(ev)} className="w-full text-left flex items-start gap-2 group">
                    <span className={`w-1.5 h-1.5 rounded-full mt-[3px] shrink-0 ${c.dot} opacity-55`} />
                    <div className="min-w-0">
                      <div className="text-[9.5px] text-white/28 leading-none mb-0.5">
                        {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}
                        {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="text-[11px] text-white/52 group-hover:text-white/78 leading-snug transition-colors truncate">{ev.title}</div>
                        {badge && (
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {calEvents.length > 5 && (
                <p className="text-[9.5px] text-white/22 pl-3.5">+{calEvents.length - 5} more</p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Mobile: Calendar Sources full-screen control panel — portalled above Navbar */}
      {showSourceSheet && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] lg:hidden bg-[#0c0c0e] flex flex-col" style={{ height: "100dvh" }}>

          {/* ── Drill-down sub-screen ── */}
          {drillDownSource !== null ? (() => {
            const ddKey = drillDownSource;
            const ddBucket = sourceBuckets[ddKey];
            const ddEntities = getEntitiesForBucket(ddKey);
            const ddSource = CAL_SOURCES.find((s) => s.id === ddKey);
            const ddLabel = ddSource?.label ?? ddKey;
            const ddDot = ddSource?.dot ?? "bg-white/55";
            // Local draft selection for this drill-down (initialized from bucket state)
            // We use the bucket state directly since changes apply immediately
            const ddIsAllMode = ddBucket.mode === "all";
            const ddSelected = ddBucket.selected;
            const ddAllSelected = ddIsAllMode || (ddEntities.length > 0 && ddEntities.every((e) => ddSelected.has(e.id)));
            const ddNoneSelected = !ddIsAllMode && ddEntities.every((e) => !ddSelected.has(e.id));

            return (
              <>
                {/* Header */}
                <div className="shrink-0 bg-[#0c0c0e]">
                  <div className="flex items-center gap-3 px-4 h-[56px]">
                    <button onClick={() => setDrillDownSource(null)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-all">
                      <ChevronLeft size={18} />
                    </button>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ddDot} opacity-80`} />
                    <h2 className="text-[16px] font-semibold text-white/95 tracking-tight">{ddLabel}</h2>
                  </div>
                  <div className="h-px bg-white/[0.07]" />
                  {/* Mode selector + utility */}
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(["all", "custom", "off"] as SourceBucketMode[]).map((m) => {
                        const isActive = ddBucket.mode === m;
                        const modeLabel = m === "all" ? "All" : m === "custom" ? "Custom" : "Off";
                        return (
                          <button key={m}
                            onClick={() => setBucketMode(ddKey, m)}
                            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                              isActive
                                ? "bg-white/[0.12] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]"
                                : "text-white/35 hover:text-white/55 hover:bg-white/[0.04]"
                            }`}
                          >
                            {modeLabel}
                          </button>
                        );
                      })}
                    </div>
                    {ddBucket.mode === "custom" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setBucketCustomSelection(ddKey, new Set(ddEntities.map((e) => e.id)))}
                          disabled={ddAllSelected}
                          className="text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors disabled:opacity-25"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setBucketCustomSelection(ddKey, new Set())}
                          disabled={ddNoneSelected}
                          className="text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors disabled:opacity-25"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-white/[0.05]" />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
                  {ddBucket.mode === "off" ? (
                    <div className="flex flex-col items-center justify-center h-full px-8">
                      <div className={`w-10 h-10 rounded-full ${ddDot} opacity-15 mb-4`} />
                      <p className="text-[14px] font-medium text-white/30 text-center mb-1">Source disabled</p>
                      <p className="text-[12px] text-white/20 text-center leading-relaxed">
                        Set to All or Custom to see events from this source.
                      </p>
                    </div>
                  ) : ddBucket.mode === "all" ? (
                    <div className="flex flex-col items-center justify-center h-full px-8">
                      <div className={`w-10 h-10 rounded-full ${ddDot} opacity-30 mb-4`} />
                      <p className="text-[14px] font-medium text-white/45 text-center mb-1">Showing all {ddLabel.toLowerCase()}</p>
                      <p className="text-[12px] text-white/20 text-center leading-relaxed">
                        {ddEntities.length > 0
                          ? `All ${ddEntities.length} calendar${ddEntities.length !== 1 ? "s" : ""} in this source are visible.`
                          : "All events from this source will appear on your calendar."}
                      </p>
                      {ddEntities.length > 0 && (
                        <button
                          onClick={() => {
                            // Switch to custom with all selected
                            setBucketCustomSelection(ddKey, new Set(ddEntities.map((e) => e.id)));
                          }}
                          className="mt-4 px-4 py-2 rounded-full border border-white/[0.08] text-[12px] font-medium text-white/40 hover:text-white/65 hover:border-white/[0.14] transition-colors"
                        >
                          Customize selection
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Custom mode: entity list with checkboxes */
                    <div className="pb-[max(env(safe-area-inset-bottom,0px),20px)]">
                      {ddEntities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-8">
                          <p className="text-[13px] text-white/25 text-center leading-relaxed">
                            {ddKey === "group" ? "Join groups to see them here." :
                             ddKey === "org" ? "Follow organizations to see them here." :
                             ddKey === "business" ? "Follow businesses to see them here." :
                             "No calendars available."}
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2">
                          {ddEntities.map((entity) => {
                            const isChecked = ddSelected.has(entity.id);
                            return (
                              <button
                                key={entity.id}
                                onClick={() => {
                                  const next = new Set(ddSelected);
                                  if (isChecked) next.delete(entity.id); else next.add(entity.id);
                                  setBucketCustomSelection(ddKey, next);
                                }}
                                className="w-full flex items-center px-5 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
                              >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? "bg-teal-500 border-teal-500"
                                    : "border-white/[0.18] bg-white/[0.04]"
                                }`}>
                                  {isChecked && <Check size={13} className="text-white" />}
                                </div>
                                <span className={`text-[14px] font-medium ml-4 flex-1 truncate text-left transition-colors ${
                                  isChecked ? "text-white/80" : "text-white/35"
                                }`}>{entity.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-white/[0.07] bg-[#0c0c0e] px-5 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
                  <button onClick={() => setDrillDownSource(null)}
                    className="w-full h-[46px] rounded-xl bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.15] text-[14px] font-semibold text-white/80 transition-colors">
                    Done
                  </button>
                </div>
              </>
            );
          })() : (
          /* ── Main source list screen ── */
          <>
          {/* ── Header ── */}
          <div className="shrink-0 bg-[#0c0c0e]">
            <div className="flex items-center justify-between px-4 h-[56px]">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSourceSheet(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-all">
                  <X size={18} />
                </button>
                <h2 className="text-[16px] font-semibold text-white/95 tracking-tight">Calendar Sources</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={showAllSources}
                  disabled={allSourcesActive}
                  className="text-[12px] font-medium text-white/40 hover:text-white/65 transition-colors disabled:opacity-25 disabled:cursor-default"
                >
                  All On
                </button>
                <span className="text-white/15 text-[10px]">|</span>
                <button
                  onClick={hideAllSources}
                  disabled={!anySourcesActive}
                  className="text-[12px] font-medium text-white/40 hover:text-white/65 transition-colors disabled:opacity-25 disabled:cursor-default"
                >
                  All Off
                </button>
              </div>
            </div>
            <div className="h-px bg-white/[0.07]" />
            <div className="px-5 py-2.5">
              <span className="text-[11px] font-medium text-white/35 tracking-wide">
                {activeSourceCount} of {CORE_CALENDAR_SOURCE_IDS.length} source{CORE_CALENDAR_SOURCE_IDS.length !== 1 ? "s" : ""} active
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
            <div className="pb-[max(env(safe-area-inset-bottom,0px),40px)]">

              {/* ── Source Buckets ── */}
              <div className="px-4 pt-5 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1 px-1">Sources</p>
              </div>
              <div>
                {CAL_SOURCES.filter((s) => s.id !== "imported").map(({ id, label, dot }) => {
                  const key = id as CalendarSourceFilter;
                  const bucket = sourceBuckets[key];
                  const isActive = bucket.mode !== "off";
                  const entities = getEntitiesForBucket(key);
                  const hasEntities = entities.length > 0;
                  const summary = bucketSummaryLabel(key);
                  const descriptions: Record<string, string> = {
                    wac: "Official WAC events",
                    group: "Events from your groups",
                    org: "Organization events",
                    business: "Business events",
                  };

                  return (
                    <div key={id} className="flex items-center px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                      {/* Left: color dot + labels → tap to drill down (if has entities) */}
                      <button
                        onClick={() => {
                          if (key === "wac") {
                            // WAC has no sub-entities, just toggle
                            toggleSource(id);
                          } else {
                            setDrillDownSource(key);
                          }
                        }}
                        className="flex items-center flex-1 min-w-0 text-left"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot} ${isActive ? "opacity-90" : "opacity-20"} transition-opacity`} />
                        <div className="flex-1 min-w-0 ml-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[14px] font-medium transition-colors ${isActive ? "text-white/80" : "text-white/30"}`}>{label}</span>
                            {bucket.mode === "custom" && (
                              <span className="text-[10px] font-semibold text-teal-400/60 bg-teal-400/[0.08] px-1.5 py-0.5 rounded-full">
                                {summary}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/25 block mt-0.5 leading-tight">{descriptions[id] || ""}</span>
                        </div>
                        {/* Chevron for drill-down (not for WAC) */}
                        {key !== "wac" && hasEntities && (
                          <ChevronRight size={14} className="text-white/20 shrink-0 ml-2" />
                        )}
                      </button>
                      {/* Right: toggle switch */}
                      <button
                        onClick={() => toggleSource(id)}
                        className="shrink-0 ml-3"
                      >
                        <div className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 ${isActive ? "bg-teal-500" : "bg-white/[0.12]"}`}>
                          <span className={`absolute top-1/2 left-[3px] w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${isActive ? "-translate-y-1/2 translate-x-[18px] bg-white" : "-translate-y-1/2 translate-x-0 bg-white/50"}`} />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── Connected Calendars ── */}
              <div className="mt-2">
                <div className="h-px bg-white/[0.06] mx-4" />
                <div className="px-4 pt-5 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1 px-1">Connected Calendars</p>
                </div>
                {importedCals.length > 0 ? (
                  <div>
                    {importedCals.map((cal) => (
                      <div key={cal.id} className="flex items-center px-5 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cal.colorDot} opacity-90 transition-opacity`} />
                        <span className="text-[14px] font-medium ml-4 flex-1 truncate text-left text-white/75">{cal.name}</span>
                        <button onClick={() => removeImportedCal(cal.id)} className="text-white/15 hover:text-red-400/60 transition-colors shrink-0 p-1.5">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <Link2 size={16} className="text-white/15 shrink-0" />
                      <p className="text-[12px] text-white/25 leading-relaxed">
                        No external calendars connected yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── External Calendars ── */}
              <div className="mt-2">
                <div className="h-px bg-white/[0.06] mx-4" />
                <div className="px-4 pt-5 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/25 mb-1 px-1">External Calendars</p>
                </div>
                <div className="px-5">
                  <p className="text-[12px] text-white/30 leading-relaxed mb-4">
                    Connect Google Calendar, Outlook, Apple Calendar, or an ICS feed. External events sync one-way into WAC — they are read-only and managed in the source app.
                  </p>
                  <button
                    onClick={() => { setShowSourceSheet(false); setShowImportModal(true); }}
                    className="w-full flex items-center justify-center gap-2.5 h-[48px] rounded-xl border border-teal-400/25 bg-teal-500/[0.07] text-teal-400/80 hover:bg-teal-500/[0.14] hover:text-teal-400 active:bg-teal-500/[0.18] transition-colors">
                    <Link2 size={15} />
                    <span className="text-[14px] font-semibold">Connect Calendar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Sticky footer: Done ── */}
          <div className="shrink-0 border-t border-white/[0.07] bg-[#0c0c0e] px-5 py-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]">
            <button onClick={() => setShowSourceSheet(false)}
              className="w-full h-[46px] rounded-xl bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.15] text-[14px] font-semibold text-white/80 transition-colors">
              Done
            </button>
          </div>
          </>
          )}
        </div>
      , document.body)}

    </div>

    {/* Import Calendar modal */}
    {showImportModal && (
      <ImportCalendarModal onClose={() => setShowImportModal(false)} onSave={addImportedCal} />
    )}

    {/* Modals */}
    {modalDraft && !showFullEditor && (
      <CreateEventModal draft={modalDraft} onClose={closeModal} onSave={handleEventSave} onMoreOptions={handleMoreOptions} />
    )}
    {modalDraft && showFullEditor && (
      <FullEventEditorModal draft={modalDraft} onClose={closeModal} onSave={handleEventSave} />
    )}
    {selectedCalEvent && (
      <CalEventDetailModal
        event={selectedCalEvent}
        onClose={() => setSelectedCalEvent(null)}
        onEdit={() => openEventEdit(selectedCalEvent)}
        onDelete={() => handleEventDelete(selectedCalEvent.id)}
      />
    )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const [activeLens, setActiveLens] = useState<Lens>("discover");
  const [appliedFilters, setAppliedFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [draftFilters,   setDraftFilters]   = useState<EventFilters>(DEFAULT_FILTERS);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const calendarFilterTrigger = useRef<(() => void) | null>(null);
  const [calActiveSourceCount, setCalActiveSourceCount] = useState(CORE_CALENDAR_SOURCE_IDS.length);
  const [filterDrillDown, setFilterDrillDown] = useState<HierarchicalSourceId | null>(null);
  const [drillDraftSelected, setDrillDraftSelected] = useState<string[]>([]);
  const [drillSearch, setDrillSearch] = useState("");
  const [calendarHeaderSignedIn, setCalendarHeaderSignedIn] = useState(false);

  function openFilterSheet() {
    setDraftFilters(appliedFilters);
    setFilterDrillDown(null);
    setDrillSearch("");
    setShowFilterSheet(true);
  }
  function applyFilters() {
    setAppliedFilters(draftFilters);
    setShowFilterSheet(false);
    setFilterDrillDown(null);
    setDrillSearch("");
  }
  function resetDraftFilters() {
    setDraftFilters(DEFAULT_FILTERS);
  }
  function toggleArr<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function openDrillDown(id: HierarchicalSourceId) {
    setDrillDraftSelected(draftFilters[id].selected);
    setDrillSearch("");
    setFilterDrillDown(id);
  }
  function applyDrillDown() {
    if (!filterDrillDown) return;
    setDraftFilters((f) => ({
      ...f,
      [filterDrillDown]: {
        mode: drillDraftSelected.length === 0 ? "all" : "custom",
        selected: drillDraftSelected,
      },
    }));
    setFilterDrillDown(null);
    setDrillSearch("");
  }
  function toggleHierarchicalSource(id: HierarchicalSourceId) {
    setDraftFilters((f) => ({
      ...f,
      [id]: { ...f[id], mode: f[id].mode !== "off" ? "off" : "all" },
    }));
  }
  function hierSourceStateLabel(state: HierarchicalSourceState, id: HierarchicalSourceId): string | null {
    if (state.mode === "off") return null;
    if (state.mode === "all") return "All";
    const total = MOCK_FOLLOWED[id].length;
    return `${state.selected.length} of ${total}`;
  }

  // Quick filter ↔ structured filter synchronization
  function toggleQuickFilter(qf: string) {
    setDraftFilters((f) => {
      const isActive = f.quick.includes(qf);
      const nextQuick = isActive ? f.quick.filter((q) => q !== qf) : [...f.quick, qf];
      const next = { ...f, quick: nextQuick };

      if (qf === "This Week") {
        next.date = isActive ? null : "This Week";
      } else if (qf === "Online") {
        next.formats = isActive
          ? f.formats.filter((fmt) => fmt !== "Online")
          : f.formats.includes("Online") ? f.formats : [...f.formats, "Online"];
      } else if (qf === "Popular") {
        next.sort = isActive ? "Relevant" : "Popular";
      } else if (qf === "Near Me") {
        next.sort = isActive ? "Relevant" : "Closest";
      }

      return next;
    });
  }

  const activeFilterCount = useMemo(() => (
    appliedFilters.categories.length +
    appliedFilters.formats.length +
    (appliedFilters.date ? 1 : 0) +
    appliedFilters.sources.length +
    (appliedFilters.groups.mode !== "off" ? 1 : 0) +
    (appliedFilters.organizations.mode !== "off" ? 1 : 0) +
    (appliedFilters.businesses.mode !== "off" ? 1 : 0) +
    appliedFilters.paths.length +
    (appliedFilters.sort && appliedFilters.sort !== "Relevant" ? 1 : 0) +
    appliedFilters.quick.length
  ), [appliedFilters]);

  // Build active filter summary tokens for display
  const activeFilterSummary = useMemo(() => {
    const tokens: string[] = [];
    tokens.push(...appliedFilters.quick);
    tokens.push(...appliedFilters.categories);
    if (appliedFilters.date) tokens.push(appliedFilters.date);
    tokens.push(...appliedFilters.formats);
    tokens.push(...appliedFilters.sources);
    if (appliedFilters.groups.mode !== "off") tokens.push("Groups");
    if (appliedFilters.organizations.mode !== "off") tokens.push("Organizations");
    if (appliedFilters.businesses.mode !== "off") tokens.push("Businesses");
    tokens.push(...appliedFilters.lifeStages);
    if (appliedFilters.sort && appliedFilters.sort !== "Relevant") tokens.push(appliedFilters.sort);
    return tokens;
  }, [appliedFilters]);

  // Draft filter summary for live preview
  const draftFilterSummary = useMemo(() => {
    const tokens: string[] = [];
    tokens.push(...draftFilters.quick);
    tokens.push(...draftFilters.categories);
    if (draftFilters.date) tokens.push(draftFilters.date);
    tokens.push(...draftFilters.formats);
    tokens.push(...draftFilters.sources);
    if (draftFilters.groups.mode !== "off") tokens.push("Groups");
    if (draftFilters.organizations.mode !== "off") tokens.push("Organizations");
    if (draftFilters.businesses.mode !== "off") tokens.push("Businesses");
    tokens.push(...draftFilters.lifeStages);
    if (draftFilters.sort && draftFilters.sort !== "Relevant") tokens.push(draftFilters.sort);
    return tokens;
  }, [draftFilters]);

  const draftFilterCount = useMemo(() => (
    draftFilters.categories.length +
    draftFilters.formats.length +
    (draftFilters.date ? 1 : 0) +
    draftFilters.sources.length +
    (draftFilters.groups.mode !== "off" ? 1 : 0) +
    (draftFilters.organizations.mode !== "off" ? 1 : 0) +
    (draftFilters.businesses.mode !== "off" ? 1 : 0) +
    draftFilters.lifeStages.length +
    (draftFilters.sort && draftFilters.sort !== "Relevant" ? 1 : 0) +
    draftFilters.quick.length
  ), [draftFilters]);

  type LocationState = "idle" | "requesting" | "granted" | "denied";
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState("denied");
      return;
    }
    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationState("granted");
        // Reverse-geocode to a city/region label using a free API
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const json = await res.json();
          const city   = json?.address?.city || json?.address?.town || json?.address?.village || json?.address?.county || null;
          const state  = json?.address?.state || null;
          const country = json?.address?.country_code?.toUpperCase() || null;
          const parts = [city, state ?? country].filter(Boolean);
          setLocationLabel(parts.length > 0 ? parts.join(", ") : "Your area");
        } catch {
          setLocationLabel("Your area");
        }
      },
      () => {
        setLocationState("denied");
      },
      { timeout: 10000 }
    );
  }

  const isDiscover = activeLens === "discover";
  const isCalendar = activeLens === "calendar";
  const calendarLensHelperText = calendarHeaderSignedIn
    ? "WAC follows its source toggle. Groups stay category-based for now. Organization and business events are refined by the calendars you've added."
    : "Track WAC, organization, group, and business events in one source-aware calendar.";

  // When NOT in calendar mode, the "events-compose" dispatch from the navbar
  // should fall through to the full event builder at /events/new.
  // (When in calendar mode, CalendarModeView handles the same event to open Quick Create.)
  const isCalendarRef = useRef(isCalendar);
  useEffect(() => { isCalendarRef.current = isCalendar; }, [isCalendar]);
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setCalendarHeaderSignedIn(!!data.session?.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCalendarHeaderSignedIn(!!session?.user);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const handler = () => { if (!isCalendarRef.current) router.push("/events/new"); };
    window.addEventListener("events-compose", handler);
    return () => window.removeEventListener("events-compose", handler);
  }, [router]);

  // Body scroll lock when filter sheet is open
  useEffect(() => {
    document.body.style.overflow = showFilterSheet ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showFilterSheet]);

  // Escape key to close filter panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && showFilterSheet) setShowFilterSheet(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showFilterSheet]);

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-24 pt-20 md:pt-24">

        {/* Page header */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          <span className="italic font-light opacity-90 text-teal-400">Events</span>
        </h1>
        <p className="mt-2 text-sm text-white/45 max-w-lg hidden sm:block">
          {isCalendar ? calendarLensHelperText : "Community gatherings, network calendars, and shared moments across the diaspora."}
        </p>

        {/* Mode selector + filter icon — unified capsule */}
        <div className="mt-3 sm:mt-5">
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full w-fit">
            {LENSES.map(({ id, label, icon: Icon }) => {
              const active = activeLens === id;
              return (
                <button key={id} onClick={() => setActiveLens(id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] transition-all whitespace-nowrap ${
                    active ? "bg-white/[0.08] text-white/80" : "text-white/40 hover:text-white/65"
                  }`}>
                  <Icon size={12} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                  {label}
                </button>
              );
            })}
            {/* Divider */}
            <span className="w-px h-4 bg-white/[0.10] mx-0.5 shrink-0" />
            {/* Context-sensitive filter button */}
            {(() => {
              const isCalFilter = activeLens === "calendar";
              const hasFilter = isCalFilter
                ? calActiveSourceCount < CORE_CALENDAR_SOURCE_IDS.length
                : activeFilterCount > 0;
              const badgeCount = isCalFilter ? calActiveSourceCount : activeFilterCount;
              return (
                <button
                  onClick={() => isCalFilter ? calendarFilterTrigger.current?.() : openFilterSheet()}
                  className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                    hasFilter
                      ? "bg-white/[0.08] text-white/80"
                      : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
                  }`}
                >
                  <SlidersHorizontal size={12} strokeWidth={hasFilter ? 2.2 : 1.8} className="shrink-0" />
                  {hasFilter && (
                    <span className="absolute -right-0.5 -top-0.5 min-w-[14px] h-[14px] rounded-full bg-teal-500/80 flex items-center justify-center px-[3px] text-[8px] font-bold text-white leading-none">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Calendar workspace */}
        {isCalendar && (
          <CalendarModeView
            registerFilterTrigger={(fn) => { calendarFilterTrigger.current = fn; }}
            onActiveSourceCountChange={setCalActiveSourceCount}
          />
        )}

        {/* Discover workspace */}
        {isDiscover && (
          <>
            {/* ── Main content ── */}
            <div className="mt-4">

              {/* ── Quick shortcut chips ── */}
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* Near Me — special: triggers geolocation */}
                <button
                  onClick={() => {
                    if (locationState === "idle" || locationState === "denied") {
                      requestLocation();
                      setAppliedFilters((f) => ({ ...f, quick: f.quick.includes("Near Me") ? f.quick : [...f.quick, "Near Me"], sort: "Closest" }));
                    } else {
                      setLocationState("idle"); setLocationLabel(null);
                      setAppliedFilters((f) => ({ ...f, quick: f.quick.filter((q) => q !== "Near Me"), sort: f.sort === "Closest" ? "Relevant" : f.sort }));
                    }
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap ${
                    locationState === "granted"
                      ? "border-teal-400/30 bg-teal-500/[0.08] text-teal-400/80"
                      : locationState === "requesting"
                      ? "border-white/[0.15] bg-white/[0.04] text-white/45"
                      : "border-white/[0.12] bg-transparent text-white/50 hover:text-white/75 hover:border-white/[0.18]"
                  }`}
                >
                  <MapPin size={11} className="shrink-0" />
                  {locationState === "granted" && locationLabel
                    ? locationLabel
                    : locationState === "requesting"
                    ? "Locating…"
                    : "Near Me"}
                </button>

                {/* This Week */}
                {(() => {
                  const active = appliedFilters.quick.includes("This Week");
                  return (
                    <button
                      onClick={() => setAppliedFilters((f) => ({ ...f, quick: toggleArr(f.quick, "This Week"), date: active ? f.date : "This Week" }))}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap ${
                        active ? "border-teal-400/30 bg-teal-500/[0.08] text-teal-400/80" : "border-white/[0.12] bg-transparent text-white/50 hover:text-white/75 hover:border-white/[0.18]"
                      }`}
                    >
                      <Clock size={11} className="shrink-0" />
                      This Week
                    </button>
                  );
                })()}

                {/* My Network */}
                {(() => {
                  const active = appliedFilters.quick.includes("My Network");
                  return (
                    <button
                      onClick={() => setAppliedFilters((f) => ({
                        ...f,
                        quick: toggleArr(f.quick, "My Network"),
                        sources: active ? f.sources.filter((s) => s !== "My Network") : (f.sources.includes("My Network") ? f.sources : [...f.sources, "My Network"]),
                      }))}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap ${
                        active ? "border-teal-400/30 bg-teal-500/[0.08] text-teal-400/80" : "border-white/[0.12] bg-transparent text-white/50 hover:text-white/75 hover:border-white/[0.18]"
                      }`}
                    >
                      <Users size={11} className="shrink-0" />
                      My Network
                    </button>
                  );
                })()}

                {/* Active filter count badge — shows extra filters beyond quick shortcuts */}
                {activeFilterSummary.filter((t) => !["Near Me", "This Week", "My Network"].includes(t)).length > 0 && (
                  <span className="shrink-0 text-[10px] text-white/25 font-medium">
                    +{activeFilterSummary.filter((t) => !["Near Me", "This Week", "My Network"].includes(t)).length}
                  </span>
                )}
              </div>

              {/* Filter overlay is rendered at root level to avoid stacking context issues */}

              {/* ── Section 1: From Your Network ── */}
              <section className="mt-8">
                <SectionLabel label="From Your Network" variant="featured" className="mb-4" />
                <div className="flex gap-3 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {FEATURED.map((ev) => (
                    <div key={ev.id} className="shrink-0 w-[272px]">
                      <FeaturedCard event={ev} />
                    </div>
                  ))}
                </div>
                <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {FEATURED.map((ev) => <FeaturedCard key={ev.id} event={ev} />)}
                </div>
              </section>

              {/* ── Section 2: Near You ── */}
              <section className="mt-10">
                <SectionLabel label="Near You" variant="standard" className="mb-4" />
                {locationState === "granted" ? (
                  <div className="wac-card flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-500/[0.10] border border-teal-400/15 shrink-0">
                      <MapPin size={14} className="text-teal-400/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-white/65 truncate">
                        Showing events near{locationLabel ? ` ${locationLabel}` : " you"}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">Location access granted</p>
                    </div>
                    <button
                      onClick={() => { setLocationState("idle"); setLocationLabel(null); }}
                      className="shrink-0 text-white/22 hover:text-white/50 transition-colors"
                      title="Reset location"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : locationState === "denied" ? (
                  <div className="wac-card flex items-start gap-4 p-5">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/[0.08] border border-red-400/15 shrink-0">
                      <MapPin size={16} className="text-red-400/55" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white/55">Location access denied</p>
                      <p className="text-[11px] text-white/32 mt-1 leading-relaxed max-w-sm">
                        To enable location, allow access in your browser settings and reload the page.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="wac-card flex items-start gap-4 p-5">
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/[0.10] border border-teal-400/15 shrink-0">
                      {locationState === "requesting" ? (
                        <Loader2 size={16} className="text-teal-400/65 animate-spin" />
                      ) : (
                        <MapPin size={16} className="text-teal-400/65" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white/65">Find events near you</p>
                      <p className="text-[11px] text-white/35 mt-1 leading-relaxed max-w-sm">
                        Share your location or select a region to discover events happening around you.
                      </p>
                      <button
                        onClick={requestLocation}
                        disabled={locationState === "requesting"}
                        className="mt-3 text-[11px] font-medium text-teal-400/70 hover:text-teal-400 transition-colors disabled:opacity-50 disabled:cursor-default"
                      >
                        {locationState === "requesting" ? "Requesting access…" : "Enable location →"}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Section 3: Coming Up Soon ── */}
              <section className="mt-10">
                <SectionLabel label="Coming Up Soon" variant="standard" className="mb-4" />
                <Suspense fallback={
                  <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
                    {[1,2,3].map((i) => <div key={i} className="wac-card h-28 animate-pulse" />)}
                  </div>
                }>
                  <EventsResults
                    upcoming={true}
                    limit={6}
                    categories={appliedFilters.categories}
                    formats={appliedFilters.formats}
                    datePreset={appliedFilters.date}
                    sources={appliedFilters.sources}
                    audiences={appliedFilters.lifeStages}
                    sortBy={appliedFilters.sort}
                  />
                </Suspense>
              </section>

              {/* ── Section 4: Beyond Your Network ── */}
              <section className="mt-10">
                <SectionLabel label="Beyond Your Network" variant="standard" className="mb-4" />
                <Suspense fallback={
                  <div className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
                    {[1,2,3,4,5,6].map((i) => <div key={i} className="wac-card h-28 animate-pulse" />)}
                  </div>
                }>
                  <EventsResults
                    upcoming={!!appliedFilters.date}
                    categories={appliedFilters.categories}
                    formats={appliedFilters.formats}
                    datePreset={appliedFilters.date}
                    sources={appliedFilters.sources}
                    audiences={appliedFilters.lifeStages}
                    sortBy={appliedFilters.sort}
                  />
                </Suspense>
              </section>

            </div>

          </>
        )}

      </div>

      {/* ── Filter overlay — premium discovery control panel (portalled to escape navbar stacking context) ── */}
      {showFilterSheet && createPortal(
        <div className="fixed inset-0 z-[9999] bg-[#09090b] flex flex-col" style={{ height: "100dvh" }}>

          {/* ── Header bar ── */}
          <div className="shrink-0 border-b border-white/[0.06] bg-[#09090b]">
            <div className="max-w-6xl mx-auto px-5 lg:px-8 flex items-center justify-between h-13">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/45 hover:text-white/75 transition-all -ml-1"
                >
                  <X size={17} />
                </button>
                <h2 className="text-[14px] font-semibold text-white/90 tracking-tight">Filters</h2>
              </div>
              {/* Active filter summary — inline on desktop */}
              <div className="hidden lg:flex items-center gap-1.5 flex-1 mx-6 min-w-0">
                {draftFilterSummary.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    {draftFilterSummary.slice(0, 6).map((token, i) => (
                      <span key={`${token}-${i}`}>
                        <span className="text-[11px] font-medium text-white/40">{token}</span>
                        {i < Math.min(draftFilterSummary.length, 6) - 1 && <span className="text-white/12 mx-0.5">·</span>}
                      </span>
                    ))}
                    {draftFilterSummary.length > 6 && <span className="text-[10px] text-white/25">+{draftFilterSummary.length - 6}</span>}
                  </div>
                ) : (
                  <span className="text-[11px] text-white/18">No filters applied</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilterSheet(false)}
                  className="hidden lg:flex px-4 py-1.5 rounded-full border border-white/[0.10] text-[11px] font-medium text-white/40 hover:text-white/60 hover:border-white/[0.16] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={applyFilters}
                  className="hidden lg:flex px-5 py-1.5 rounded-full bg-teal-500/[0.14] border border-teal-400/25 text-[11px] font-semibold text-teal-300/90 hover:bg-teal-500/[0.24] hover:border-teal-400/35 transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
            {/* Mobile summary */}
            <div className="lg:hidden px-5 pb-2.5">
              {draftFilterSummary.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {draftFilterSummary.slice(0, 5).map((token, i) => (
                    <span key={`${token}-${i}`}>
                      <span className="text-[11px] font-medium text-white/40">{token}</span>
                      {i < Math.min(draftFilterSummary.length, 5) - 1 && <span className="text-white/12 mx-0.5">·</span>}
                    </span>
                  ))}
                  {draftFilterSummary.length > 5 && <span className="text-[10px] text-white/25">+{draftFilterSummary.length - 5}</span>}
                </div>
              ) : (
                <span className="text-[11px] text-white/18">No filters applied</span>
              )}
            </div>
          </div>

          {/* ── Scrollable filter content ── */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
            <div className="max-w-6xl mx-auto px-5 lg:px-8 pb-28 lg:pb-8">

              {/* ── Desktop: 3-column layout ── */}
              <div className="hidden lg:grid grid-cols-3 gap-x-10 pt-4">

                {/* ── Column 1: Quick Filters + Categories ── */}
                <div>
                  {/* Quick Filters */}
                  <div className="pb-4 border-b border-white/[0.05]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-2.5">Quick Filters</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_FILTERS.map((qf) => {
                        const active = draftFilters.quick.includes(qf);
                        return (
                          <button key={qf} onClick={() => toggleQuickFilter(qf)}
                            className={`px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all ${
                              active ? "border-teal-400/30 bg-teal-500/[0.10] text-teal-300/85" : "border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/[0.16]"
                            }`}>{qf}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Categories</p>
                      {draftFilters.categories.length > 0 && (
                        <span className="text-[9px] text-teal-400/55 font-medium">{draftFilters.categories.length}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTER_CATEGORIES.map((cat) => {
                        const active = draftFilters.categories.includes(cat);
                        return (
                          <button key={cat} onClick={() => setDraftFilters((f) => ({ ...f, categories: toggleArr(f.categories, cat) }))}
                            className={`px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all ${
                              active ? "border-teal-400/30 bg-teal-500/[0.10] text-teal-300/85" : "border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/[0.16]"
                            }`}>{cat}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Column 2: Date + Format + Life Stage ── */}
                <div>
                  {/* Date */}
                  <div className="pb-4 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Date</p>
                      {draftFilters.date && (
                        <span className="text-[9px] text-teal-400/55 font-medium">{draftFilters.date}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTER_DATES.map((d) => {
                        const active = draftFilters.date === d;
                        return (
                          <button key={d} onClick={() => setDraftFilters((f) => ({ ...f, date: f.date === d ? null : d }))}
                            className={`px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all ${
                              active ? "border-teal-400/30 bg-teal-500/[0.10] text-teal-300/85" : "border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/[0.16]"
                            }`}>{d}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format */}
                  <div className="py-4 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Format</p>
                      {draftFilters.formats.length > 0 && (
                        <span className="text-[9px] text-teal-400/55 font-medium">{draftFilters.formats.join(", ")}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTER_FORMATS.map((fmt) => {
                        const active = draftFilters.formats.includes(fmt);
                        return (
                          <button key={fmt} onClick={() => setDraftFilters((f) => ({ ...f, formats: toggleArr(f.formats, fmt) }))}
                            className={`px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all ${
                              active ? "border-teal-400/30 bg-teal-500/[0.10] text-teal-300/85" : "border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/[0.16]"
                            }`}>{fmt}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Browse by Path */}
                  <div className="py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Browse by Path</p>
                      {draftFilters.paths.length > 0 && (
                        <span className="text-[9px] text-teal-400/55 font-medium">{draftFilters.paths.join(", ")}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTER_PATHS.map((pathItem) => {
                        const active = draftFilters.paths.includes(pathItem.id);
                        return (
                          <button key={pathItem.id} onClick={() => setDraftFilters((f) => ({ ...f, paths: toggleArr(f.paths, pathItem.id) }))}
                            className={`flex items-center gap-1.5 px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all ${
                              active ? "border-teal-400/30 bg-teal-500/[0.10] text-teal-300/85" : "border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/[0.16]"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pathItem.dot} ${active ? "" : "opacity-80"}`} />
                              {pathItem.id}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Column 3: Source + Sort ── */}
                <div>
                  {/* Source */}
                  <div className="pb-4 border-b border-white/[0.05]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 mb-3">Sources</p>
                    <div className="space-y-0.5">
                      {EVENT_SOURCES.map(({ id, label, description, dot, hierarchical }) => {
                        const isActive = draftFilters.sources.includes(id);
                        return (
                          <div key={id} className="flex items-center gap-2 px-1.5 py-2 rounded-lg hover:bg-white/[0.025] transition-colors">
                            <button
                              onClick={() => setDraftFilters((f) => ({ ...f, sources: toggleArr(f.sources, id) }))}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${dot} transition-opacity ${isActive ? "opacity-90" : "opacity-20"}`} />
                              <div className="flex-1 min-w-0">
                                <span className={`text-[11px] font-medium block transition-colors ${isActive ? "text-white/75" : "text-white/30"}`}>{label}</span>
                                <span className="text-[9px] text-white/20 leading-tight block mt-0.5 truncate">{description}</span>
                              </div>
                              {hierarchical && <ChevronRight size={10} className="text-white/15 shrink-0" />}
                            </button>
                            <button onClick={() => setDraftFilters((f) => ({ ...f, sources: toggleArr(f.sources, id) }))}>
                              <div className={`relative w-[38px] h-[22px] rounded-full transition-colors duration-200 ${isActive ? "bg-teal-500" : "bg-white/[0.10]"}`}>
                                <span className={`absolute top-1/2 left-[3px] w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${isActive ? "-translate-y-1/2 translate-x-[16px] bg-white" : "-translate-y-1/2 translate-x-0 bg-white/50"}`} />
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="py-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">Sort</p>
                      <span className="text-[9px] text-white/20 font-medium">{draftFilters.sort}</span>
                    </div>
                    <div className="space-y-px">
                      {FILTER_SORTS.map((s) => {
                        const active = draftFilters.sort === s;
                        return (
                          <button key={s} onClick={() => setDraftFilters((f) => ({ ...f, sort: s }))}
                            className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all ${
                              active ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                            }`}>
                            <span className={`w-[15px] h-[15px] rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              active ? "border-[#b08d57]/50 bg-[#b08d57]/15" : "border-white/[0.12] bg-white/[0.03]"
                            }`}>{active && <span className="w-1.5 h-1.5 rounded-full bg-[#b08d57]" />}</span>
                            <span className={`text-[11px] font-medium transition-colors ${active ? "text-white/65" : "text-white/35"}`}>{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* ── Mobile: single-column layout ── */}
              {/* Typography system:
                  T2 header  = text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48  (section labels — understated)
                  T3 label   = text-[13px] font-medium text-white/65  (interactive choices — chips, row titles, sort options)
                  T4 support = text-[11px] text-white/28  (descriptions, helper copy — clearly secondary)        */}
              <div className="lg:hidden">

                {/* ① Quick Filters */}
                <div className="py-4 border-b border-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48 mb-3">Quick Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_FILTERS.map((qf) => {
                      const active = draftFilters.quick.includes(qf);
                      return (
                        <button key={qf} onClick={() => toggleQuickFilter(qf)}
                          className={`px-4 py-[7px] rounded-full border text-[13px] font-medium transition-all ${
                            active
                              ? "border-teal-400/40 bg-teal-500/[0.13] text-teal-300/90"
                              : "border-white/[0.16] text-white/65 hover:text-white/82 hover:border-white/[0.26]"
                          }`}>{qf}</button>
                      );
                    })}
                  </div>
                </div>

                {/* ② Categories */}
                <div className="py-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Categories</p>
                    {draftFilters.categories.length > 0 && (
                      <span className="text-[10px] text-teal-400/60 font-semibold">{draftFilters.categories.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_CATEGORIES.map((cat) => {
                      const active = draftFilters.categories.includes(cat);
                      return (
                        <button key={cat} onClick={() => setDraftFilters((f) => ({ ...f, categories: toggleArr(f.categories, cat) }))}
                          className={`px-4 py-[7px] rounded-full border text-[13px] font-medium transition-all ${
                            active
                              ? "border-teal-400/40 bg-teal-500/[0.13] text-teal-300/90"
                              : "border-white/[0.16] text-white/65 hover:text-white/82 hover:border-white/[0.26]"
                          }`}>{cat}</button>
                      );
                    })}
                  </div>
                </div>

                {/* ③ Date */}
                <div className="py-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Date</p>
                    {draftFilters.date && (
                      <span className="text-[10px] text-teal-400/60 font-medium">{draftFilters.date}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_DATES.map((d) => {
                      const active = draftFilters.date === d;
                      return (
                        <button key={d} onClick={() => setDraftFilters((f) => ({ ...f, date: f.date === d ? null : d }))}
                          className={`px-4 py-[7px] rounded-full border text-[13px] font-medium transition-all ${
                            active
                              ? "border-teal-400/40 bg-teal-500/[0.13] text-teal-300/90"
                              : "border-white/[0.16] text-white/65 hover:text-white/82 hover:border-white/[0.26]"
                          }`}>{d}</button>
                      );
                    })}
                  </div>
                </div>

                {/* ④ Format */}
                <div className="py-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Format</p>
                    {draftFilters.formats.length > 0 && (
                      <span className="text-[10px] text-teal-400/60 font-medium">{draftFilters.formats.join(", ")}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_FORMATS.map((fmt) => {
                      const active = draftFilters.formats.includes(fmt);
                      return (
                        <button key={fmt} onClick={() => setDraftFilters((f) => ({ ...f, formats: toggleArr(f.formats, fmt) }))}
                          className={`px-4 py-[7px] rounded-full border text-[13px] font-medium transition-all ${
                            active
                              ? "border-teal-400/40 bg-teal-500/[0.13] text-teal-300/90"
                              : "border-white/[0.16] text-white/65 hover:text-white/82 hover:border-white/[0.26]"
                          }`}>{fmt}</button>
                      );
                    })}
                  </div>
                </div>

                {/* ⑤ Sources */}
                <div className="border-b border-white/[0.06]">
                  <div className="pt-4 pb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Sources</p>
                    <p className="text-[11px] text-white/28 mt-1">Where the event is coming from.</p>
                  </div>
                  <div className="pb-2">
                    {EVENT_SOURCES.map(({ id, label, description, dot, hierarchical }) => {
                      const isHier = hierarchical;
                      const hierKey = id as HierarchicalSourceId;
                      const isActive = isHier
                        ? draftFilters[hierKey].mode !== "off"
                        : draftFilters.sources.includes(id);
                      const stateLabel = isHier
                        ? hierSourceStateLabel(draftFilters[hierKey], hierKey)
                        : null;
                      return (
                        <div key={id} className="flex items-center py-3 hover:bg-white/[0.02] rounded-xl transition-colors -mx-1 px-1">
                          <button
                            onClick={() => isHier
                              ? openDrillDown(hierKey)
                              : setDraftFilters((f) => ({ ...f, sources: toggleArr(f.sources, id) }))}
                            className="flex items-center flex-1 min-w-0 text-left gap-4"
                          >
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot} transition-opacity ${isActive ? "opacity-90" : "opacity-25"}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[13px] font-medium block transition-colors ${isActive ? "text-white/80" : "text-white/65"}`}>
                                {label}
                                {stateLabel && (
                                  <span className="text-[11px] text-teal-400/70 font-medium ml-2">{stateLabel}</span>
                                )}
                              </span>
                              <span className="text-[11px] text-white/28 leading-tight block mt-0.5">{description}</span>
                            </div>
                            {isHier && <ChevronRight size={13} className="text-white/22 shrink-0" />}
                          </button>
                          <button
                            onClick={() => isHier
                              ? toggleHierarchicalSource(hierKey)
                              : setDraftFilters((f) => ({ ...f, sources: toggleArr(f.sources, id) }))}
                            className="shrink-0 ml-3"
                          >
                            <div className={`relative w-[44px] h-[26px] rounded-full transition-colors duration-200 ${isActive ? "bg-teal-500" : "bg-white/[0.10]"}`}>
                              <span className={`absolute top-1/2 left-[3px] w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${isActive ? "-translate-y-1/2 translate-x-[18px] bg-white" : "-translate-y-1/2 translate-x-0 bg-white/45"}`} />
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ⑥ Browse by Path */}
                <div className="py-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Browse by Path</p>
                    {draftFilters.paths.length > 0 && (
                      <span className="text-[10px] text-teal-400/60 font-medium">{draftFilters.paths.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FILTER_PATHS.map((pathItem) => {
                      const active = draftFilters.paths.includes(pathItem.id);
                      return (
                        <button key={pathItem.id} onClick={() => setDraftFilters((f) => ({ ...f, paths: toggleArr(f.paths, pathItem.id) }))}
                          className={`flex items-center gap-2 px-4 py-[7px] rounded-full border text-[13px] font-medium transition-all ${
                            active
                              ? "border-teal-400/40 bg-teal-500/[0.13] text-teal-300/90"
                              : "border-white/[0.16] text-white/65 hover:text-white/82 hover:border-white/[0.26]"
                          }`}>
                            <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${pathItem.dot} ${active ? "" : "opacity-80"}`} />
                            {pathItem.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ⑦ Sort */}
                <div className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-white/48">Sort</p>
                    <span className="text-[10px] text-white/30 font-medium">{draftFilters.sort}</span>
                  </div>
                  <div className="space-y-0.5">
                    {FILTER_SORTS.map((s) => {
                      const active = draftFilters.sort === s;
                      return (
                        <button key={s} onClick={() => setDraftFilters((f) => ({ ...f, sort: s }))}
                          className={`flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                            active ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                          }`}>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            active ? "border-[#b08d57]/50 bg-[#b08d57]/15" : "border-white/[0.14] bg-transparent"
                          }`}>{active && <span className="w-1.5 h-1.5 rounded-full bg-[#b08d57]" />}</span>
                          <span className={`text-[13px] font-medium transition-colors ${active ? "text-white/80" : "text-white/65"}`}>{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ── Mobile sticky bottom action bar ── */}
          <div className="lg:hidden shrink-0 border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-md px-5 pt-3 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center gap-3">
              <button
                onClick={resetDraftFilters}
                className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.10] text-[12px] font-medium text-white/40 hover:text-white/60 transition-all text-center"
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] px-4 py-2.5 rounded-full bg-teal-500/[0.14] border border-teal-400/25 text-[12px] font-semibold text-teal-300/90 hover:bg-teal-500/[0.24] transition-all text-center"
              >
                {draftFilterCount > 0 ? `Apply · ${draftFilterCount}` : "Apply"}
              </button>
            </div>
          </div>

          {/* ── Source drill-down sub-screen ── */}
          {filterDrillDown && (() => {
            const entities = MOCK_FOLLOWED[filterDrillDown];
            const filtered = drillSearch.trim()
              ? entities.filter((e) => e.name.toLowerCase().includes(drillSearch.toLowerCase()))
              : entities;
            const allSelected = entities.length > 0 && entities.every((e) => drillDraftSelected.includes(e.id));
            return (
              <div className="absolute inset-0 bg-[#09090b] flex flex-col z-10">
                {/* Header — back + title only, no action in top-right */}
                <div className="shrink-0 flex items-center gap-3 px-4 h-[56px] border-b border-white/[0.06]">
                  <button
                    onClick={() => { setFilterDrillDown(null); setDrillSearch(""); }}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="text-[15px] font-semibold text-white/90 tracking-tight capitalize flex-1">{filterDrillDown}</h3>
                </div>

                {entities.length === 0 ? (
                  /* Empty state */
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-xs">
                      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
                        <Users size={20} className="text-white/20" />
                      </div>
                      <p className="text-[13px] font-medium text-white/45">No {filterDrillDown} followed yet.</p>
                      <p className="text-[11px] text-white/25 mt-2 leading-relaxed">
                        Follow {filterDrillDown} across WAC to select specific ones here.
                      </p>
                      <button className="mt-5 px-4 py-2 rounded-full border border-white/[0.12] text-[12px] font-medium text-white/55 hover:text-white/75 hover:border-white/[0.20] transition-all">
                        Find {filterDrillDown}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="shrink-0 px-4 pt-3 pb-2">
                      <div className="flex items-center gap-2.5 bg-white/[0.05] rounded-xl px-3 py-2.5">
                        <Search size={14} className="text-white/30 shrink-0" />
                        <input
                          value={drillSearch}
                          onChange={(e) => setDrillSearch(e.target.value)}
                          placeholder={`Search ${filterDrillDown}…`}
                          className="flex-1 bg-transparent text-[13px] text-white/75 placeholder:text-white/25 outline-none"
                        />
                        {drillSearch && (
                          <button onClick={() => setDrillSearch("")} className="text-white/30 hover:text-white/60 transition-colors">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Helper row — selection status + Select all */}
                    <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
                      <span className="text-[11px] text-white/30 font-medium">
                        {drillDraftSelected.length === 0 ? "None selected" : `${drillDraftSelected.length} of ${entities.length} selected`}
                      </span>
                      <button
                        onClick={() => setDrillDraftSelected(entities.map((e) => e.id))}
                        className={`text-[11px] font-semibold transition-colors ${allSelected ? "text-teal-400/40" : "text-teal-400/75 hover:text-teal-400"}`}
                        disabled={allSelected}
                      >
                        Select all
                      </button>
                    </div>

                    {/* Scrollable entity list */}
                    <div className="flex-1 overflow-y-auto">
                      {filtered.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-[12px] text-white/25">No results for &ldquo;{drillSearch}&rdquo;</p>
                        </div>
                      ) : (
                        filtered.map((entity) => {
                          const isChecked = drillDraftSelected.includes(entity.id);
                          return (
                            <button
                              key={entity.id}
                              onClick={() => setDrillDraftSelected((sel) =>
                                isChecked ? sel.filter((id) => id !== entity.id) : [...sel, entity.id]
                              )}
                              className="flex items-center gap-4 w-full px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
                            >
                              <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isChecked ? "bg-teal-500 border-teal-400" : "border-white/[0.18] bg-transparent"
                              }`}>
                                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                              </span>
                              <span className={`text-[13px] font-medium flex-1 text-left transition-colors ${isChecked ? "text-white/85" : "text-white/65"}`}>
                                {entity.name}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Sticky bottom action bar — same pattern as filter sheet */}
                    <div className="shrink-0 border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-md px-5 pt-3 pb-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setDrillDraftSelected([])}
                          className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.10] text-[12px] font-medium text-white/40 hover:text-white/60 transition-all text-center"
                        >
                          Clear
                        </button>
                        <button
                          onClick={applyDrillDown}
                          className="flex-[2] px-4 py-2.5 rounded-full bg-teal-500/[0.14] border border-teal-400/25 text-[12px] font-semibold text-teal-300/90 hover:bg-teal-500/[0.24] transition-all text-center"
                        >
                          {drillDraftSelected.length > 0 ? `Apply · ${drillDraftSelected.length}` : "Apply"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        </div>,
        document.body
      )}

    </div>
  );
}
