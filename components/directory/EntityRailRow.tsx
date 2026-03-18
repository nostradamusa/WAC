import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  label: string;
  viewAllHref?: string;
  children: ReactNode;
};

export default function EntityRailRow({ label, viewAllHref, children }: Props) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">{label}</p>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-[10px] text-white/25 hover:text-white/50 transition-colors"
          >
            View all <ChevronRight size={10} />
          </Link>
        )}
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {children}
      </div>
    </section>
  );
}
