import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

interface WacDatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function WacDatePicker({ value, onChange, placeholder = "Select date", disabled }: WacDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Safely parse incoming YYYY-MM-DD string to Date
  const parsedValue = value ? new Date(value + "T00:00:00") : null;
  const [currentMonth, setCurrentMonth] = useState(parsedValue || new Date());
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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDateClick = (day: Date) => {
    // format as YYYY-MM-DD
    onChange(format(day, "yyyy-MM-dd"));
    setIsOpen(false);
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
        <span className={parsedValue ? "text-white" : "text-white/40"}>
          {parsedValue ? format(parsedValue, "PPP") : placeholder}
        </span>
        <CalendarIcon size={16} className="text-white/40" />
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xl md:hidden" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom md:absolute md:inset-auto md:top-full md:mt-2 md:p-4 md:rounded-xl md:border md:bg-[#0a0a0a]/95 md:backdrop-blur-xl md:shadow-2xl md:shadow-black md:w-full md:min-w-[280px] md:origin-top md:slide-in-from-top-2">
            
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />
            
            <div className="w-full max-w-sm mx-auto">
              <div className="flex justify-between items-center mb-4">
                <button onClick={(e) => { e.preventDefault(); setCurrentMonth(subMonths(currentMonth, 1)); }} type="button" className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</span>
                <button onClick={(e) => { e.preventDefault(); setCurrentMonth(addMonths(currentMonth, 1)); }} type="button" className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-[10px] font-medium text-white/40 uppercase">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 justify-items-center">
                {days.map((day, i) => {
                  const isSelected = parsedValue && isSameDay(day, parsedValue);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  return (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); handleDateClick(day); }}
                      type="button"
                      className={`h-9 w-9 md:h-8 md:w-8 rounded-full text-sm md:text-xs flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          : isCurrentMonth
                          ? "text-white hover:bg-white/10"
                          : "text-white/20 hover:text-white/40"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
