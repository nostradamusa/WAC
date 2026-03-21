"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  MapPin,
  Globe,
  Link2,
  RotateCcw,
  UserPlus,
  ChevronDown,
  Plus,
  Activity,
  Check,
  Bell,
  Radio,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionId = "basics" | "hosting" | "publishing" | "access" | "advanced";
type HostAs    = "me" | "organization" | "business" | "group";

interface QuestionItem {
  id:       string;
  text:     string;
  type:     "text" | "yesno" | "choice";
  required: boolean;
}

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

function todayStr() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, color = "teal",
}: {
  checked: boolean; onChange: () => void; color?: "teal" | "rose";
}) {
  const bg = checked
    ? color === "rose" ? "bg-rose-500/40" : "bg-teal-500/40"
    : "bg-white/[0.1]";
  return (
    <button type="button" onClick={onChange}
      className={`relative w-9 h-[18px] rounded-full transition-colors shrink-0 ${bg}`}>
      <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white/75 shadow-sm transition-transform ${
        checked ? "translate-x-[21px]" : "translate-x-[3px]"
      }`} />
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
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 pr-9 py-2.5 text-sm text-white/65 outline-none focus:border-teal-400/25 transition-colors cursor-pointer [color-scheme:dark]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/28 pointer-events-none" />
      </div>
    </div>
  );
}

function ToggleRow({
  label, sublabel, checked, onChange, color = "teal",
}: {
  label: string; sublabel?: string;
  checked: boolean; onChange: () => void; color?: "teal" | "rose";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <div>
        <div className="text-sm text-white/72">{label}</div>
        {sublabel && <div className="text-xs text-white/30 mt-0.5 leading-snug">{sublabel}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
    </div>
  );
}

const dateInputCls =
  "flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";
const timeInputCls =
  "w-28 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none focus:border-teal-400/25 transition-colors [color-scheme:dark]";

// ── Cover image ───────────────────────────────────────────────────────────────

function CoverImageArea({
  value, onChange,
}: {
  value: string | null; onChange: (v: string | null) => void;
}) {
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
    <div
      className="w-full rounded-2xl border border-white/[0.07] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400/15 hover:bg-white/[0.015] transition-colors group"
      style={{ height: 160 }}
    >
      <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:bg-teal-500/[0.08] group-hover:border-teal-400/15 transition-colors">
        <Camera size={16} className="text-white/25 group-hover:text-teal-400/50 transition-colors" />
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-white/30 group-hover:text-white/45 transition-colors">Add cover photo</div>
        <div className="text-[10px] text-white/18 mt-0.5">Recommended: 1600 × 900px</div>
      </div>
    </div>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const today = todayStr();

  const [activeSection, setActiveSection] = useState<SectionId>("basics");

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
  const [coHosts,       setCoHosts]       = useState("");
  const [linkedType,    setLinkedType]    = useState<"" | "group" | "organization" | "business">("");
  const [linkedSearch,  setLinkedSearch]  = useState("");
  const [category,      setCategory]      = useState("Networking");
  const [postToPulse,   setPostToPulse]   = useState(false);

  // ─ Publishing ─
  const [calendarDest,      setCalendarDest]      = useState("personal");
  const [discoveryScope,    setDiscoveryScope]    = useState("public");
  const [publishToEvents,   setPublishToEvents]   = useState(true);
  const [publishToEntity,   setPublishToEntity]   = useState(false);
  const [publishToMemberCal, setPublishToMemberCal] = useState(false);

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

  // Discovery scope hint
  const discoveryHint = DISCOVERY_OPTIONS.find((o) => o.value === discoveryScope)?.hint;

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
                  <div className="flex gap-2 mb-4">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={dateInputCls} />
                    {!allDay && <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={timeInputCls} />}
                  </div>

                  <FieldLabel>End</FieldLabel>
                  <div className="flex gap-2 mb-4">
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={dateInputCls} />
                    {!allDay && <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={timeInputCls} />}
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Toggle checked={allDay} onChange={() => setAllDay(!allDay)} />
                      <span className="text-sm text-white/48">All day</span>
                    </label>
                    <div className="flex items-center gap-2 text-sm text-white/45">
                      <span className="text-white/25 text-xs">Repeat</span>
                      <div className="relative">
                        <select
                          value={repeat}
                          onChange={(e) => setRepeat(e.target.value)}
                          className="appearance-none bg-transparent text-sm text-white/48 outline-none cursor-pointer pr-4 [color-scheme:dark]"
                        >
                          {REPEAT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value} className="bg-[#111] text-white">{o.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                      </div>
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
                  <FieldLabel>Host as</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(["me", "organization", "business", "group"] as HostAs[]).map((opt) => {
                      const label = { me: "Myself", organization: "My Organization", business: "My Business", group: "A Group" }[opt];
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
                  {hostAs !== "me" && (
                    <input
                      type="text"
                      value={hostAsSearch}
                      onChange={(e) => setHostAsSearch(e.target.value)}
                      placeholder={`Search ${hostAs === "organization" ? "organizations" : hostAs === "business" ? "businesses" : "groups"}...`}
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors mb-4"
                    />
                  )}

                  <div className="border-t border-white/[0.05] pt-4">
                    <FieldLabel>Co-hosts</FieldLabel>
                    <input
                      type="text"
                      value={coHosts}
                      onChange={(e) => setCoHosts(e.target.value)}
                      placeholder="Add co-hosts by name or @handle"
                      className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors"
                    />
                  </div>
                </Card>

                {/* Network links */}
                <Card>
                  <FieldLabel>Link to group / org / business</FieldLabel>
                  <p className="text-[11px] text-white/28 mb-3 leading-relaxed">
                    The event will appear on the linked entity's profile and surface to their followers.
                  </p>
                  <div className="flex gap-2 mb-5">
                    <div className="relative w-40 shrink-0">
                      <select
                        value={linkedType}
                        onChange={(e) => setLinkedType(e.target.value as typeof linkedType)}
                        className="w-full appearance-none bg-white/[0.04] border border-white/[0.09] rounded-xl pl-3 pr-7 py-2.5 text-sm text-white/55 outline-none focus:border-teal-400/25 transition-colors cursor-pointer [color-scheme:dark]"
                      >
                        <option value="" className="bg-[#111]">None</option>
                        <option value="group" className="bg-[#111]">Group</option>
                        <option value="organization" className="bg-[#111]">Organization</option>
                        <option value="business" className="bg-[#111]">Business</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/28 pointer-events-none" />
                    </div>
                    {linkedType && (
                      <input
                        type="text"
                        value={linkedSearch}
                        onChange={(e) => setLinkedSearch(e.target.value)}
                        placeholder={`Search ${linkedType}s...`}
                        className="flex-1 bg-white/[0.04] border border-white/[0.09] rounded-xl px-3.5 py-2.5 text-sm text-white/65 placeholder:text-white/22 outline-none focus:border-teal-400/25 transition-colors"
                      />
                    )}
                  </div>

                  <NativeSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </Card>

                {/* Pulse */}
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/[0.08] border border-rose-400/12 flex items-center justify-center shrink-0">
                        <Activity size={13} className="text-rose-400/55" />
                      </div>
                      <div>
                        <div className="text-sm text-white/70">Post to Pulse</div>
                        <div className="text-xs text-white/30 mt-0.5">Share this event to your network's feed</div>
                      </div>
                    </div>
                    <Toggle checked={postToPulse} onChange={() => setPostToPulse(!postToPulse)} color="rose" />
                  </div>
                </Card>
              </div>
            )}

            {/* ── 3. Publishing ──────────────────────────────────────────────── */}
            {activeSection === "publishing" && (
              <div className="space-y-4">
                <SectionHeader index={2} section={SECTIONS[2]} />

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
                          <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                            active ? "border-teal-400 bg-teal-400" : "border-white/25"
                          }`}>
                            {active && <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />}
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

                {/* Publish surfaces */}
                <Card>
                  <FieldLabel>Publish to</FieldLabel>
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
                              <div className="relative">
                                <select
                                  value={q.type}
                                  onChange={(e) => updateQ(i, "type", e.target.value as QuestionItem["type"])}
                                  className="appearance-none bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 pr-6 py-1 text-[11px] text-white/42 outline-none cursor-pointer [color-scheme:dark]"
                                >
                                  <option value="text" className="bg-[#111]">Short answer</option>
                                  <option value="yesno" className="bg-[#111]">Yes / No</option>
                                  <option value="choice" className="bg-[#111]">Multiple choice</option>
                                </select>
                                <ChevronDown size={8} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/22 pointer-events-none" />
                              </div>
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
                    <div className="relative shrink-0">
                      <select
                        value={newQType}
                        onChange={(e) => setNewQType(e.target.value as QuestionItem["type"])}
                        className="appearance-none bg-white/[0.04] border border-white/[0.09] rounded-xl pl-3 pr-7 py-2.5 text-sm text-white/48 outline-none cursor-pointer [color-scheme:dark]"
                      >
                        <option value="text" className="bg-[#111]">Short</option>
                        <option value="yesno" className="bg-[#111]">Yes/No</option>
                        <option value="choice" className="bg-[#111]">Choice</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    </div>
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
                        <div className="text-xs text-white/28 mt-0.5">Remind guests who haven't responded</div>
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
            <button className="wac-btn-secondary wac-btn-md">
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
                disabled={!title.trim()}
                className="wac-btn-primary wac-btn-md disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Publish Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
