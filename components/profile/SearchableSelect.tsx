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
      style={{
        position: "relative",
        width: "100%",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className="wac-select-trigger"
        style={{ color: value ? "var(--foreground)" : "#a99986" }}
      >
        {selectedOption ? selectedOption.label : placeholder}

        <span
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--accent)",
            fontSize: 12,
            pointerEvents: "none",
            transition: "transform 0.2s ease",
          }}
          className={isOpen ? "rotate-180" : ""}
        >
          ▼
        </span>
      </button>

      {isOpen ? (
        <div className="wac-card wac-select-content">
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="wac-select-search outline-none"
          />

          <div className="wac-select-list">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className="wac-select-option"
              data-selected={!value}
            >
              {placeholder}
            </button>

            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 14,
                  opacity: 0.6,
                }}
              >
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
                    className="wac-select-option"
                    data-selected={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
