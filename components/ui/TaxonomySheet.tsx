"use client";

/**
 * TaxonomySheet
 *
 * Trigger-anchored dropdown for taxonomy form fields (Focus Area, Group Type).
 *
 * Opens as a fixed panel positioned relative to the trigger on ALL screen sizes —
 * mobile and desktop alike. Never uses a bottom sheet. The panel:
 *   - renders via createPortal so it is never clipped by ancestor overflow/transforms
 *   - uses getBoundingClientRect to anchor to the trigger
 *   - flips upward when there is not enough space below
 *   - scrolls internally when the option list is long
 *   - does not affect page scroll position
 *
 * Outside-click handling uses a ref to the portal panel itself (panelRef) so the
 * mousedown-before-click race on touch devices is eliminated: if the pointer went
 * down inside the panel we never close early, letting the click fully commit.
 */

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface TaxonomySheetOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

interface TaxonomySheetProps {
  value:             string;
  onChange:          (value: string) => void;
  options:           TaxonomySheetOption[];
  placeholder?:      string;
  disabled?:         boolean;
  triggerClassName?: string;
  /** Optional id forwarded to the trigger button so a <label htmlFor> can point at it. */
  id?:               string;
}

export default function TaxonomySheet({
  value,
  onChange,
  options,
  placeholder      = "Select",
  disabled         = false,
  triggerClassName = "",
  id,
}: TaxonomySheetProps) {
  const [open,       setOpen]       = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);

  const rootRef  = useRef<HTMLDivElement>(null);
  // panelRef is applied to the portalled panel div. The outside-click handler checks
  // BOTH rootRef and panelRef so a mousedown on an option never prematurely closes
  // the panel before the click fires — critical on touch devices where mousedown
  // and click are dispatched in separate browser tasks.
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId  = useId();

  // SSR guard
  useEffect(() => setMounted(true), []);

  // ── Panel position — recalculates whenever open or options change ─────────────
  useEffect(() => {
    if (!open) { setPanelStyle(null); return; }

    const update = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const gap      = 6;   // px gap between trigger and panel
      const vPad     = 8;   // minimum margin from viewport edge
      const pickLen  = options.filter((o) => !o.disabled).length;
      const itemH    = 48;  // px per option row (comfortable tap target)
      const panelH   = Math.min(pickLen * itemH + 16, 288);

      const spaceBelow = window.innerHeight - rect.bottom - gap - vPad;
      const spaceAbove = rect.top            - gap - vPad;
      const openAbove  = spaceBelow < panelH && spaceAbove > spaceBelow;

      const maxH       = Math.max(128, openAbove ? spaceAbove : spaceBelow);
      const panelW     = Math.max(rect.width, 200);
      const maxW       = Math.min(panelW, window.innerWidth - vPad * 2);
      const leftEdge   = Math.min(
        Math.max(vPad, rect.left),
        window.innerWidth - maxW - vPad,
      );

      setPanelStyle({
        position:  "fixed",
        top:       openAbove
          ? Math.max(vPad, rect.top - Math.min(panelH, spaceAbove) - gap)
          : rect.bottom + gap,
        left:      leftEdge,
        minWidth:  rect.width,
        maxWidth:  maxW,
        maxHeight: maxH,
        zIndex:    9998,
      });
    };

    update();
    window.addEventListener("resize",  update);
    window.addEventListener("scroll",  update, true);
    return () => {
      window.removeEventListener("resize",  update);
      window.removeEventListener("scroll",  update, true);
    };
  }, [open, options]);

  // ── Close on outside pointer-down / Escape ────────────────────────────────────
  // We check BOTH rootRef (the trigger wrapper) and panelRef (the portalled panel).
  // Without panelRef the handler would fire on every option tap (the panel is outside
  // rootRef in the DOM), scheduling setOpen(false) before the option's click event
  // arrives — causing selections to silently fail, especially on touch devices.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const inTrigger = rootRef.current?.contains(e.target as Node) ?? false;
      const inPanel   = panelRef.current?.contains(e.target as Node) ?? false;
      if (!inTrigger && !inPanel) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown",   onKey);
    };
  }, [open]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const pickable     = options.filter((o) => !o.disabled);
  const selected     = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const hasValue     = Boolean(selected && !selected.disabled);

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
            className="overflow-y-auto rounded-2xl border border-[#b08d57]/20 bg-[#110f0d]/98 p-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            {pickable.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => commit(option.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm leading-snug transition-colors ${
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
            })}
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
        className={`group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.09] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-3.5 py-2.5 text-left text-sm transition-all duration-200 hover:border-white/16 hover:bg-white/[0.06] focus:outline-none focus-visible:border-[#b08d57]/50 focus-visible:shadow-[0_0_0_3px_rgba(176,141,87,0.12)] disabled:cursor-not-allowed disabled:opacity-45 min-h-11 ${triggerClassName}`}
      >
        <span className={`truncate ${hasValue ? "text-white/78" : "text-white/42"}`}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-[#b08d57]/65 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {panel}
    </div>
  );
}
