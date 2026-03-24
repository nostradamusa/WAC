import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface WacSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export default function WacSelect({ value, onChange, options, placeholder = "Select...", disabled }: WacSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <span className={selectedOption ? "text-white" : "text-white/40"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xl md:hidden" onClick={() => setIsOpen(false)} />

          <div className="fixed inset-x-0 bottom-0 z-[100] bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col items-center p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom md:absolute md:inset-auto md:top-full md:mt-2 md:p-0 md:rounded-xl md:border md:bg-[#0a0a0a]/95 md:backdrop-blur-xl md:shadow-2xl md:shadow-black overflow-hidden md:w-full md:origin-top md:slide-in-from-top-2">
            
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mb-5 md:hidden shrink-0" />
            
            <ul className="max-h-[50vh] md:max-h-60 overflow-y-auto no-scrollbar py-1 w-full max-w-sm md:max-w-none">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 md:px-4 md:py-3 text-left text-base md:text-sm transition-colors hover:bg-white/[0.04] ${
                      value === option.value ? "text-purple-400 bg-purple-500/10" : "text-white/80"
                    }`}
                  >
                    {option.label}
                    {value === option.value && <Check size={16} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
