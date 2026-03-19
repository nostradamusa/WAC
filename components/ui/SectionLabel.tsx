import Link from "next/link";

type SectionLabelProps = {
  label: string;
  variant?: "featured" | "standard";
  action?: { label: string; href: string };
  className?: string;
};

/**
 * Canonical cross-page section label.
 *
 * Visual: [2px gold bar] LABEL TEXT              View all →
 *
 * - variant="featured"  → higher contrast, full-opacity bar. Use once per page
 *                         for the top personalized/recommended section only.
 * - variant="standard"  → reduced contrast. Use for all secondary sections.
 * - action              → optional "View all" link, right-aligned.
 */
export default function SectionLabel({
  label,
  variant = "standard",
  action,
  className = "",
}: SectionLabelProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2.5">
        {/* 2px gold vertical bar */}
        <span
          className={`inline-block w-[2px] h-[14px] rounded-full bg-[#D4AF37] shrink-0 ${
            variant === "featured" ? "opacity-90" : "opacity-55"
          }`}
        />
        <span
          className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${
            variant === "featured" ? "text-white/70" : "text-white/45"
          }`}
        >
          {label}
        </span>
      </div>

      {action && (
        <Link
          href={action.href}
          className="text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
