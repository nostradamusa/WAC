"use client";

import { useState, useEffect } from "react";
import { Check, Trash2 } from "lucide-react";

const CHECKLIST_KEY = "wac_travel_checklist_v1";

export default function TravelChecklist() {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHECKLIST_KEY);
      if (stored) setCheckedItems(JSON.parse(stored));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checkedItems));
  }, [checkedItems, mounted]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const resetList = () => {
    if (
      confirm("Reset packing checklist? (No judgment. Packing is emotional.)")
    ) {
      setCheckedItems([]);
    }
  };

  const ChecklistItem = ({
    id,
    label,
    sub,
  }: {
    id: string;
    label: string;
    sub?: string;
  }) => {
    const isChecked = checkedItems.includes(id);
    return (
      <div
        onClick={() => toggleCheck(id)}
        className={`flex gap-4 p-4 border-b border-[var(--foreground)]/10 cursor-pointer transition-colors hover:bg-[var(--foreground)]/5 ${isChecked ? "opacity-50" : ""}`}
      >
        <div
          className={`w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-colors mt-0.5 ${isChecked ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--foreground)]/20"}`}
        >
          {isChecked && <Check className="w-4 h-4" />}
        </div>
        <div>
          <div
            className={`font-bold text-sm ${isChecked ? "line-through" : ""}`}
          >
            {label}
          </div>
          {sub && (
            <div className="text-xs opacity-70 mt-1 leading-relaxed">{sub}</div>
          )}
        </div>
      </div>
    );
  };

  if (!mounted) return null; // Avoid hydration mismatch on localstorage

  return (
    <section
      id="checklist"
      className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-xl p-6 md:p-12 mb-24"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="text-[var(--accent)] text-xs font-bold tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-[var(--accent)]"></span> Pack Smart
          </div>
          <h2 className="text-3xl font-extrabold mb-2">
            Balkan Summer Checklist
          </h2>
          <p className="text-lg opacity-70">
            Built for a 3-week car-based trip across multiple countries. Saves
            as you click.
          </p>
        </div>
        <button
          onClick={resetList}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-[var(--accent)]"
        >
          <Trash2 className="w-4 h-4" /> Reset List
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="font-serif text-xl font-bold mb-4 border-b border-[var(--foreground)]/20 pb-2">
            📋 Documents & Money
          </h3>
          <div className="mb-8 border-t border-[var(--foreground)]/10">
            <ChecklistItem
              id="doc-1"
              label="US Passport (valid 6+ months)"
              sub="Required at all border crossings."
            />
            <ChecklistItem
              id="doc-2"
              label="Driver's License (US)"
              sub="Required for car rental and driving."
            />
            <ChecklistItem id="doc-3" label="Travel insurance documents" />
            <ChecklistItem
              id="doc-4"
              label="Cash in EUR (€300–500 minimum)"
              sub="Kosovo & Montenegro use Euro. Albania accepts it too."
            />
            <ChecklistItem
              id="doc-5"
              label="Debit card with no foreign transaction fees"
              sub="Schwab, Wise, or Capital One."
            />
            <ChecklistItem id="doc-6" label="Emergency contacts list" />
          </div>

          <h3 className="font-serif text-xl font-bold mb-4 border-b border-[var(--foreground)]/20 pb-2">
            🏥 Health & Safety
          </h3>
          <div className="mb-8 border-t border-[var(--foreground)]/10">
            <ChecklistItem
              id="med-1"
              label="90-day prescription supply"
              sub="Carry in original labeled bottles."
            />
            <ChecklistItem
              id="med-2"
              label="Basic first aid kit"
              sub="Ibuprofen, antidiarrheal, bandages."
            />
            <ChecklistItem
              id="med-3"
              label="High SPF sunscreen (50+)"
              sub="Expensive and hard to find locally in your brand."
            />
            <ChecklistItem
              id="med-4"
              label="Electrolyte packets"
              sub="You will sweat more than you think in July/August heat."
            />
          </div>
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold mb-4 border-b border-[var(--foreground)]/20 pb-2">
            👕 Clothing
          </h3>
          <div className="mb-8 border-t border-[var(--foreground)]/10">
            <ChecklistItem
              id="clo-1"
              label="Lightweight clothes (linen/wicking)"
              sub="Heavy cotton is miserable in Balkan July heat."
            />
            <ChecklistItem
              id="clo-2"
              label="Swimwear (multiple sets)"
              sub="You'll use them daily."
            />
            <ChecklistItem
              id="clo-3"
              label="One nicer outfit"
              sub="For dinners in Tirana / Prishtina."
            />
            <ChecklistItem
              id="clo-4"
              label="Light layer / fleece"
              sub="Evenings at altitude in Theth/Valbona get cold."
            />
            <ChecklistItem
              id="clo-5"
              label="Comfortable walking shoes"
              sub="Ohrid and Berat old towns have cobblestone everywhere."
            />
            <ChecklistItem
              id="clo-6"
              label="Water shoes / sandals"
              sub="For rocky lake beaches."
            />
          </div>

          <h3 className="font-serif text-xl font-bold mb-4 border-b border-[var(--foreground)]/20 pb-2">
            📱 Technology
          </h3>
          <div className="mb-8 border-t border-[var(--foreground)]/10">
            <ChecklistItem
              id="tech-1"
              label="International eSIM installed"
              sub="Airalo / Holafly set up before you leave."
            />
            <ChecklistItem
              id="tech-2"
              label="Offline Google Maps downloaded"
              sub="Cell signal disappears in mountain passes."
            />
            <ChecklistItem id="tech-3" label="Universal EU plug adapter" />
            <ChecklistItem id="tech-4" label="Portable power bank" />
          </div>
        </div>
      </div>

      <div className="mt-8 bg-amber-500/10 border-l-4 border-amber-500 p-6 rounded">
        <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-amber-500">
          🎁 What to bring from the US as gifts
        </h4>
        <p className="text-sm opacity-80 leading-relaxed">
          Family expects you to bring things. Practical gifts land best: Tylenol
          (Panadol is the local version but Tylenol is valued), good vitamins,
          kids' snacks American brands, clothing from outlet stores, and coffee
          from Dunkin or Starbucks. Don't overthink it — showing up is the real
          gift.
        </p>
      </div>
    </section>
  );
}
