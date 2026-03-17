import React, { useState } from "react";

export type ReactionType = 'like' | 'heart' | 'laugh' | 'fire' | 'applause' | 'smile';

export const SUPPORTED_REACTIONS: { type: ReactionType; label: string; emoji: string }[] = [
  { type: 'smile', label: 'Smile', emoji: '😊' },
  { type: 'like', label: 'Like', emoji: '👍' },
  { type: 'heart', label: 'Love', emoji: '❤️' },
  { type: 'laugh', label: 'Haha', emoji: '😂' },
  { type: 'fire', label: 'Fire', emoji: '🔥' },
  { type: 'applause', label: 'Applause', emoji: '👏' }
];

interface ReactionIconProps {
  type: ReactionType | string;
  size?: number; // Size doesn't map perfectly to font-size but we can use it proportionally
  className?: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  animateOnClick?: boolean;
  showTooltip?: boolean;
}

export function ReactionIcon({ type, size = 16, className = "", active = false, onClick, title, animateOnClick = true, showTooltip = true }: ReactionIconProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Fallbacks for mapping existing string emojis to our standard system
  let mappedType = type as ReactionType;
  if (type === '👍' || type === 'like') mappedType = 'like';
  if (type === '❤️' || type === '❤' || type === 'heart') mappedType = 'heart';
  if (type === '😂' || type === '🤣' || type === 'laugh') mappedType = 'laugh';
  if (type === '😊' || type === 'smile') mappedType = 'smile';
  if (type === '🔥' || type === 'fire') mappedType = 'fire';
  if (type === '👏' || type === '🎉' || type === 'applause') mappedType = 'applause';

  const handleClick = (e: React.MouseEvent) => {
    if (animateOnClick) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 450); // Match CSS animation duration
    }
    if (onClick) onClick(e);
  };

  const scaleClass = active ? "scale-[1.15] drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] opacity-100" : "opacity-80";
  const hoverAnimClass = "group-hover/reaction:scale-[1.8] group-hover/reaction:-translate-y-1.5 origin-bottom group-hover/reaction:opacity-100 group-hover/reaction:drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] z-10 group-hover/reaction:z-50";
  const animClass = isAnimating ? "animate-pop-bounce" : "";
  const baseClasses = `relative inline-flex items-center justify-center group/reaction ${className}`;

  const renderIcon = () => {
    const defaultEmoji = '👍';
    const foundReaction = SUPPORTED_REACTIONS.find(r => r.type === mappedType);
    return {
      emoji: foundReaction ? foundReaction.emoji : defaultEmoji,
      label: foundReaction ? foundReaction.label : 'Like'
    };
  };

  const { emoji, label } = renderIcon();

  return (
    <span 
      onClick={handleClick}
      className={`inline-flex cursor-pointer select-none leading-none ${baseClasses}`}
      style={{ fontSize: `${size}px` }}
    >
      <span className={`relative transition-all duration-300 ease-out flex items-center justify-center transform ${scaleClass} ${hoverAnimClass} ${animClass}`}>
        {emoji}
      </span>
      
      {/* LinkedIn-style Gorgeous Tooltip */}
      {showTooltip && (
        <div 
          className="absolute -top-[1.75rem] left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover/reaction:opacity-100 transition-all duration-200 delay-100 scale-75 group-hover/reaction:scale-100 whitespace-nowrap pointer-events-none shadow-xl z-50 flex items-center justify-center pt-1.5"
          style={{ fontSize: '0.6rem' }}
        >
           {title || label}
        </div>
      )}
    </span>
  );
}
