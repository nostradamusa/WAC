"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  aliases?: string[];
  disabled?: boolean;
}

interface SearchableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  id?: string;
}

export default function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  triggerClassName = "",
  id,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  // SSR guard
  useEffect(() => setMounted(true), []);

  // When opening, reset search and optionally focus input
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      // slight delay to allow portal to render
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [open]);

  // ── Panel position — recalculates whenever open or options change ─────────────
  useEffect(() => {
    if (!open) { setPanelStyle(null); return; }

    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gap = 6;
      const vPad = 8;
      const pickLen = options.filter((o) => !o.disabled).length;
      // height estimate: search input (~48px) + list items
      const itemH = 48;
      const panelH = Math.min(pickLen * itemH + 64, 320);

      const spaceBelow = window.innerHeight - rect.bottom - gap - vPad;
      const spaceAbove = rect.top - gap - vPad;
      const openAbove = spaceBelow < panelH && spaceAbove > spaceBelow;

      const maxH = Math.max(160, openAbove ? spaceAbove : spaceBelow);
      const panelW = Math.max(rect.width, 220);
      const maxW = Math.min(panelW, window.innerWidth - vPad * 2);
      const leftEdge = Math.min(
        Math.max(vPad, rect.left),
        window.innerWidth - maxW - vPad,
      );

      setPanelStyle({
        position: "fixed",
        top: openAbove
          ? Math.max(vPad, rect.top - Math.min(panelH, spaceAbove) - gap)
          : rect.bottom + gap,
        left: leftEdge,
        minWidth: rect.width,
        maxWidth: maxW,
        maxHeight: maxH,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, options, searchQuery]);

  // ── Close on outside pointer-down / Escape ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const inTrigger = rootRef.current?.contains(e.target as Node) ?? false;
      const inPanel = panelRef.current?.contains(e.target as Node) ?? false;
      if (!inTrigger && !inPanel) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const pickable = options.filter((o) => !o.disabled);
  const filteredOptions = pickable.filter((o) => {
    const term = searchQuery.toLowerCase();
    return o.label.toLowerCase().includes(term) || o.aliases?.some(a => a.toLowerCase().includes(term));
  });
  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const hasValue = Boolean(selected && !selected.disabled);

  function commit(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  // ── Panel (portalled — anchored to trigger on all screen sizes) ───────────────
  const panel =
    mounted && open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="listbox"
            style={panelStyle}
            className="rounded-2xl border border-[#b08d57]/20 bg-[#110f0d]/98 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            onPointerDown={(e) => {
              // stop propagation so the mousedown doesn't blur the search input inappropriately
              e.stopPropagation();
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 mb-1 shrink-0">
              <Search size={14} className="text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto flex-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-xs text-white/40">No matches found.</div>
              ) : (
                filteredOptions.map((option) => {
                  const active = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => commit(option.value)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-[13px] leading-snug transition-colors ${
                        active
                          ? "bg-[#b08d57]/14 text-[#f4ddba]"
                          : "text-white/70 hover:bg-white/[0.05] hover:text-white/90"
                      }`}
                    >
                      <span>{option.label}</span>
                      {active ? (
                        <Check size={14} className="shrink-0 text-[#d8b06a]" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-left text-[12px] transition-all duration-200 hover:border-white/16 hover:bg-white/[0.04] focus:outline-none focus-visible:border-[#b08d57]/35 focus-visible:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-45 ${triggerClassName}`}
      >
        <span className={`truncate ${hasValue ? "text-white/70" : "text-white/20"}`}>
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-white/30 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {panel}
    </div>
  );
}
