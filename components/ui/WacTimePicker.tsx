import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface WacTimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function WacTimePicker({ value, onChange, placeholder = "Select time", disabled }: WacTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMobile) return;

    const updatePanelPosition = () => {
      const triggerRect = containerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const viewportPadding = 12;
      const desiredWidth = Math.max(triggerRect.width, 220);
      const panelHeight = Math.min(window.innerHeight * 0.5, 320);
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding;
      const spaceAbove = triggerRect.top - viewportPadding;
      const openAbove = spaceBelow < panelHeight + 24 && spaceAbove > spaceBelow;
      const top = openAbove
        ? Math.max(viewportPadding, triggerRect.top - panelHeight - 8)
        : Math.min(viewportHeight - panelHeight - viewportPadding, triggerRect.bottom + 8);
      const width = Math.min(desiredWidth, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, triggerRect.left),
        window.innerWidth - width - viewportPadding
      );

      setPanelStyle({
        position: "fixed",
        top,
        left,
        width,
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
  }, [isMobile, isOpen]);

  // Generate 15-minute intervals
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }

  const formatTime = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(':');
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-1 focus:border-purple-500/50 focus:ring-purple-500/50 ${
          disabled ? "opacity-50 cursor-not-allowed bg-white/[0.02] border-white/5" : "bg-white/[0.04] border-white/10 hover:border-white/20 text-white cursor-pointer"
        }`}
      >
        <span className={value ? "text-white" : "text-white/40"}>
          {value ? formatTime(value) : placeholder}
        </span>
        <Clock size={16} className="text-white/40" />
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xl md:hidden" onClick={() => setIsOpen(false)} />
          {isMobile ? (
            <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom flex flex-col items-center">
              <div className="w-12 h-1.5 bg-white/10 rounded-full mb-5 shrink-0" />
              
              <div className="w-full max-h-[50vh] overflow-y-auto no-scrollbar max-w-sm">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(time);
                      setIsOpen(false);
                    }}
                    type="button"
                    className={`w-full text-center px-4 py-4 my-1 text-base rounded-xl transition-colors ${
                      value === time ? "bg-purple-500/20 text-purple-400 font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>
          ) : panelStyle ? createPortal(
            <div
              style={panelStyle}
              className="border border-white/10 bg-[#0a0a0a]/95 rounded-xl p-1 backdrop-blur-xl shadow-2xl shadow-black"
            >
              <div className="w-full max-h-64 overflow-y-auto no-scrollbar">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={(e) => {
                      e.preventDefault();
                      onChange(time);
                      setIsOpen(false);
                    }}
                    type="button"
                    className={`w-full text-left px-4 py-2.5 my-0.5 text-sm rounded-lg transition-colors ${
                      value === time ? "bg-purple-500/20 text-purple-400 font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          ) : null}
        </>
      )}
    </div>
  );
}
