"use client";

import { Suspense, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import EventsResults from "@/components/events/EventsResults";
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
  AlignJustify,
  LayoutGrid,
  CalendarRange,
  X,
  ChevronDown,
  RotateCcw,
  UserPlus,
  AlignLeft,
  Eye,
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

function makeDraft(date: Date, startTime = "09:00", endTime = "10:00"): EventDraft {
  const p  = (n: number) => String(n).padStart(2, "0");
  const ds = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  return {
    type: "event", title: "", startDate: ds, startTime,
    endDate: ds, endTime, allDay: false, repeat: "none",
    guests: "", location: "", description: "", calendar: "personal", visibility: "public",
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
  { id: "rsvps",      label: "My RSVPs",            dot: "bg-teal-400"    },
  { id: "groups",     label: "My Groups",            dot: "bg-amber-400"  },
  { id: "orgs",       label: "Followed Orgs",        dot: "bg-emerald-400" },
  { id: "businesses", label: "Followed Businesses",  dot: "bg-blue-400"   },
  { id: "people",     label: "Followed People",      dot: "bg-[#b08d57]"  },
];

const CAL_VIEW_TABS: { id: CalViewMode; label: string; icon: React.ElementType }[] = [
  { id: "month",  label: "Month",  icon: LayoutGrid   },
  { id: "week",   label: "Week",   icon: CalendarRange },
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
  { value: "personal", label: "My Calendar"     },
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
      <div className="relative flex-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-white/60 outline-none focus:border-teal-400/25 transition-colors cursor-pointer [color-scheme:dark]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>
          ))}
        </select>
        <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      </div>
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
  draft: initialDraft, onClose, onMoreOptions,
}: {
  draft: EventDraft;
  onClose: () => void;
  onMoreOptions: (d: EventDraft) => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(initialDraft);
  const set = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[84vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
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
        <div className="px-5 pb-4 shrink-0">
          <input
            type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && draft.title.trim() && onClose()}
            placeholder="Add title" autoFocus
            className="w-full text-base font-semibold bg-transparent border-b border-white/[0.1] pb-2 text-white placeholder:text-white/22 outline-none focus:border-teal-400/30 transition-colors"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Date & Time */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">Start</label>
              <div className="flex gap-1.5">
                <input type="date" value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} className={dateInputCls} />
                {!draft.allDay && <input type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} className={timeInputCls} />}
              </div>
            </div>
            <div>
              <label className="text-[9px] text-white/25 uppercase tracking-wider block mb-1">End</label>
              <div className="flex gap-1.5">
                <input type="date" value={draft.endDate} onChange={(e) => set({ endDate: e.target.value })} className={dateInputCls} />
                {!draft.allDay && <input type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} className={timeInputCls} />}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <Toggle checked={draft.allDay} onChange={() => set({ allDay: !draft.allDay })} />
                <span className="text-xs text-white/48">All day</span>
              </label>
              <div className="flex items-center gap-1.5 shrink-0">
                <RotateCcw size={10} className="text-white/25 shrink-0" />
                <div className="relative">
                  <select value={draft.repeat} onChange={(e) => set({ repeat: e.target.value })}
                    className="appearance-none bg-transparent text-xs text-white/48 outline-none cursor-pointer pr-3.5">
                    {REPEAT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>)}
                  </select>
                  <ChevronDown size={9} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                </div>
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

          <div className="grid grid-cols-2 gap-2 pb-1">
            <SelectField icon={CalendarDays} value={draft.calendar}   onChange={(v) => set({ calendar: v })}   options={CALENDAR_OPTIONS}   />
            <SelectField icon={Eye}          value={draft.visibility} onChange={(v) => set({ visibility: v })} options={DISCOVERY_OPTIONS} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.07] flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-xs font-medium text-white/38 hover:text-white/60 transition-colors">Cancel</button>
          <div className="flex items-center gap-2">
            <button onClick={() => onMoreOptions(draft)}
              className="px-3 py-1.5 rounded-full border border-white/[0.1] text-xs font-medium text-white/45 hover:text-white/70 hover:border-white/18 transition-colors">
              More options
            </button>
            <button disabled={!draft.title.trim()} onClick={onClose}
              className="wac-btn-primary wac-btn-sm disabled:opacity-30 disabled:cursor-not-allowed">
              Create
            </button>
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
  draft: initialDraft, onClose,
}: {
  draft: EventDraft;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<EventDraft>(initialDraft);
  const set = (partial: Partial<EventDraft>) => setDraft((d) => ({ ...d, ...partial }));

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

  function goNextTab() {
    const idx = EDITOR_TABS.findIndex((t) => t.id === activeTab);
    if (idx < EDITOR_TABS.length - 1) setActiveTab(EDITOR_TABS[idx + 1].id);
  }
  const isLastTab = activeTab === "advanced";

  const sectionHead = "text-[10px] font-semibold tracking-[0.13em] uppercase text-white/30 mb-3";
  const labelSm     = "text-[10px] text-white/30 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-xl bg-[#0f0f0f] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[96vh] sm:max-h-[88vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <h2 className="text-sm font-semibold text-white/80">New Event</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.05] transition-colors">
            <X size={13} />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-white/[0.06] shrink-0">
          {EDITOR_TABS.map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px ${
                  active ? "border-teal-400 text-teal-400" : "border-transparent text-white/35 hover:text-white/60"
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
            <div className="px-5 py-4 space-y-4">
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 w-8 shrink-0">Start</span>
                    <div className="flex gap-1.5 flex-1">
                      <input type="date" value={draft.startDate} onChange={(e) => set({ startDate: e.target.value })} className={dateInputCls} />
                      {!draft.allDay && <input type="time" value={draft.startTime} onChange={(e) => set({ startTime: e.target.value })} className={timeInputCls} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 w-8 shrink-0">End</span>
                    <div className="flex gap-1.5 flex-1">
                      <input type="date" value={draft.endDate} onChange={(e) => set({ endDate: e.target.value })} className={dateInputCls} />
                      {!draft.allDay && <input type="time" value={draft.endTime} onChange={(e) => set({ endTime: e.target.value })} className={timeInputCls} />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Toggle checked={draft.allDay} onChange={() => set({ allDay: !draft.allDay })} />
                      <span className="text-xs text-white/48">All day</span>
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <RotateCcw size={10} className="text-white/25 shrink-0" />
                      <div className="relative">
                        <select value={draft.repeat} onChange={(e) => set({ repeat: e.target.value })}
                          className="appearance-none bg-transparent text-xs text-white/48 outline-none cursor-pointer pr-3.5">
                          {REPEAT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>)}
                        </select>
                        <ChevronDown size={9} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                      </div>
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
            <div className="px-5 py-4 space-y-5">

              {/* Host as */}
              <div>
                <div className={sectionHead}>Host as</div>
                <div className="grid grid-cols-2 gap-2">
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
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <select value={linkedType} onChange={(e) => setLinkedType(e.target.value as typeof linkedType)}
                      className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-white/55 outline-none cursor-pointer [color-scheme:dark]">
                      <option value=""             className="bg-[#111]">Type</option>
                      <option value="group"        className="bg-[#111]">Group</option>
                      <option value="organization" className="bg-[#111]">Org</option>
                      <option value="business"     className="bg-[#111]">Business</option>
                    </select>
                    <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                  <input type="text" value={linkedSearch} onChange={(e) => setLinkedSearch(e.target.value)}
                    placeholder={linkedType ? `Search ${linkedType}s…` : "Select type first"}
                    disabled={!linkedType}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-white/60 placeholder:text-white/22 outline-none focus:border-teal-400/25 disabled:opacity-38 transition-colors" />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className={sectionHead}>Category</div>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 pr-8 text-xs text-white/60 outline-none focus:border-teal-400/25 cursor-pointer [color-scheme:dark]">
                    {EVENT_CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#111] text-white">{c}</option>)}
                  </select>
                  <ChevronDown size={9} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
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
            <div className="px-5 py-4 space-y-5">

              {/* Calendar destination */}
              <div>
                <div className={sectionHead}>Calendar destination</div>
                <SelectField icon={CalendarDays} value={draft.calendar} onChange={(v) => set({ calendar: v })} options={CALENDAR_OPTIONS} />
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
            <div className="px-5 py-4 space-y-5">

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
                      className="px-2.5 py-1 rounded-full border border-white/[0.1] text-[10px] text-white/40 hover:text-white/65 hover:border-white/20 transition-colors">
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
                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="relative">
                          <select value={q.type} onChange={(e) => updateQuestion(i, "type", e.target.value as QuestionItem["type"])}
                            className="appearance-none bg-transparent text-[10px] text-white/38 outline-none cursor-pointer pr-3.5">
                            <option value="text"   className="bg-[#111] text-white">Short answer</option>
                            <option value="yesno"  className="bg-[#111] text-white">Yes / No</option>
                            <option value="choice" className="bg-[#111] text-white">Multiple choice</option>
                          </select>
                          <ChevronDown size={8} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                        </div>
                        <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
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
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-white/55">RSVP reminder</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Remind guests who haven't responded yet</p>
                    </div>
                    <div className="relative shrink-0">
                      <select value={rsvpReminder} onChange={(e) => setRsvpReminder(e.target.value)}
                        className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-white/55 outline-none cursor-pointer [color-scheme:dark]">
                        {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>)}
                      </select>
                      <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-white/55">Event reminder</span>
                      <p className="text-[10px] text-white/28 mt-0.5">Send to all RSVPs before the event starts</p>
                    </div>
                    <div className="relative shrink-0">
                      <select value={eventReminder} onChange={(e) => setEventReminder(e.target.value)}
                        className="appearance-none bg-white/[0.04] border border-white/[0.08] rounded-lg pl-2.5 pr-6 py-1.5 text-xs text-white/55 outline-none cursor-pointer [color-scheme:dark]">
                        {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>)}
                      </select>
                      <ChevronDown size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    </div>
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
        <div className="px-5 py-3.5 border-t border-white/[0.07] flex items-center justify-between shrink-0">
          <button onClick={onClose}
            className="text-xs font-medium text-white/38 hover:text-white/60 transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {!isLastTab && (
              <button onClick={goNextTab}
                className="px-3 py-1.5 rounded-full border border-white/[0.1] text-xs font-medium text-white/45 hover:text-white/70 hover:border-white/18 transition-colors">
                Next →
              </button>
            )}
            <button disabled={!draft.title.trim()} onClick={onClose}
              className="wac-btn-primary wac-btn-md disabled:opacity-30 disabled:cursor-not-allowed">
              Save Event
            </button>
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

// ── CalendarModeView ──────────────────────────────────────────────────────────

function CalendarModeView() {
  const today = new Date();

  const [calView, setCalView] = useState<CalViewMode>("month");
  const [navDate, setNavDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

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
    new Set(CAL_SOURCES.map((s) => s.id))
  );
  function toggleSource(id: string) {
    setActiveSources((prev) => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
  }

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

  const [modalDraft,     setModalDraft]     = useState<EventDraft | null>(null);
  const [showFullEditor, setShowFullEditor] = useState(false);

  function closeModal() {
    setModalDraft(null); setShowFullEditor(false);
    setSelectedDay(null); setSelDayIdx(null); setSelStartH(null); setSelEndH(null);
  }
  function handleMoreOptions(draft: EventDraft) { setModalDraft(draft); setShowFullEditor(true); }

  function handleDayClick(day: number) {
    const date = new Date(navDate.getFullYear(), navDate.getMonth(), day);
    setSelectedDay(day);
    setModalDraft(makeDraft(date));
    setShowFullEditor(false);
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

  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const periodLabel =
    calView === "week"
      ? weekStart.getMonth() === weekEnd.getMonth()
        ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekStart.getFullYear()}`
        : `${MONTH_NAMES[weekStart.getMonth()].slice(0,3)} ${weekStart.getDate()} – ${MONTH_NAMES[weekEnd.getMonth()].slice(0,3)} ${weekEnd.getDate()}`
      : `${MONTH_NAMES[navDate.getMonth()]} ${navDate.getFullYear()}`;

  const selLo = selStartH !== null && selEndH !== null ? Math.min(selStartH, selEndH) : null;
  const selHi = selStartH !== null && selEndH !== null ? Math.max(selStartH, selEndH) : null;

  function isSlotSelected(dayIdx: number, hour: number) {
    if (selDayIdx !== dayIdx || selLo === null || selHi === null) return false;
    return hour >= selLo && hour <= selHi;
  }

  return (
    <div className="mt-6 flex flex-col lg:flex-row gap-5">

      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={prevPeriod} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-white/80 min-w-[160px] text-center">{periodLabel}</span>
            <button onClick={nextPeriod} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.04] border border-white/[0.07] rounded-lg">
            {CAL_VIEW_TABS.map(({ id, label, icon: Icon }) => {
              const active = calView === id;
              return (
                <button key={id} onClick={() => switchCalView(id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    active ? "bg-teal-500/[0.12] text-teal-400" : "text-white/35 hover:text-white/60"
                  }`}>
                  <Icon size={11} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Month */}
        {calView === "month" && (
          <>
            <div className="wac-card p-0 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-white/[0.05]">
                {DAY_ABBREVS.map((d) => (
                  <div key={d} className="py-2 text-center text-[10px] font-semibold tracking-wider text-white/25 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((day, i) => {
                  const isToday    = isCurrentMonth && day === today.getDate();
                  const isSelected = day !== null && day === selectedDay && !isToday;
                  const isWeekend  = i % 7 === 0 || i % 7 === 6;
                  const lastInRow  = i % 7 === 6;
                  return (
                    <div key={i} onClick={() => day !== null && handleDayClick(day)}
                      className={`relative min-h-[56px] p-1.5 border-b border-r border-white/[0.04] transition-colors ${lastInRow ? "border-r-0" : ""} ${
                        day === null ? "bg-white/[0.01]"
                        : isSelected ? "bg-teal-500/[0.07] cursor-pointer"
                        : isWeekend  ? "bg-white/[0.012] cursor-pointer hover:bg-white/[0.03]"
                        : "cursor-pointer hover:bg-white/[0.025]"
                      }`}>
                      {day !== null && (
                        <span className={`inline-flex items-center justify-center w-5 h-5 text-[11px] rounded-full ${
                          isToday    ? "bg-teal-500/20 text-teal-400 font-semibold ring-1 ring-teal-400/40"
                          : isSelected ? "bg-teal-400/15 text-teal-400 font-semibold"
                          : "text-white/35 font-medium"
                        }`}>
                          {day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 py-3 px-4 rounded-xl border border-dashed border-white/[0.06]">
              <p className="text-xs text-white/28">Click any day to create an event. RSVP to events or follow groups to populate your calendar.</p>
            </div>
          </>
        )}

        {/* Week */}
        {calView === "week" && (
          <>
            <div className="wac-card p-0 overflow-hidden select-none"
              onMouseUp={handleGridMouseUp} onMouseLeave={handleGridMouseUp}>
              <div className="grid border-b border-white/[0.05]" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
                <div />
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
              <div className="overflow-y-auto max-h-[420px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {WEEK_HOURS.map((hour) => (
                  <div key={hour} className="grid border-b border-white/[0.03] last:border-0" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
                    <div className="px-2 pt-1.5 text-right text-[10px] text-white/20 leading-none shrink-0">{formatHour(hour)}</div>
                    {weekDays.map((_, dayIdx) => (
                      <div key={dayIdx}
                        onMouseDown={(e) => handleSlotMouseDown(dayIdx, hour, e)}
                        onMouseEnter={() => handleSlotMouseEnter(dayIdx, hour)}
                        className={`h-10 border-l border-white/[0.03] cursor-pointer transition-colors ${
                          isSlotSelected(dayIdx, hour) ? "bg-teal-500/[0.14]" : "hover:bg-white/[0.04]"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 py-3 px-4 rounded-xl border border-dashed border-white/[0.06]">
              <p className="text-xs text-white/28">Click and drag on any column to select a time range and create an event.</p>
            </div>
          </>
        )}

        {/* Agenda */}
        {calView === "agenda" && (
          <div className="wac-card p-14 text-center space-y-2">
            <AlignJustify size={22} className="text-teal-400/35 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Agenda view coming soon.</p>
            <p className="text-white/25 text-xs">Your RSVPs and subscribed calendars will appear here.</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:w-52 shrink-0 space-y-3">
        <div className="flex lg:flex-col gap-2">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-teal-400/20 text-xs font-semibold text-teal-400/70 hover:bg-teal-500/10 hover:text-teal-400 transition-colors">
            <Plus size={12} />Add Event
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-xs font-semibold text-white/35 hover:text-white/60 hover:border-white/15 transition-colors">
            <Download size={12} />Import Calendar
          </button>
        </div>
        <div className="wac-card p-4">
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30 mb-3">Sources</div>
          <div className="space-y-2.5">
            {CAL_SOURCES.map(({ id, label, dot }) => {
              const active = activeSources.has(id);
              return (
                <button key={id} onClick={() => toggleSource(id)} className="w-full flex items-center gap-2.5 text-left">
                  <span className={`w-2 h-2 rounded-full shrink-0 transition-opacity ${dot} ${active ? "opacity-80" : "opacity-20"}`} />
                  <span className={`text-xs transition-colors ${active ? "text-white/60" : "text-white/25"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="wac-card p-4">
          <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/30 mb-3">Upcoming</div>
          <div className="space-y-3">
            {FEATURED.slice(0, 2).map((ev) => (
              <Link key={ev.id} href={ev.href} className="block group">
                <div className="text-[10px] text-teal-400/60 mb-0.5">{ev.date}</div>
                <div className="text-xs text-white/55 leading-snug group-hover:text-white/80 transition-colors line-clamp-2">{ev.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalDraft && !showFullEditor && (
        <CreateEventModal draft={modalDraft} onClose={closeModal} onMoreOptions={handleMoreOptions} />
      )}
      {modalDraft && showFullEditor && (
        <FullEventEditorModal draft={modalDraft} onClose={closeModal} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [activeLens, setActiveLens] = useState<Lens>("my-network");
  const [activeType, setActiveType] = useState("All");

  const showFeatured   = activeLens === "my-network";
  const showBrowse     = activeLens !== "calendar";
  const showCategories = activeLens !== "calendar";
  const browseLabel    = activeLens === "browse" ? "Browse Events" : "All Events";

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          <span className="italic font-light opacity-90 text-teal-400">Events</span>
        </h1>
        <p className="mt-2 text-sm text-white/45 max-w-lg">
          Community gatherings, network calendars, and shared moments across the diaspora.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Lens tabs — mode switching only */}
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full w-fit">
            {LENSES.map(({ id, label, icon: Icon }) => {
              const active = activeLens === id;
              return (
                <button key={id} onClick={() => setActiveLens(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] transition-all whitespace-nowrap ${
                    active ? "bg-teal-500/[0.12] text-teal-400" : "text-white/45 hover:text-white/70"
                  }`}>
                  <Icon size={12} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                  {/* Shorten "My Network" on small screens to avoid crowding */}
                  <span className="sm:hidden">{id === "my-network" ? "Network" : label}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
          {/* Create Event — desktop only; mobile uses navbar + button */}
          <Link
            href="/events/new"
            className="hidden sm:flex wac-btn-primary wac-btn-sm items-center gap-1.5 w-fit shrink-0"
          >
            <Plus size={11} strokeWidth={2.5} />
            Create Event
          </Link>
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

        {activeLens === "calendar" && <CalendarModeView />}

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
