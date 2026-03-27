import Image from "next/image";

// Single place to adjust badge sizes across the whole app.
const SIZE_MAP = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
} as const;

type VerifiedBadgeSize = keyof typeof SIZE_MAP;

type VerifiedBadgeProps = {
  size?: VerifiedBadgeSize;
  className?: string;
  withLabel?: boolean;
};

export default function VerifiedBadge({
  size = "md",
  className = "",
  withLabel = false,
}: VerifiedBadgeProps) {
  const px = SIZE_MAP[size];

  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ml-1 ${className}`}
      title="WAC Verified"
    >
      {/*
        next/image (without unoptimized) automatically:
        - resizes the 1.86 MB source PNG to the exact px dimensions
        - converts to WebP
        - caches at /_next/image — all badges on a page share one tiny cached response
        This avoids downloading the full PNG per card.
      */}
      <Image
        src="/badges/verified-eagle.png"
        alt="Verified"
        width={px}
        height={px}
      />
      {withLabel && (
        <span className="text-[10px] font-bold uppercase tracking-widest pt-[1px] text-[#C8A030]">
          Verified
        </span>
      )}
    </span>
  );
}
