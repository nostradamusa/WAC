import React from "react";

type VerifiedBadgeProps = {
  className?: string;
  withLabel?: boolean;
  type?: "person" | "business" | "organization";
};

export default function VerifiedBadge({
  className = "",
  withLabel = false,
  type = "person",
}: VerifiedBadgeProps) {
  const getColor = () => {
    switch (type) {
      case "business":
        return "#3b82f6"; // blue-500
      case "organization":
        return "#10b981"; // emerald-500
      case "person":
      default:
        return "var(--accent)"; // gold
    }
  };

  const color = getColor();
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="WAC Verified"
    >
      <svg
        className="shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "1.25em", height: "1.25em" }}
      >
        {/* Elegant Decagon Outer Edge */}
        <path
          d="M12 1L8.5 2.5L4.5 3.5L3.5 7.5L2.5 11L3.5 15.5L4.5 19.5L8.5 20.5L12 22L15.5 20.5L19.5 19.5L20.5 15.5L21.5 11L20.5 7.5L19.5 3.5L15.5 2.5Z"
          fill={color}
          fillOpacity="0.15"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Inner Premium Checkmark */}
        <path
          d="m8.5 12.5 2.5 2.5 4.5-5.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel && (
        <span
          className="text-[10px] font-bold uppercase tracking-widest pt-[1px]"
          style={{ color }}
        >
          Verified
        </span>
      )}
    </div>
  );
}
