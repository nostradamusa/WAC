"use client";

import { memo } from "react";
import Link from "next/link";
import { BedDouble, Bath, Maximize, MapPin, CheckCircle2 } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { EnrichedProperty } from "@/lib/types/property-directory";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PropertyCardProps = {
  property: EnrichedProperty;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Component ─────────────────────────────────────────────────────────────────

const PropertyCard = memo(function PropertyCard({
  property,
  onHoverStart,
  onHoverEnd,
}: PropertyCardProps) {
  
  // Find cover image or use the first available, or fallback
  const coverImage = property.media?.find(m => m.is_cover)?.url 
    || property.media?.[0]?.url 
    || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; // Fallback placeholder

  const displayPrice = property.is_price_public 
    ? formatPrice(property.price_amount, property.price_currency)
    : "Price on Request";

  return (
    <Link
      href={`/properties/${property.slug}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className="wac-card group overflow-hidden p-0 flex flex-col relative active:scale-[0.98] hover:border-white/[0.10] transition-all duration-150 h-full min-h-[260px]"
    >
      {/* ── 16:9 Hero Image ───────────────────────────────────────── */}
      <div className="relative aspect-[16/9] w-full shrink-0 bg-slate-800 overflow-hidden">
        <img
          src={coverImage}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Status Badge */}
        {property.status !== "active" && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] uppercase tracking-wider font-bold text-white/90">
            {property.status}
          </div>
        )}

        {/* Property Type Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-[#1A1A1A]/80 backdrop-blur-md rounded border border-white/5 text-[9px] uppercase tracking-[0.08em] font-medium text-white/80">
          {property.listing_type.replace('_', ' ')} · {property.property_type.replace('_', ' ')}
        </div>

        {/* Listed By Snippet */}
        {(property.show_owner_profile || property.show_business_profile) && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 p-1 pr-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            {property.business?.logo_url ? (
               <img src={property.business.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : property.owner.avatar_url ? (
               <img src={property.owner.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
               <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                 <span className="text-[9px] uppercase text-white/60">{property.owner.full_name.charAt(0)}</span>
               </div>
            )}
            <span className="text-[9px] font-medium text-white/90 truncate max-w-[100px]">
              {property.business?.name || property.owner.full_name}
            </span>
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        
        {/* Price & Title */}
        <div className="mb-2">
          <p className="text-[16px] font-bold text-white leading-tight mb-0.5">
            {displayPrice}
          </p>
          <p className="text-[12px] text-white/70 line-clamp-1 leading-snug" title={property.title}>
            {property.title}
          </p>
        </div>

        {/* Location + See on Map */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={11} className="text-[#b08d57]/60 shrink-0" strokeWidth={2} />
          <p className="text-[11px] font-medium text-white/40 truncate flex-1">
            {property.city}, {property.country}
          </p>
          <span
            role="link"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/directory?view=map&scope=properties&focus=prop-${property.id}`;
            }}
            className="shrink-0 text-[10px] font-medium text-white/20 hover:text-[#b08d57]/70 transition-colors cursor-pointer hidden sm:inline"
          >
            See on Map
          </span>
        </div>

        {/* Push everything below to bottom */}
        <div className="flex-1" />

        {/* Feature Strip */}
        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3 mt-1">
          {property.bedrooms ? (
            <div className="flex items-center gap-1.5 text-white/50">
              <BedDouble size={12} strokeWidth={2} />
              <span className="text-[11px] font-medium">{property.bedrooms} Bed</span>
            </div>
          ) : <div />}
          
          {property.bathrooms ? (
            <div className="flex items-center gap-1.5 text-white/50 justify-center border-x border-white/[0.05]">
              <Bath size={12} strokeWidth={2} />
              <span className="text-[11px] font-medium">{property.bathrooms} Bath</span>
            </div>
          ) : <div className="border-x border-white/[0.05]" />}

          {property.square_meters ? (
            <div className="flex items-center gap-1.5 text-white/50 justify-end">
              <Maximize size={12} strokeWidth={2} />
              <span className="text-[11px] font-medium">{property.square_meters} sqm</span>
            </div>
          ) : <div />}
        </div>

      </div>
    </Link>
  );
});

export default PropertyCard;
