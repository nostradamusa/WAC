import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface WacTimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function WacTimePicker({ value, onChange, placeholder = "Select time", disabled }: WacTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom flex flex-col items-center md:absolute md:inset-auto md:top-full md:mt-2 md:p-1 md:rounded-xl md:border md:bg-[#0a0a0a]/95 md:backdrop-blur-xl md:shadow-2xl md:shadow-black md:w-full md:min-w-[200px] md:origin-top md:slide-in-from-top-2">
            
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mb-5 md:hidden shrink-0" />
            
            <div className="w-full max-h-[50vh] md:max-h-64 overflow-y-auto no-scrollbar max-w-sm">
              {times.map((time) => (
                <button
                  key={time}
                  onClick={(e) => {
                    e.preventDefault();
                    onChange(time);
                    setIsOpen(false);
                  }}
                  type="button"
                  className={`w-full text-center md:text-left px-4 py-4 md:py-2.5 my-1 md:my-0.5 text-base md:text-sm rounded-xl md:rounded-lg transition-colors ${
                    value === time ? "bg-purple-500/20 text-purple-400 font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
