"use client";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Lens        = "my-network" | "browse" | "calendar";
type CalViewMode = "month" | "week" | "agenda";
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

// Relationship priority: personal > rsvp > group > org > business > people > browse
// "browse"  = public/network-visible event the user does not own and hasn't RSVP'd
// "personal" must only be set when created_by === current user's id
type CalRelationship = "personal" | "rsvp" | "group" | "org" | "business" | "people" | "browse";

const REL_COLORS: Record<CalRelationship, {
  bg: string; text: string; border: string; dot: string; rule: string; hover: string;
}> = {
  personal: { bg: "bg-rose-500/[0.16]",    text: "text-rose-300",    border: "border-rose-400/[0.22]",    dot: "bg-rose-400",    rule: "bg-rose-500/30",    hover: "hover:bg-rose-500/[0.26]"    },
  rsvp:     { bg: "bg-teal-500/[0.16]",    text: "text-teal-300",    border: "border-teal-400/[0.22]",    dot: "bg-teal-400",    rule: "bg-teal-500/30",    hover: "hover:bg-teal-500/[0.26]"    },
  group:    { bg: "bg-amber-500/[0.16]",   text: "text-amber-300",   border: "border-amber-400/[0.22]",   dot: "bg-amber-400",   rule: "bg-amber-500/30",   hover: "hover:bg-amber-500/[0.26]"   },
  org:      { bg: "bg-emerald-500/[0.16]", text: "text-emerald-300", border: "border-emerald-400/[0.22]", dot: "bg-emerald-400", rule: "bg-emerald-500/30", hover: "hover:bg-emerald-500/[0.26]" },
  business: { bg: "bg-blue-500/[0.16]",    text: "text-blue-300",    border: "border-blue-400/[0.22]",    dot: "bg-blue-400",    rule: "bg-blue-500/30",    hover: "hover:bg-blue-500/[0.26]"    },
  people:   { bg: "bg-[#b08d57]/[0.16]",   text: "text-[#b08d57]",   border: "border-[#b08d57]/[0.22]",   dot: "bg-[#b08d57]",   rule: "bg-[#b08d57]/30",   hover: "hover:bg-[#b08d57]/[0.26]"   },
  browse:   { bg: "bg-white/[0.05]",        text: "text-white/45",    border: "border-white/[0.10]",        dot: "bg-white/30",    rule: "bg-white/[0.12]",   hover: "hover:bg-white/[0.09]"        },
};

const REL_LABELS: Record<CalRelationship, string> = {
  personal: "Private Items",
  rsvp:     "My RSVP",
  group:    "My Group",
  org:      "Followed Org",
  business: "Followed Business",
  people:   "Followed Person",
  browse:   "Public Event",
};

