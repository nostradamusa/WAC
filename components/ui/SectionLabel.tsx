import Link from "next/link";

type SectionLabelProps = {
  label:    string;
  variant?: "featured" | "standard";
  /** href navigates; onClick executes in-page. Provide one or the other. */
  action?:  { label: string; href?: string; onClick?: () => void };
  className?: string;
};

/**
 * Canonical cross-page section label.
 *
 * Visual: [2px gold bar] LABEL TEXT              action →
 *
 * - variant="featured"  → higher contrast, full-opacity bar. Use once per page.
 * - variant="standard"  → reduced contrast. Use for all secondary sections.
 * - action.href         → renders a <Link>
 * - action.onClick      → renders a <button> (for in-page filter clearing etc.)
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
        <span
          className={`inline-block w-[2px] h-[14px] rounded-full bg-[#b08d57] shrink-0 ${
            variant === "featured" ? "opacity-90" : "opacity-55"
          }`}
        />
        <span
          className={`text-[11px] font-semibold tracking-[0.14em] uppercase ${
            variant === "featured" ? "text-white/70" : "text-white/45"
          }`}
          suppressHydrationWarning
        >
          {label}
        </span>
      </div>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
            suppressHydrationWarning
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
            suppressHydrationWarning
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
