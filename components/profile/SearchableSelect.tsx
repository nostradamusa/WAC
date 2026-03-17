"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) ?? null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  function handleToggle() {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setSearchTerm("");
    }
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
    setSearchTerm("");
  }

  return (
    <div
      ref={containerRef}
      className={`w-full transition-opacity ${disabled ? 'opacity-60' : 'opacity-100'} ${isOpen ? 'relative z-[100]' : 'relative z-10'}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] text-left flex justify-between items-center"
        style={{ color: value ? "var(--foreground)" : "#a99986" }}
      >
        <span className="truncate pr-4">
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
          className={`shrink-0 transition-transform opacity-60 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full rounded-xl border border-[var(--border)] bg-[#111] shadow-2xl overflow-hidden py-2 flex flex-col z-[100] max-h-72">
          <div className="px-2 pb-2 border-b border-white/10 mb-1">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-[var(--border)] bg-black px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition text-white"
            />
          </div>

          <div className="overflow-y-auto px-1 wac-select-list flex-1">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-3 py-2 text-sm transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--accent)] rounded-lg ${
                !value
                  ? "text-[var(--accent)] bg-[rgba(255,255,255,0.02)] font-medium"
                  : "text-white/80"
              }`}
            >
              {placeholder}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm opacity-60">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full text-left px-3 py-2 mt-0.5 text-sm transition hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--accent)] rounded-lg ${
                      isSelected
                        ? "text-[var(--accent)] bg-[rgba(255,255,255,0.02)] font-medium"
                        : "text-white/80"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