// Default to "browse" (neutral) — never assume personal without explicit classification
function eventColors(source?: CalRelationship) {
  return REL_COLORS[source ?? "browse"];
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
  attending_count?: number;
  current_user_rsvp_status?: "going" | "interested" | "not_going" | null;
  current_user_approval_status?: "approved" | "pending" | "declined" | "waitlisted" | null;
  source?:     CalRelationship; // classified after fetch — never defaults to personal
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

const EVENT_TYPES = [
  "All", "Networking", "Professional", "Family", "Youth",
  "Business", "Social", "Volunteer", "Education",
];

const LENSES: { id: Lens; label: string; icon: React.ElementType }[] = [
  { id: "my-network", label: "My Network", icon: Network      },
  { id: "browse",     label: "Browse",     icon: LayoutGrid   },
  { id: "calendar",   label: "Calendar",   icon: CalendarDays },
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

const CAL_SOURCES = [
  { id: "personal",   label: "Private Items",          dot: "bg-rose-400",    disabled: false },
  { id: "rsvps",      label: "My RSVPs",               dot: "bg-teal-400",    disabled: false },
  { id: "groups",     label: "My Groups",              dot: "bg-amber-400",   disabled: false },
  { id: "orgs",       label: "Followed Orgs",          dot: "bg-emerald-400", disabled: false },
  { id: "businesses", label: "Followed Businesses",    dot: "bg-blue-400",    disabled: false },
  { id: "people",     label: "Followed People",        dot: "bg-[#b08d57]",   disabled: false },
  { id: "imported",   label: "Imported Calendars",     dot: "bg-white/25",    disabled: true  },
];

const CAL_VIEW_TABS: { id: CalViewMode; label: string; icon: React.ElementType }[] = [
  { id: "month",  label: "Month",  icon: LayoutGrid   },
  { id: "week",   label: "Week",   icon: CalendarRange },
  { id: "agenda", label: "Agenda", icon: AlignJustify  },
];

function sourceLabelForChip(id: string, fallback: string): string {
  if (id === "orgs") return "Orgs";
  if (id === "businesses") return "Businesses";
  if (id === "people") return "People";
  if (id === "personal") return "Private";
  if (id === "rsvps") return "RSVPs";
  if (id === "groups") return "Groups";
  return fallback;
}

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
      className={`relative w-9 h-[18px] rounded-full transition-colors shrink-0 ${
        checked
          ? color === "rose" ? "bg-rose-500/40" : "bg-teal-500/40"
          : "bg-white/[0.1]"
      }`}
    >
      <span
        className={`absolute top-[3px] w-3 h-3 rounded-full bg-white/75 shadow-sm transition-transform ${
          checked ? "translate-x-[21px]" : "translate-x-[3px]"
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
      <div className="relative z-10 w-full sm:max-w-md bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[84vh]">

        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-3 sm:px-5 sm:pt-4 shrink-0">
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full">
            {(["event", "task"] as const).map((t) => (
              <button key={t} onClick={() => set({ type: t })}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  draft.type === t ? "bg-teal-500/[0.14] text-teal-400" : "text-white/38 hover:text-white/65"
                }`}>
                {t}
              </button>
            ))}
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
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-4 sm:px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

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

      <div className="relative z-10 w-full sm:max-w-xl bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[88vh]">

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
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* ────────────── BASICS ────────────── */}
          {activeTab === "basics" && (
            <div className="px-4 py-4 space-y-4 sm:px-5">
              {/* Event / Task */}
              <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full w-fit">
                {(["event", "task"] as const).map((t) => (
                  <button key={t} onClick={() => set({ type: t })}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                      draft.type === t ? "bg-teal-500/[0.14] text-teal-400" : "text-white/38 hover:text-white/65"
                    }`}>
                    {t}
                  </button>
                ))}
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
  const relLabel   = REL_LABELS[event.source ?? "browse"];

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

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-[#0f0f0f] border border-white/[0.10] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white/85">Import Calendar</h2>
            <p className="text-[11px] text-white/35 mt-0.5">Add a Google Calendar or ICS feed</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.05] text-white/35 hover:text-white/65 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-2">Calendar Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. My Google Calendar, Work, Family"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/22 outline-none focus:border-teal-400/30 transition-colors"
            />
          </div>

          {/* ICS URL */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-2">ICS Feed URL</label>
            <div className="relative">
              <Link2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                type="url"
                value={icsUrl}
                onChange={(e) => { setIcsUrl(e.target.value); setError(""); }}
                placeholder="https://calendar.google.com/…/basic.ics"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/22 outline-none focus:border-teal-400/30 transition-colors"
              />
            </div>
            <div className="mt-2.5 p-3 rounded-xl bg-white/[0.025] border border-white/[0.05]">
              <p className="text-[10px] text-white/35 leading-relaxed">
                <span className="text-white/50 font-medium">How to get your Google Calendar ICS URL:</span><br />
                In Google Calendar → Settings → your calendar → "Secret address in iCal format"
              </p>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 mb-2.5">Calendar Color</label>
            <div className="flex gap-2.5">
              {IMPORT_COLORS.map(({ dot, label }) => (
                <button
                  key={dot}
                  onClick={() => setColorDot(dot)}
                  title={label}
                  className={`w-7 h-7 rounded-full transition-all ${dot} ${colorDot === dot ? "ring-2 ring-white/50 ring-offset-2 ring-offset-[#0f0f0f] scale-110" : "opacity-55 hover:opacity-80"}`}
                />
              ))}
            </div>
          </div>

          {/* Note: read-only */}
          <p className="text-[10px] text-white/28 leading-relaxed">
            Imported calendars are <span className="text-white/42">read-only</span> — events will appear in your WAC calendar but are managed in the original app.
          </p>

          {error && <p className="text-[11px] text-red-400/80">{error}</p>}
        </div>

        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-white/[0.05]">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-full bg-teal-500/[0.14] border border-teal-400/20 text-teal-400/90 text-sm font-semibold hover:bg-teal-500/[0.22] transition-colors">
            Import Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CalendarModeView ──────────────────────────────────────────────────────────

function CalendarModeView() {
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
    if (v === "week" && calView !== "week") {
      setNavDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    } else if (v !== "week" && calView === "week") {
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth(), 1));
    }
    setCalView(v);
    setSelectedDay(null);
    setSelDayIdx(null); setSelStartH(null); setSelEndH(null);
  }

  function prevPeriod() {
    if (calView === "week") {
      setNavDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
    } else {
      setNavDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  }
  function nextPeriod() {
    if (calView === "week") {
      setNavDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
    } else {
      setNavDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }

  const [activeSources, setActiveSources] = useState<Set<string>>(
    new Set(CAL_SOURCES.filter((source) => !source.disabled).map((source) => source.id))
  );
  function toggleSource(id: string) {
    setActiveSources((prev) => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
  }

  const [showSourceSheet,  setShowSourceSheet]  = useState(false);
  const [showImportModal,  setShowImportModal]  = useState(false);
  const [importedCals,     setImportedCals]     = useState<ImportedCal[]>(() => loadImportedCals());

  function addImportedCal(cal: ImportedCal) {
    const next = [...importedCals, cal];
    setImportedCals(next);
    saveImportedCals(next);
    setActiveSources((prev) => { const s = new Set(prev); s.add(cal.id); return s; });
    setShowImportModal(false);
  }

  function removeImportedCal(id: string) {
    const next = importedCals.filter((c) => c.id !== id);
    setImportedCals(next);
    saveImportedCals(next);
    setActiveSources((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  const availableSourceIds = useMemo(
    () => [
      ...CAL_SOURCES.filter((source) => source.id !== "imported" && !source.disabled).map((source) => source.id),
      ...importedCals.map((calendar) => calendar.id),
    ],
    [importedCals]
  );
  const activeSourceCount = availableSourceIds.filter((id) => activeSources.has(id)).length;
  const allSourcesActive = availableSourceIds.length > 0 && activeSourceCount === availableSourceIds.length;
  const anySourcesActive = activeSourceCount > 0;

  function showAllSources() {
    setActiveSources(new Set(availableSourceIds));
  }

  function hideAllSources() {
    setActiveSources(new Set());
  }

  // Navbar `+` in Calendar mode → open Quick Create
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selDayIdx,   setSelDayIdx]   = useState<number | null>(null);
  const [selStartH,   setSelStartH]   = useState<number | null>(null);
  const [selEndH,     setSelEndH]     = useState<number | null>(null);
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
      if (calView === "week") {
        const dow = navDate.getDay();
        start = new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - dow, 0, 0, 0);
        end   = new Date(navDate.getFullYear(), navDate.getMonth(), navDate.getDate() - dow + 6, 23, 59, 59);
      } else if (calView === "agenda") {
        // Agenda follows the same month context as the nav header — not a fixed rolling window
        start = new Date(navDate.getFullYear(), navDate.getMonth(), 1);
        end   = new Date(navDate.getFullYear(), navDate.getMonth() + 1, 0, 23, 59, 59);
      } else {
        start = new Date(navDate.getFullYear(), navDate.getMonth(), 1);
        end   = new Date(navDate.getFullYear(), navDate.getMonth() + 1, 0, 23, 59, 59);
      }
      console.log("[CalFetch] view:", calView, "range:", start.toISOString(), "→", end.toISOString());
      setEventsLoading(true);
      const [{ data, error }, { data: { user: authUser } }] = await Promise.all([
        supabase
          .from("events")
          .select("id, title, start_time, end_time, location, description, created_by, access_mode, capacity, requires_approval")
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
          return {
            ...ev,
            attending_count: attendeeCountByEvent.get(ev.id) ?? 0,
            current_user_rsvp_status: currentUserRsvp?.status ?? null,
            current_user_approval_status: currentUserRsvp?.approval_status ?? null,
            source: (uid && ev.created_by === uid)
              ? "personal"
              : currentUserRsvp && currentUserRsvp.status !== "not_going"
              ? "rsvp"
              : "browse",
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
      const res = await supabase.from("events").update(payload).eq("id", editingEventId);
      dbError = res.error;
    } else {
      const res = await supabase.from("events").insert(payload);
      dbError = res.error;
    }
    if (dbError) throw new Error(dbError.message);
    console.log("[EventSave] success");
    setEditingEventId(null);
    setCalRefreshKey((k) => k + 1);
  }

  const [agendaDay, setAgendaDay] = useState<number | null>(null);

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setAgendaDay((prev) => (prev === day ? null : day));
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
      setModalDraft(makeDraft(date, st, et));
      setShowFullEditor(false);
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

  // Filter events by active calendar sources so toggles actually hide events
  const filteredCalEvents = useMemo(
    () => calEvents.filter((ev) => activeSources.has(ev.source)),
    [calEvents, activeSources]
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
    calView === "week"
      ? weekStart.getMonth() === weekEnd.getMonth()
        ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekStart.getFullYear()}`
        : `${MONTH_NAMES[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()].slice(0,3)} ${weekEnd.getDate()}`
      : `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`;

  const quickSourceControls = [
    ...CAL_SOURCES.filter((source) => source.id !== "imported" && !source.disabled),
    ...importedCals.map((calendar) => ({
      id: calendar.id,
      label: calendar.name,
      dot: calendar.colorDot,
      disabled: false,
    })),
  ];
  const visibleMonthLineCount = isCompactCalendar ? 5 : 7;

  const selLo = selStartH !== null && selEndH !== null ? Math.min(selStartH, selEndH) : null;
  const selHi = selStartH !== null && selEndH !== null ? Math.max(selStartH, selEndH) : null;

  function isSlotSelected(dayIdx: number, hour: number) {
    if (selDayIdx !== dayIdx || selLo === null || selHi === null) return false;
    return hour >= selLo && hour <= selHi;
  }

  return (
    <div className="mt-2 md:mt-4 flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-240px)]">

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="sticky top-[64px] sm:top-[72px] z-20 mb-3 space-y-3 rounded-2xl border border-white/[0.06] bg-[var(--background)]/92 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.09] text-white/40 hover:text-white/75 hover:border-white/[0.18] transition-colors shrink-0">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[15px] font-semibold text-white/85 min-w-0 sm:min-w-[170px] text-center tracking-tight truncate">{periodLabel}</span>
                <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.09] text-white/40 hover:text-white/75 hover:border-white/[0.18] transition-colors shrink-0">
                  <ChevronRight size={15} />
                </button>
              </div>
              {eventsLoading && <Loader2 size={12} className="animate-spin text-[var(--accent)] shrink-0 xl:hidden" />}
            </div>

            <div className="flex items-center gap-2">
              {eventsLoading && <Loader2 size={12} className="animate-spin text-[var(--accent)] shrink-0 hidden xl:block" />}
              {/* Mobile source filter — sidebar is hidden on mobile */}
              <button
                onClick={() => setShowSourceSheet(true)}
                className={`lg:hidden relative w-9 h-9 flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
                  activeSourceCount < availableSourceIds.length
                    ? "bg-teal-500/[0.12] border-teal-400/20 text-teal-400/80"
                    : "border-white/[0.09] text-white/35 hover:text-white/65 hover:border-white/18"
                }`}>
                <SlidersHorizontal size={13} />
                <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full border border-[var(--background)] bg-white/[0.14] px-1 py-[1px] text-[8px] font-semibold leading-none text-white/70">
                  {activeSourceCount}
                </span>
              </button>
              <div className="grid flex-1 grid-cols-3 gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1 min-w-0">
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
            </div>
          </div>

          <div className="space-y-2">
            <div className="hidden sm:flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/28">
                {activeSourceCount}/{availableSourceIds.length} calendars visible
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={showAllSources}
                  disabled={allSourcesActive}
                  className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/42 transition-colors hover:text-white/68 hover:border-white/[0.14] disabled:cursor-default disabled:opacity-35"
                >
                  All
                </button>
                <button
                  onClick={hideAllSources}
                  disabled={!anySourcesActive}
                  className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/42 transition-colors hover:text-white/68 hover:border-white/[0.14] disabled:cursor-default disabled:opacity-35"
                >
                  None
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickSourceControls.map(({ id, label, dot }) => {
                const active = activeSources.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleSource(id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      active
                        ? "border-white/[0.14] bg-white/[0.08] text-white/75"
                        : "border-white/[0.08] bg-transparent text-white/32 hover:text-white/55 hover:border-white/[0.14]"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${dot} ${active ? "opacity-80" : "opacity-35"}`} />
                    <span className="truncate max-w-[88px] sm:max-w-[110px]">{sourceLabelForChip(id, label)}</span>
                  </button>
                );
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
                  return (
                    <div key={i} onClick={() => day !== null && handleDayClick(day)}
                      className={`relative min-h-[104px] sm:min-h-[128px] p-1 sm:p-1.5 border-b border-r border-white/[0.04] transition-colors ${lastInRow ? "border-r-0" : ""} ${
                        day === null ? "bg-white/[0.01]"
                        : isSelected ? "bg-white/[0.04] cursor-pointer"
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
                            : isSelected ? "bg-white/10 text-white/80 font-semibold"
                            : "text-white/35 font-medium"
                          }`}>
                            {day}
                          </span>
                          {/* Compact density lines — fits more events per day without crowding the cell */}
                          <div className="mt-1.5 space-y-1">
                            {dayEvs.slice(0, visibleMonthLineCount).map((ev) => {
                              const c = eventColors(ev.source);
                              const badge = getEventMetaBadge(ev);
                              return (
                                <button
                                  key={ev.id}
                                  title={ev.title}
                                  onClick={(e) => { e.stopPropagation(); openEventDetail(ev); }}
                                  className="w-full text-left transition-opacity hover:opacity-100 opacity-90"
                                >
                                  <div className="flex items-center gap-1">
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
                            {dayEvs.length > visibleMonthLineCount && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}
                                className="w-full text-left px-1 py-[1px] text-[8px] text-white/35 hover:text-white/60 leading-none transition-colors font-medium">
                                +{dayEvs.length - visibleMonthLineCount} more
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
              <p className="text-xs text-white/28">Click a day to see its agenda. Click + drag in week view to create an event.</p>
            </div>

            {/* Day Agenda Sheet — slides up when a day is tapped */}
            {agendaDay !== null && (() => {
              const dateKey = `${navDate.getFullYear()}-${String(navDate.getMonth() + 1).padStart(2, "0")}-${String(agendaDay).padStart(2, "0")}`;
              const dayEvs  = filteredCalEvents.filter((ev) => localDateKey(ev.start_time) === dateKey);
              const date    = new Date(navDate.getFullYear(), navDate.getMonth(), agendaDay);
              const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
              return (
                <div className="mt-3 rounded-2xl border border-white/[0.09] bg-[#111]/90 backdrop-blur-xl p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{dateLabel}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const d = new Date(navDate.getFullYear(), navDate.getMonth(), agendaDay);
                          setModalDraft(makeDraft(d));
                          setShowFullEditor(false);
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
                  {dayEvs.length === 0 ? (
                    <p className="py-4 text-center text-[12px] text-white/28">No events on this day.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto [scrollbar-width:none]">
                      {dayEvs.map((ev) => {
                        const c = eventColors(ev.source);
                        const timeLabel = new Date(ev.start_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        return (
                          <button key={ev.id}
                            onClick={() => { openEventDetail(ev); setAgendaDay(null); setSelectedDay(null); }}
                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5 text-left transition-colors hover:border-white/[0.12]"
                          >
                            <div className={`h-8 w-1 shrink-0 rounded-full ${c.rule}`} />
                            <div className="min-w-0">
                              <p className={`truncate text-[13px] font-medium leading-snug ${c.text}`}>{ev.title}</p>
                              <p className="text-[10px] text-white/35">{timeLabel}{ev.location ? ` · ${ev.location}` : ""}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mobile: compact event summary strip */}
            <MobileEventStrip
              label={MONTH_NAMES[navDate.getMonth()]}
              events={filteredCalEvents}
              loading={eventsLoading}
              onOpen={openEventDetail}
            />
          </>
        )}

        {/* Week */}
        {calView === "week" && (
          <>
            <div className="wac-card p-0 overflow-hidden select-none"
              onMouseUp={handleGridMouseUp} onMouseLeave={handleGridMouseUp}>
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="min-w-[720px]">
                  <div className="grid border-b border-white/[0.05]" style={{ gridTemplateColumns: "3.5rem repeat(7, minmax(5.75rem, 1fr))" }}>
                    <div className="sticky left-0 z-10 bg-[var(--background)]" />
                    {weekDays.map((d, i) => {
                      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                      const isToday = key === todayKey;
                      return (
                        <div key={i} className="py-2 text-center">
                          <div className="text-[9px] font-semibold tracking-wider text-white/25 uppercase">{DAY_ABBREVS[d.getDay()]}</div>
                          <div className={`text-sm font-semibold mt-0.5 ${isToday ? "text-teal-400" : "text-white/45"}`}>{d.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="overflow-y-auto max-h-[470px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {WEEK_HOURS.map((hour) => (
                      <div key={hour} className="grid border-b border-white/[0.03] last:border-0" style={{ gridTemplateColumns: "3.5rem repeat(7, minmax(5.75rem, 1fr))" }}>
                        <div className="sticky left-0 z-10 bg-[var(--background)] px-2 pt-1.5 text-right text-[10px] text-white/20 leading-none shrink-0">{formatHour(hour)}</div>
                        {weekDays.map((d, dayIdx) => {
                          const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          const slotEvs = (eventsMap.get(dk) ?? []).filter(
                            (ev) => new Date(ev.start_time).getHours() === hour
                          );
                          return (
                            <div key={dayIdx}
                              onMouseDown={(e) => handleSlotMouseDown(dayIdx, hour, e)}
                              onMouseEnter={() => handleSlotMouseEnter(dayIdx, hour)}
                              className={`relative h-11 border-l border-white/[0.03] cursor-pointer transition-colors overflow-hidden ${
                                isSlotSelected(dayIdx, hour) ? "bg-teal-500/[0.14]" : "hover:bg-white/[0.04]"
                              }`}
                            >
                              {slotEvs.map((ev) => {
                                const c = eventColors(ev.source);
                                const badge = getEventMetaBadge(ev);
                                return (
                                  <button key={ev.id}
                                    onClick={(e) => { e.stopPropagation(); openEventDetail(ev); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={`absolute inset-x-[2px] top-[2px] bottom-[2px] ${c.bg} border ${c.border} rounded px-1 flex items-center ${c.hover} transition-colors z-10`}>
                                    <span className={`text-[8px] font-semibold ${c.text} truncate leading-none`}>{ev.title}</span>
                                    {badge && (
                                      <span className={`ml-1 shrink-0 rounded px-1 py-[1px] text-[7px] leading-none ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 px-1 sm:hidden">
              <p className="text-[10px] text-white/22">Swipe sideways to browse the full week without squeezing each day.</p>
            </div>
            <div className="mt-2 py-2 px-3 rounded-xl border border-dashed border-white/[0.06] hidden sm:block">
              <p className="text-xs text-white/28">Click and drag on any column to select a time range and create an event.</p>
            </div>

            {/* Mobile: compact event summary strip */}
            <MobileEventStrip
              label="This Week"
              events={filteredCalEvents}
              loading={eventsLoading}
              onOpen={openEventDetail}
            />
          </>
        )}

        {/* Agenda — grouped by date, follows navDate month range */}
        {calView === "agenda" && (() => {
          if (eventsLoading) return (
            <div className="wac-card p-14 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
            </div>
          );

          // Group events by local date key, preserving chronological order
          const dayGroups = new Map<string, CalEvent[]>();
          for (const ev of filteredCalEvents) {
            const dk = localDateKey(ev.start_time);
            if (!dayGroups.has(dk)) dayGroups.set(dk, []);
            dayGroups.get(dk)!.push(ev);
          }

          if (dayGroups.size === 0) return (
            <div className="wac-card p-14 text-center">
              <AlignJustify size={20} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/35 text-sm font-medium">
                No events in {MONTH_NAMES[navDate.getMonth()]} {navDate.getFullYear()}
              </p>
              <p className="text-white/20 text-xs mt-1">
                Create an event or navigate to another month.
              </p>
            </div>
          );

          const _today = new Date();
          const p2 = (n: number) => String(n).padStart(2, "0");
          const todayKey = `${_today.getFullYear()}-${p2(_today.getMonth() + 1)}-${p2(_today.getDate())}`;

          return (
            <div className="space-y-3 sm:space-y-4">
              {[...dayGroups.entries()].map(([dk, dayEvs]) => {
                const dayDate   = new Date(dayEvs[0].start_time);
                const isToday   = dk === todayKey;
                const isPast    = dk < todayKey;
                const dayLabel  = dayDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

                return (
                  <div key={dk} className="mb-4">

                    {/* Date divider header */}
                    <div className="flex items-center gap-3 mb-2">
                      {isToday ? (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-400 px-2 py-0.5 bg-teal-500/10 border border-teal-400/20 rounded-full">
                          Today · {dayLabel}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isPast ? "text-white/22" : "text-white/35"}`}>
                          {dayLabel}
                        </span>
                      )}
                      <div className={`flex-1 h-px ${isPast ? "bg-white/[0.04]" : "bg-white/[0.07]"}`} />
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-2 pl-0">
                      {dayEvs.map((ev) => {
                        const c         = eventColors(ev.source);
                        const badge     = getEventMetaBadge(ev);
                        const evStart   = new Date(ev.start_time);
                        const evEnd     = ev.end_time ? new Date(ev.end_time) : null;
                        const timeLabel = evStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        const endLabel  = evEnd?.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                        return (
                          <button key={ev.id} onClick={() => openEventDetail(ev)}
                            className={`w-full overflow-hidden rounded-xl border border-white/[0.07] text-left transition-colors hover:border-white/[0.14] ${isPast ? "opacity-55 hover:opacity-80" : ""}`}>
                            {/* Relationship color bar */}
                            <div className={`h-[3px] w-full ${c.rule} sm:h-auto sm:w-[3px] sm:shrink-0`} />
                            <div className="flex flex-col sm:flex-row sm:items-stretch">
                              {/* Time column */}
                              <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-3 py-2 sm:w-[70px] sm:shrink-0 sm:flex-col sm:justify-center sm:border-b-0 sm:border-r sm:px-2.5">
                                <div className="flex items-center gap-2 sm:block">
                                  <span className="text-[10px] font-semibold leading-none text-white/50">{timeLabel}</span>
                                  {endLabel && <span className="text-[9px] leading-none text-white/28 sm:mt-0.5 sm:block">{endLabel}</span>}
                                </div>
                                <div className={`h-2 w-2 rounded-full ${c.dot} opacity-40 sm:hidden`} />
                              </div>
                              {/* Content */}
                              <div className="flex min-w-0 flex-1 items-start justify-between gap-2.5 px-3 py-2.5 sm:px-3.5">
                                <div className="min-w-0">
                                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                    <div className={`truncate text-[13px] font-semibold leading-snug ${c.text}`}>{ev.title}</div>
                                    {badge && (
                                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold leading-none ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    )}
                                  </div>
                                  {ev.location && (
                                    <div className="mt-0.5 flex items-center gap-1">
                                      <MapPin size={9} className="shrink-0 text-white/25" />
                                      <span className="truncate text-[10px] text-white/30">{ev.location}</span>
                                    </div>
                                  )}
                                </div>
                                {/* Source dot */}
                                <div className={`hidden h-2 w-2 rounded-full shrink-0 ${c.dot} opacity-40 sm:block`} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Sidebar — desktop only; mobile uses toolbar + button for actions */}
      <div className="hidden lg:block lg:w-52 shrink-0 space-y-3">

        {/* Source legend */}
        <div className="wac-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25">Sources</div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={showAllSources}
                disabled={allSourcesActive}
                className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/24 transition-colors hover:text-white/48 disabled:cursor-default disabled:opacity-30"
              >
                All
              </button>
              <button
                onClick={hideAllSources}
                disabled={!anySourcesActive}
                className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/24 transition-colors hover:text-white/48 disabled:cursor-default disabled:opacity-30"
              >
                None
              </button>
            </div>
          </div>
          <div className="mb-3 text-[10px] text-white/22">
            {activeSourceCount} of {availableSourceIds.length} shown
          </div>
          <div className="space-y-2.5">
            {CAL_SOURCES.filter((s) => s.id !== "imported").map(({ id, label, dot, disabled }) => {
              const active = !disabled && activeSources.has(id);
              return (
                <button key={id} onClick={() => !disabled && toggleSource(id)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-2.5 text-left ${disabled ? "cursor-default" : "group"}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${dot} ${active ? "opacity-75" : "opacity-18"}`} />
                  <span className={`text-[11px] transition-colors ${active ? "text-white/55" : "text-white/22"}`}>{label}</span>
                </button>
              );
            })}

            {/* Imported calendars section */}
            {importedCals.length > 0 && (
              <>
                <div className="border-t border-white/[0.06] pt-2.5 mt-1">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/20 mb-2">Imported</div>
                  {importedCals.map((cal) => {
                    const active = activeSources.has(cal.id);
                    return (
                      <div key={cal.id} className="flex items-center gap-2.5 group mb-2">
                        <button onClick={() => toggleSource(cal.id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                          <span className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${cal.colorDot} ${active ? "opacity-75" : "opacity-18"}`} />
                          <span className={`text-[11px] truncate transition-colors ${active ? "text-white/55" : "text-white/22"}`}>{cal.name}</span>
                        </button>
                        <button onClick={() => removeImportedCal(cal.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/70 transition-all shrink-0">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Add Calendar */}
          <button
            onClick={() => setShowImportModal(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] text-[10px] font-semibold text-white/28 hover:text-white/55 hover:border-white/14 transition-colors">
            <Plus size={10} />Add Calendar
          </button>
        </div>

        {/* This period's events — real data from calendar fetch */}
        <div className="wac-card p-4">
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/25 mb-3">
            {calView === "week" ? "This Week" : `${MONTH_NAMES[navDate.getMonth()]}`}
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

      {/* Mobile: Sources filter bottom sheet */}
      {showSourceSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowSourceSheet(false)} />
          <div className="relative z-10 w-full bg-[#0e0e0e] border-t border-white/[0.09] rounded-t-2xl shadow-2xl pb-[max(env(safe-area-inset-bottom,0px),20px)]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
            </div>
            <div className="px-5 pt-3 pb-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Calendar Sources</span>
                <button onClick={() => setShowSourceSheet(false)} className="text-white/25 hover:text-white/55 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="text-[11px] text-white/42">
                  {activeSourceCount} of {availableSourceIds.length} calendars visible
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={showAllSources}
                    disabled={allSourcesActive}
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38 transition-colors hover:text-white/62 disabled:cursor-default disabled:opacity-30"
                  >
                    All
                  </button>
                  <button
                    onClick={hideAllSources}
                    disabled={!anySourcesActive}
                    className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/38 transition-colors hover:text-white/62 disabled:cursor-default disabled:opacity-30"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {CAL_SOURCES.filter((s) => s.id !== "imported").map(({ id, label, dot, disabled }) => {
                  const active = !disabled && activeSources.has(id);
                  return (
                    <button key={id} onClick={() => !disabled && toggleSource(id)}
                      disabled={disabled}
                      className={`w-full flex items-center gap-3 text-left ${disabled ? "opacity-40 cursor-default" : ""}`}>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${dot} ${active ? "opacity-75" : "opacity-18"}`} />
                      <span className={`text-[13px] flex-1 transition-colors ${active ? "text-white/65" : "text-white/28"}`}>{label}</span>
                      <div className={`relative w-9 h-[18px] rounded-full transition-colors shrink-0 ${active ? "bg-teal-500/40" : "bg-white/[0.10]"}`}>
                        <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white/75 shadow-sm transition-transform ${active ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
                      </div>
                    </button>
                  );
                })}

                {/* Imported calendars */}
                {importedCals.length > 0 && (
                  <div className="border-t border-white/[0.07] pt-4 space-y-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">Imported Calendars</div>
                    {importedCals.map((cal) => {
                      const active = activeSources.has(cal.id);
                      return (
                        <div key={cal.id} className="flex items-center gap-3">
                          <button onClick={() => toggleSource(cal.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${cal.colorDot} ${active ? "opacity-75" : "opacity-20"}`} />
                            <span className={`text-[13px] flex-1 truncate transition-colors ${active ? "text-white/65" : "text-white/28"}`}>{cal.name}</span>
                          </button>
                          <button onClick={() => removeImportedCal(cal.id)} className="text-white/18 hover:text-red-400/65 transition-colors shrink-0 mr-2">
                            <Trash2 size={13} />
                          </button>
                          <div onClick={() => toggleSource(cal.id)} className={`relative w-9 h-[18px] rounded-full transition-colors shrink-0 cursor-pointer ${active ? "bg-teal-500/40" : "bg-white/[0.10]"}`}>
                            <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white/75 shadow-sm transition-transform ${active ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Calendar CTA */}
                <div className="border-t border-white/[0.07] pt-4">
                  <button
                    onClick={() => { setShowSourceSheet(false); setShowImportModal(true); }}
                    className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl border border-teal-400/15 bg-teal-500/[0.05] text-teal-400/70 hover:bg-teal-500/[0.10] hover:text-teal-400/90 transition-colors">
                    <Plus size={14} />
                    <span className="text-[13px] font-medium">Add Calendar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const [activeLens, setActiveLens] = useState<Lens>("my-network");
  const [activeType, setActiveType] = useState("All");

  const showFeatured   = activeLens === "my-network";
  const showBrowse     = activeLens !== "calendar";
  const showCategories = activeLens !== "calendar";
  const browseLabel    = activeLens === "browse" ? "Browse Events" : "All Events";

  const isCalendar = activeLens === "calendar";

  // When NOT in calendar mode, the "events-compose" dispatch from the navbar
  // should fall through to the full event builder at /events/new.
  // (When in calendar mode, CalendarModeView handles the same event to open Quick Create.)
  const isCalendarRef = useRef(isCalendar);
  useEffect(() => { isCalendarRef.current = isCalendar; }, [isCalendar]);
  useEffect(() => {
    const handler = () => { if (!isCalendarRef.current) router.push("/events/new"); };
    window.addEventListener("events-compose", handler);
    return () => window.removeEventListener("events-compose", handler);
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-24 pt-20 md:pt-24">

        {/* Page header */}
        {isCalendar ? (
          <>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
              <span className="italic font-light opacity-90 text-teal-400">Calendar</span>
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Your personal events and network gatherings, all in one place.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
              <span className="italic font-light opacity-90 text-teal-400">Events</span>
            </h1>
            <p className="mt-2 text-sm text-white/45 max-w-lg">
              Community gatherings, network calendars, and shared moments across the diaspora.
            </p>
          </>
        )}

        {/* Mode selector + optional calendar workspace label */}
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isCalendar ? "mt-5" : "mt-5"}`}>
          <div className="flex items-center gap-3">
            {/* Lens tabs */}
            <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full w-full sm:w-fit">
              {LENSES.map(({ id, label, icon: Icon }) => {
                const active = activeLens === id;
                return (
                  <button key={id} onClick={() => setActiveLens(id)}
                    className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] transition-all whitespace-nowrap ${
                      active ? "bg-white/[0.08] text-white/80" : "text-white/40 hover:text-white/65"
                    }`}>
                    <Icon size={12} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                    <span className="sm:hidden">{id === "my-network" ? "Network" : label}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {showCategories && (
          <div className="relative mt-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
              {EVENT_TYPES.map((type) => (
                <button key={type} onClick={() => setActiveType(type)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                    activeType === type
                      ? "border-teal-400/30 bg-teal-500/[0.08] text-teal-400/80"
                      : "border-white/[0.12] bg-transparent text-white/55 hover:text-white/80 hover:border-white/18"
                  }`}>
                  {type}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent" />
          </div>
        )}

        {isCalendar && <CalendarModeView />}

        {showFeatured && (
          <section className="mt-8">
            <SectionLabel label="From Your Network" variant="featured" className="mb-4" />
            <div className="md:hidden flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
              {FEATURED.map((ev) => <div key={ev.id} className="shrink-0 w-[272px]"><FeaturedCard event={ev} /></div>)}
            </div>
            <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED.map((ev) => <FeaturedCard key={ev.id} event={ev} />)}
            </div>
          </section>
        )}

        {showBrowse && (
          <section className="mt-8">
            <SectionLabel label={browseLabel} variant="standard" className="mb-4" />
            <Suspense fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3,4,5,6].map((i) => <div key={i} className="wac-card h-28 animate-pulse" />)}
              </div>
            }>
              <EventsResults eventType={activeType !== "All" ? activeType : undefined} />
            </Suspense>
          </section>
        )}

      </div>
    </div>
  );
}
