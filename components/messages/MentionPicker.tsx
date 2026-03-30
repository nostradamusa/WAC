"use client";

import { useState, useEffect, useRef } from "react";

type Participant = {
  id: string;
  name: string;
  avatar_url: string | null;
  type: string;
};

type Props = {
  participants: Participant[];
  query: string; // text after "@"
  onSelect: (participant: Participant) => void;
  onClose: () => void;
  position: { bottom: number; left: number };
};

export default function MentionPicker({ participants, query, onSelect, onClose, position }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-[#151515] border border-white/[0.08] rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={{ bottom: position.bottom, left: position.left }}
      ref={listRef}
    >
      {filtered.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onSelect(p); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
            i === selectedIndex ? "bg-[#b08d57]/[0.08]" : "hover:bg-white/[0.04]"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-white/[0.06] overflow-hidden flex items-center justify-center shrink-0 border border-white/[0.06]">
            {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-[#b08d57]">{p.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{p.name}</p>
            <p className="text-[10px] text-white/30 capitalize">{p.type}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
