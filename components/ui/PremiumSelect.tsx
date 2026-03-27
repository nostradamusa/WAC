"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export type PremiumSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type PremiumSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: PremiumSelectOption[];
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  optionClassName?: string;
  iconClassName?: string;
  compact?: boolean;
  align?: "left" | "right";
};

export default function PremiumSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  name,
  disabled = false,
  className = "",
  triggerClassName = "",
  panelClassName = "",
  optionClassName = "",
  iconClassName = "",
  compact = false,
  align = "left",
}: PremiumSelectProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || isMobile) return;

    const updatePanelPosition = () => {
      const triggerRect = rootRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 12;
      const panelWidth = Math.max(triggerRect.width, compact ? 180 : 220);
      const maxWidth = Math.min(Math.max(panelWidth, triggerRect.width), window.innerWidth - viewportPadding * 2);
      const estimatedPanelHeight = Math.min(options.length * (compact ? 34 : 42) + 20, 320);
      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const spaceAbove = triggerRect.top - viewportPadding;
      const openAbove = spaceBelow < Math.min(estimatedPanelHeight, 220) && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(viewportPadding, triggerRect.top - Math.min(estimatedPanelHeight, spaceAbove) - 8)
        : triggerRect.bottom + 8;
      const left = align === "right"
        ? undefined
        : Math.min(
            Math.max(viewportPadding, triggerRect.left),
            window.innerWidth - maxWidth - viewportPadding
          );
      const right = align === "right"
        ? Math.max(viewportPadding, window.innerWidth - triggerRect.right)
        : undefined;

      setPanelStyle({
        position: "fixed",
        top,
        left,
        right,
        minWidth: triggerRect.width,
        maxWidth,
        maxHeight: Math.max(160, openAbove ? spaceAbove : spaceBelow),
        zIndex: 90,
      });
    };

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [align, isMobile, open]);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const label = selected?.label ?? placeholder ?? "Select";

  function commit(nextValue: string, isDisabled?: boolean) {
    if (isDisabled) return;
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name ? <input id={id} type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={`group flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.09] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] px-3.5 text-left text-sm text-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-white/16 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#b08d57]/25 disabled:cursor-not-allowed disabled:opacity-45 ${
          compact ? "min-h-8 py-1.5 text-xs" : "min-h-11 py-2.5"
        } ${triggerClassName}`}
      >
        <span className={`truncate ${selected ? "text-white/78" : "text-white/42"}`}>{label}</span>
        <ChevronDown
          size={compact ? 13 : 16}
          className={`shrink-0 text-[#b08d57]/65 transition-transform duration-200 ${open ? "rotate-180" : ""} ${iconClassName}`}
        />
      </button>

      {open && !isMobile && panelStyle ? createPortal(
        <div
          id={panelId}
          role="listbox"
          style={panelStyle}
          className={`overflow-y-auto rounded-2xl border border-[#b08d57]/20 bg-[#120f0d]/96 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl ${panelClassName}`}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                onClick={() => commit(option.value, option.disabled)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  option.disabled
                    ? "cursor-not-allowed text-white/22"
                    : active
                    ? "bg-[#b08d57]/14 text-[#f4ddba]"
                    : "text-white/70 hover:bg-white/[0.05] hover:text-white"
                } ${optionClassName}`}
              >
                <span>{option.label}</span>
                {active ? <Check size={14} className="text-[#d8b06a]" /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      ) : null}

      {open && isMobile ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Close dropdown"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-white/10 bg-[#0d0b0a]/98 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/12" />
            <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Select an option
            </div>
            <div id={panelId} role="listbox" className="max-h-[50vh] space-y-2 overflow-y-auto pb-4">
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={option.disabled}
                    onClick={() => commit(option.value, option.disabled)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/22"
                        : active
                        ? "border-[#b08d57]/22 bg-[#b08d57]/12 text-[#f4ddba]"
                        : "border-white/10 bg-white/[0.03] text-white/78"
                    }`}
                  >
                    <span>{option.label}</span>
                    {active ? <Check size={16} className="text-[#d8b06a]" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
