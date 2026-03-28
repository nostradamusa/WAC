"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTierDef, UtilityTier } from "@/lib/constants/utilityConstants";
import { Sparkles } from "lucide-react";

// ─── Community Utility Badge ─────────────────────────────────────────────────
// Shows the entity's Community Utility tier badge.
// Only renders when a real score record exists — never shows fake data.
// If no record exists, renders nothing.

interface Props {
  entityType: "person" | "business" | "organization";
  entityId: string;
  /** Compact mode shows just the tier label; full mode shows description */
  variant?: "compact" | "full";
}

interface UtilityData {
  tier: string;
  utility_score: number;
  asks_answered: number;
  helpful_responses: number;
}

export default function CommunityUtilityBadge({ entityType, entityId, variant = "compact" }: Props) {
  const [data, setData] = useState<UtilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetch() {
      const { data: row } = await supabase
        .from("community_utility_scores")
        .select("tier, utility_score, asks_answered, helpful_responses")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .single();

      if (mounted) {
        setData(row ?? null);
        setLoading(false);
      }
    }
    fetch();
    return () => { mounted = false; };
  }, [entityType, entityId]);

  // Don't render anything while loading or if no record exists
  if (loading || !data) return null;

  const tier: UtilityTier = getTierDef(data.tier);

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tier.badgeCls}`}>
        <Sparkles size={9} strokeWidth={2} />
        {tier.label}
      </span>
    );
  }

  // Full variant — shows breakdown
  return (
    <div className={`rounded-xl border p-3 ${tier.badgeCls.replace(/text-\S+/, "").trim()}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} strokeWidth={2} className={tier.badgeCls.split(" ")[0]} />
        <span className={`text-xs font-bold ${tier.badgeCls.split(" ")[0]}`}>
          {tier.label}
        </span>
        <span className="text-[10px] text-white/30 ml-auto">
          Community Utility
        </span>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed">
        {tier.description}
      </p>
      {(data.asks_answered > 0 || data.helpful_responses > 0) && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-white/[0.06]">
          {data.asks_answered > 0 && (
            <span className="text-[10px] text-white/30">
              {data.asks_answered} asks answered
            </span>
          )}
          {data.helpful_responses > 0 && (
            <span className="text-[10px] text-white/30">
              {data.helpful_responses} helpful responses
            </span>
          )}
        </div>
      )}
    </div>
  );
}
