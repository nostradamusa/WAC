"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  BedDouble, Bath, Car, Maximize, LandPlot, CalendarDays,
  Armchair, Wrench, MapPin, Mail, Phone, ExternalLink,
  MessageSquare, ChevronLeft, Home, Clock, Shield, X,
  ChevronRight as ChevRight, Globe,
} from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import type { EnrichedProperty } from "@/lib/types/property-directory";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function typeLabel(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// ── Spec Item ─────────────────────────────────────────────────────────────────

function Spec({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 text-white/40">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-bold text-white/85">{value}</p>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── Gallery with Lightbox ─────────────────────────────────────────────────────

function PropertyGallery({ images }: { images: { url: string; media_type: string }[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  const showCount = images.length;

  return (
    <>
      {/* ── Grid Gallery ──────────────────────────────────────────── */}
      {showCount === 1 ? (
        <div
          className="w-full rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06]"
          style={{ height: "clamp(200px, 30vw, 360px)" }}
          onClick={() => setLightboxIdx(0)}
        >
          <img src={images[0].url} alt="Property" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
        </div>
      ) : showCount === 2 ? (
        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
          {images.slice(0, 2).map((img, i) => (
            <div
              key={i}
              className="cursor-pointer border border-white/[0.06] overflow-hidden"
              style={{ height: "clamp(180px, 25vw, 300px)" }}
              onClick={() => setLightboxIdx(i)}
            >
              <img src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
            </div>
          ))}
        </div>
      ) : (
        /* 3+ images: 1 large left + 2 stacked right + overflow indicator */
        <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-2 rounded-2xl overflow-hidden">
          <div
            className="cursor-pointer border border-white/[0.06] overflow-hidden"
            style={{ height: "clamp(220px, 30vw, 400px)" }}
            onClick={() => setLightboxIdx(0)}
          >
            <img src={images[0].url} alt="Main" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
          </div>
          <div className="grid grid-rows-2 gap-2">
            <div
              className="cursor-pointer border border-white/[0.06] overflow-hidden"
              onClick={() => setLightboxIdx(1)}
            >
              <img src={images[1].url} alt="Photo 2" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
            </div>
            <div
              className="relative cursor-pointer border border-white/[0.06] overflow-hidden"
              onClick={() => setLightboxIdx(2)}
            >
              <img src={images[2].url} alt="Photo 3" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
              {showCount > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{showCount - 3} more</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Overlay ───────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors z-10"
          >
            <X size={18} />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[12px] font-semibold text-white/40 z-10">
            {lightboxIdx + 1} / {images.length}
          </div>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Next */}
          {lightboxIdx < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors z-10"
            >
              <ChevRight size={20} />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIdx].url}
            alt={`Photo ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}

// ── Contact CTA ───────────────────────────────────────────────────────────────

function ContactCTA({ property, fullWidth }: { property: EnrichedProperty; fullWidth?: boolean }) {
  const mode = property.contact_mode;
  const baseCls = `flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 ${fullWidth ? "w-full" : ""}`;
  const primaryCls = `${baseCls} bg-[#10b981] text-black hover:bg-[#34d399] shadow-lg shadow-[#10b981]/20`;

  if (mode === "external_link" && property.external_url) {
    return (
      <a href={property.external_url} target="_blank" rel="noopener noreferrer" className={primaryCls}>
        <ExternalLink size={14} /> Visit Listing
      </a>
    );
  }

  if (mode === "phone" && property.contact_phone) {
    return (
      <a href={`tel:${property.contact_phone}`} className={primaryCls}>
        <Phone size={14} /> Call {property.contact_phone}
      </a>
    );
  }

  if (mode === "email" && property.contact_email) {
    return (
      <a href={`mailto:${property.contact_email}?subject=${encodeURIComponent(`Inquiry: ${property.title}`)}`} className={primaryCls}>
        <Mail size={14} /> Email Agent
      </a>
    );
  }

  const ownerHref = property.owner?.username ? `/people/${property.owner.username}` : "#";
  return (
    <Link href={ownerHref} className={primaryCls}>
      <MessageSquare size={14} /> Message
    </Link>
  );
}

// ── Location Map Snippet ──────────────────────────────────────────────────────

function LocationBlock({ property }: { property: EnrichedProperty }) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const hasCoords = property.latitude && property.longitude &&
    Math.abs(property.latitude) > 0.001 && Math.abs(property.longitude) > 0.001;

  const locationParts = [property.city, property.state_region, property.country].filter(Boolean);

  // Mapbox Static Images API — dark style, no marker for privacy
  const staticMapUrl = hasCoords && mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+10b981(${property.longitude},${property.latitude})/${property.longitude},${property.latitude},12,0/600x300@2x?access_token=${mapboxToken}`
    : null;

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-4">
        Location
      </h2>

      <div className="wac-card overflow-hidden">
        {/* Map image */}
        {staticMapUrl ? (
          <div className="w-full h-[200px] bg-white/[0.02]">
            <img
              src={staticMapUrl}
              alt={`Map showing ${property.city}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-[140px] bg-white/[0.02] flex items-center justify-center">
            <MapPin size={24} className="text-white/10" />
          </div>
        )}

        {/* Location text + Map CTA */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-[#10b981]/60 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-white/75">
                {locationParts.join(", ")}
              </p>
              {property.geo_precision && property.geo_precision !== "exact" && (
                <p className="text-[10px] text-white/25 mt-1">
                  Location shown is approximate ({property.geo_precision}-level precision)
                </p>
              )}
            </div>
          </div>

          {/* View on Diaspora Map CTA */}
          <Link
            href={`/directory?view=map&scope=properties&focus=prop-${property.id}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold text-[#10b981]/70 bg-[#10b981]/[0.06] border border-[#10b981]/12 hover:bg-[#10b981]/[0.10] hover:text-[#10b981] transition-all"
          >
            <Globe size={13} />
            View on Diaspora Map · See Nearby Properties
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Trust Indicators ──────────────────────────────────────────────────────────

function TrustBar({ property }: { property: EnrichedProperty }) {
  const indicators: { icon: React.ReactNode; label: string }[] = [];

  if (property.is_verified) {
    indicators.push({ icon: <Shield size={11} />, label: "Verified listing" });
  }
  if (property.created_at) {
    indicators.push({ icon: <Clock size={11} />, label: `Listed ${timeAgo(property.created_at)}` });
  }
  if (property.status === "active") {
    indicators.push({ icon: <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />, label: "Active" });
  }

  if (indicators.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1">
      {indicators.map((ind, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
          {ind.icon}
          {ind.label}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PropertyDetail({
  property,
}: {
  property: EnrichedProperty;
}) {
  const coverImage =
    property.media?.find(m => m.is_cover)?.url ||
    property.media?.[0]?.url ||
    null;

  const allImages = (property.media || [])
    .sort((a, b) => a.display_order - b.display_order);

  const displayPrice = property.is_price_public
    ? formatPrice(property.price_amount, property.price_currency)
    : "Price on Request";

  const owner = property.owner;
  const business = property.business;
  const features = property.features || [];

  // Build specs array — only non-null
  const specs: { icon: React.ReactNode; label: string; value: string | number }[] = [];
  if (property.bedrooms)
    specs.push({ icon: <BedDouble size={16} />, label: "Bedrooms", value: property.bedrooms });
  if (property.bathrooms)
    specs.push({ icon: <Bath size={16} />, label: "Bathrooms", value: property.bathrooms });
  if (property.parking_spaces)
    specs.push({ icon: <Car size={16} />, label: "Parking", value: property.parking_spaces });
  if (property.square_meters)
    specs.push({ icon: <Maximize size={16} />, label: "Area (sqm)", value: `${property.square_meters}` });
  if (property.lot_size_sqm)
    specs.push({ icon: <LandPlot size={16} />, label: "Lot Size (sqm)", value: `${property.lot_size_sqm}` });
  if (property.year_built)
    specs.push({ icon: <CalendarDays size={16} />, label: "Year Built", value: property.year_built });
  if (property.furnished_status)
    specs.push({ icon: <Armchair size={16} />, label: "Furnished", value: typeLabel(property.furnished_status) });
  if (property.condition_status)
    specs.push({ icon: <Wrench size={16} />, label: "Condition", value: typeLabel(property.condition_status) });

  const locationParts = [property.city, property.state_region, property.country].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">

      {/* ── Back Nav ──────────────────────────────────────────────── */}
      <div className="mb-5">
        <Link
          href="/directory?scope=properties"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/30 hover:text-white/60 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Properties
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION                                                */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-5" style={{ height: "clamp(300px, 42vw, 520px)" }}>
        {coverImage ? (
          <img src={coverImage} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
            <Home size={56} className="text-white/8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

        {/* Hero overlay */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70 bg-white/[0.12] backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/[0.10]">
              {typeLabel(property.listing_type)}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#10b981] bg-[#10b981]/[0.12] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#10b981]/20">
              {typeLabel(property.property_type)}
            </span>
            {property.is_verified && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#b08d57] bg-[#b08d57]/[0.12] backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#b08d57]/20">
                Verified
              </span>
            )}
          </div>

          {/* Price — dominant */}
          <p className="text-[32px] sm:text-[42px] font-bold text-white leading-none tracking-tight mb-2">
            {displayPrice}
          </p>

          {/* Title */}
          <h1 className="text-[17px] sm:text-[22px] font-medium text-white/85 leading-snug mb-3 max-w-2xl">
            {property.title}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-2 text-white/50">
            <MapPin size={14} strokeWidth={2} />
            <span className="text-[14px] font-medium">
              {locationParts.join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* ── Trust bar ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <TrustBar property={property} />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FACTS ROW — near top, fast access                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      {specs.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {specs.map(s => (
              <Spec key={s.label} {...s} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MOBILE CTA — visible on mobile only, before gallery         */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden mb-8">
        <div className="wac-card p-4 flex flex-col gap-2.5">
          <ContactCTA property={property} fullWidth />
          {owner?.username && (
            <Link
              href={`/people/${owner.username}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-[13px] font-bold text-white/70 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
            >
              View Profile
            </Link>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* GALLERY                                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {allImages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-4">
            Photos
          </h2>
          <PropertyGallery images={allImages} />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* CONTENT GRID: left (description + location) + right (contact)*/}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="space-y-10">

          {/* Description */}
          {property.description && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-4">
                About this Property
              </h2>
              <div className="text-[15px] text-white/60 leading-[1.8] whitespace-pre-line max-w-prose">
                {property.description}
              </div>
            </section>
          )}

          {/* Features */}
          {features.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/25 mb-4">
                Features &amp; Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {features.map((f: any) => {
                  const tag = typeof f === "string" ? f : f?.feature_tag || "";
                  return (
                    <span
                      key={tag}
                      className="px-3.5 py-2 rounded-xl text-[12px] font-medium bg-[#10b981]/[0.06] text-[#10b981]/75 border border-[#10b981]/12"
                    >
                      {tag.replace(/_/g, " ")}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {/* Location */}
          <LocationBlock property={property} />
        </div>

        {/* ── Right column (desktop sidebar) ───────────────────────── */}
        <div className="space-y-5 hidden lg:block">

          {/* Sticky contact sidebar */}
          <div className="sticky top-24 space-y-5">

            {/* Owner Block */}
            <div className="wac-card p-5 space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/22">
                Listed By
              </h3>

              <div className="flex items-center gap-3">
                {owner?.avatar_url ? (
                  <img
                    src={owner.avatar_url}
                    alt={owner.full_name}
                    className="w-13 h-13 rounded-full object-cover border-2 border-white/[0.08]"
                    style={{ width: 52, height: 52 }}
                  />
                ) : (
                  <div
                    className="rounded-full bg-[#b08d57]/15 flex items-center justify-center border-2 border-white/[0.08]"
                    style={{ width: 52, height: 52 }}
                  >
                    <span className="text-base font-bold text-[#b08d57]/70">
                      {(owner?.full_name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-semibold text-white/90 truncate">
                      {owner?.full_name || "Owner"}
                    </p>
                    {owner?.is_verified && <VerifiedBadge size="sm" />}
                  </div>
                  {(owner as any)?.headline && (
                    <p className="text-[11px] text-white/35 truncate mt-0.5">
                      {(owner as any).headline}
                    </p>
                  )}
                  {((owner as any)?.city || (owner as any)?.country) && (
                    <p className="text-[10px] text-white/22 truncate mt-0.5">
                      <MapPin size={9} className="inline mr-0.5 -mt-px" />
                      {[(owner as any)?.city, (owner as any)?.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.05]">
                <ContactCTA property={property} fullWidth />
                {owner?.username && (
                  <Link
                    href={`/people/${owner.username}`}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-[13px] font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:text-white/80 transition-all"
                  >
                    View Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Business Representation Block */}
            {business && property.show_business_profile && (
              <div className="wac-card p-5 space-y-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/22">
                  Represented By
                </h3>

                <div className="flex items-center gap-3">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/[0.08]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center border border-white/[0.08]">
                      <span className="text-xs font-bold text-blue-400/70">
                        {business.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-white/80 truncate">
                        {business.name}
                      </p>
                      {business.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    {(business as any)?.industry_name && (
                      <p className="text-[10px] text-white/30 truncate mt-0.5">
                        {(business as any).industry_name}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/businesses/${business.slug}`}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-[13px] font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:text-white/80 transition-all"
                >
                  View Business
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* MOBILE: Owner + Business blocks (below content on mobile)   */}
      {/* ════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden mt-10 space-y-5">
        {/* Owner Block */}
        <div className="wac-card p-5 space-y-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/22">
            Listed By
          </h3>
          <div className="flex items-center gap-3">
            {owner?.avatar_url ? (
              <img src={owner.avatar_url} alt={owner.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-white/[0.08]" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#b08d57]/15 flex items-center justify-center border-2 border-white/[0.08]">
                <span className="text-sm font-bold text-[#b08d57]/70">
                  {(owner?.full_name || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-semibold text-white/85 truncate">{owner?.full_name || "Owner"}</p>
                {owner?.is_verified && <VerifiedBadge size="sm" />}
              </div>
              {(owner as any)?.headline && (
                <p className="text-[11px] text-white/35 truncate mt-0.5">{(owner as any).headline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business on mobile */}
        {business && property.show_business_profile && (
          <div className="wac-card p-5 space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/22">
              Represented By
            </h3>
            <div className="flex items-center gap-3">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-11 h-11 rounded-xl object-cover border border-white/[0.08]" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center border border-white/[0.08]">
                  <span className="text-xs font-bold text-blue-400/70">{business.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/80 truncate">{business.name}</p>
                {(business as any)?.industry_name && (
                  <p className="text-[10px] text-white/30 truncate mt-0.5">{(business as any).industry_name}</p>
                )}
              </div>
            </div>
            <Link
              href={`/businesses/${business.slug}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-[13px] font-bold text-white/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all"
            >
              View Business
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
