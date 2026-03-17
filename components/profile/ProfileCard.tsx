import React from "react";
import { LucideIcon } from "lucide-react";

/**
 * STRICT USAGE RULE: 
 * Any new section added to the profile MUST use this ProfileCard component. 
 * Do not redesign sections individually. Do not use custom wrappers or alternate grid blocks.
 * Treat this like a Notion Block or Stripe Dashboard component—reused everywhere.
 * NO EXCEPTIONS.
 */
type ProfileCardProps = {
  id?: string;
  style?: React.CSSProperties;
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
  zIndex?: number;
  isHighlighted?: boolean;
};

export default function ProfileCard({
  id,
  style,
  title,
  description,
  icon: Icon,
  children,
  zIndex = 10,
  isHighlighted = false,
}: ProfileCardProps) {
  return (
    <section
      id={id}
      style={{ ...style, zIndex }}
      className={`wac-card p-5 sm:p-6 md:p-8 border-t-4 border-t-[#D4AF37]/30 relative transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl ${
        isHighlighted ? "scale-[1.01] shadow-[0_0_0_2px_var(--accent),0_0_40px_rgba(212,175,55,0.2)]" : ""
      }`}
    >
      <h2 className="text-xl font-bold mb-2 flex items-center gap-3 text-white">
        <Icon size={20} className="text-[#D4AF37]" /> {title}
      </h2>
      <p className="text-sm opacity-70 mb-5 pb-5 border-b border-white/10">
        {description}
      </p>
      {children}
    </section>
  );
}
