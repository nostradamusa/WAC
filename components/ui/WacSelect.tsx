"use client";

import React, { useState, useRef, useEffect } from "react";

export type WacSelectOption = {
  value: string;
  label: string;
};

type WacSelectProps = {
  id?: string;
  options: WacSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function WacSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
}: WacSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-left flex justify-between items-center"
      >
        <span className={!selectedOption ? "opacity-60" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform opacity-60 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--border)] bg-[#111] shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--accent)] ${
                value === option.value
                  ? "text-[var(--accent)] bg-[rgba(255,255,255,0.02)] font-medium"
                  : "text-white/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
