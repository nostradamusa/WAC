import React from 'react';
import { Star } from 'lucide-react';

interface WacRatingBadgeProps {
  rating: number;
  reviewsCount: number;
  onClick?: () => void;
  className?: string;
}

export default function WacRatingBadge({ rating, reviewsCount, onClick, className = '' }: WacRatingBadgeProps) {
  const formattedRating = Number(rating).toFixed(1);

  if (reviewsCount === 0) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 bg-white/5 hover:bg-[var(--accent)]/10 border border-white/10 hover:border-[var(--accent)]/50 rounded-full px-3 py-1.5 transition-all duration-300 group ${className}`}
        title="Be the first to leave a WAC Review"
      >
        <div className="flex items-center gap-1.5 text-white/60 group-hover:text-[var(--accent)] transition-colors">
          <Star size={14} className="opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide">Leave the first review</span>
        </div>
        <div className="w-4 h-4 rounded-full bg-white/10 group-hover:bg-[var(--accent)] flex items-center justify-center p-0.5 ml-1 overflow-hidden shrink-0 text-white transition-colors">
          <span className="text-[9px] font-black uppercase tracking-tighter leading-none">WAC</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/20 hover:border-[var(--accent)]/50 rounded-full px-2.5 py-1 transition-all duration-200 group ${className}`}
      title="WAC Review Rating"
    >
      <div className="flex items-center gap-0.5 text-[var(--accent)]">
        <span className="font-bold text-sm tracking-tight">{formattedRating}</span>
        <Star size={14} fill="currentColor" className="opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
      </div>
      <div className="w-px h-3 bg-[var(--accent)]/20 mx-0.5"></div>
      <span className="text-xs font-medium text-[var(--accent)] opacity-80 group-hover:opacity-100 transition-opacity">
        {reviewsCount.toLocaleString()} {reviewsCount === 1 ? 'review' : 'reviews'}
      </span>
      <div className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center p-0.5 ml-1 overflow-hidden shrink-0 text-white">
        <span className="text-[9px] font-black uppercase tracking-tighter leading-none">WAC</span>
      </div>
    </button>
  );
}
