"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import MapGL, {
  Source,
  Layer,
  NavigationControl,
  Popup,
} from "react-map-gl/mapbox";
import type {
  MapRef,
  MapMouseEvent,
  LayerProps,
} from "react-map-gl/mapbox";
import type { FeatureCollection, Feature, Point } from "geojson";
import {
  Users,
  Briefcase,
  Landmark,
  MapPin,
  Globe,
  ChevronUp,
  ChevronDown,
  Home,
  Bed,
  Bath,
  ArrowRight,
} from "lucide-react";
import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EnrichedProperty } from "@/lib/types/property-directory";
import { resolveCoords, toGeoJSONCoords } from "@/lib/geo/coordinates";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

// ── Mapbox token ──────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// ── Map style ─────────────────────────────────────────────────────────────────
// Dark 2D style — matches WAC dark UI, no terrain or 3D buildings

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

// ── Initial viewport ──────────────────────────────────────────────────────────
// Centred on the Balkans / SE Europe — primary diaspora origin

const INITIAL_VIEW = {
  longitude: 20.5,
  latitude:  42.5,
  zoom:      3.4,
};

// ── Layer definitions ─────────────────────────────────────────────────────────
// Defined outside the component — never recreated.

const CLUSTER_LAYER: LayerProps = {
  id:     "clusters",
  type:   "circle",
  filter: ["has", "point_count"],
  paint:  {
    "circle-color": [
      "step", ["get", "point_count"],
      "#b08d57",        // 1 – 9
      10, "#b08d57",    // 10 – 49
      50, "#c9a96e",    // 50+
    ],
    "circle-radius": [
      "step", ["get", "point_count"],
      20,
      10, 28,
      50, 36,
    ],
    "circle-opacity":       0.88,
    "circle-stroke-width":  1.5,
    "circle-stroke-color":  "rgba(176,141,87,0.25)",
  },
};

const CLUSTER_COUNT_LAYER: LayerProps = {
  id:     "cluster-count",
  type:   "symbol",
  filter: ["has", "point_count"],
  layout: {
    "text-field":          ["get", "point_count_abbreviated"],
    "text-font":           ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size":           13,
    "text-allow-overlap":  true,
  },
  paint:  {
    "text-color": "#1a0f00",
  },
};

const POINT_LAYER: LayerProps = {
  id:     "unclustered-point",
  type:   "circle",
  filter: ["!", ["has", "point_count"]],
  paint:  {
    "circle-radius": [
      "case",
      ["==", ["get", "geoPrecision"], "exact"],   9,
      ["==", ["get", "geoPrecision"], "city"],    8,
      6,  // country-level (lower precision = smaller dot)
    ],
    "circle-color": [
      "match", ["get", "entityKind"],
      "person",       "#b08d57",
      "business",     "#60a5fa",
      "property",     "#10b981",
      /* org default */"#34d399",
    ],
    "circle-opacity":      0.90,
    "circle-stroke-width": 1.5,
    "circle-stroke-color": "rgba(255,255,255,0.18)",
  },
};

// ── Entity feature properties ─────────────────────────────────────────────────

export type EntityKind = "person" | "business" | "organization" | "property";

type EntityProps = {
  id:           string;
  entityKind:   EntityKind;
  name:         string;
  href:         string;
  avatarUrl:    string | null;
  initials:     string;
  line2:        string | null;
  line3:        string | null;
  isVerified:   boolean;
  signalLabel:  string | null;
  signalColor:  string | null;
  geoPrecision: "exact" | "city" | "state" | "country";
  // Raw structured fields — kept for the async geocoding fallback so we can
  // upgrade state/country-precision features to city precision when the local
  // lookup table doesn't contain the city.
  rawCity:      string | null;
  rawState:     string | null;
  rawCountry:   string | null;
  // Property-specific fields for rich preview cards
  coverUrl:       string | null;
  priceLabel:     string | null;
  propertyTitle:  string | null;
  beds:           number | null;
  baths:          number | null;
  sqm:            number | null;
  listingLabel:   string | null;
};

type EntityFeature = Feature<Point, EntityProps>;
type EntityGeoJSON = FeatureCollection<Point, EntityProps>;

// ── Avatar config ─────────────────────────────────────────────────────────────

const AV: Record<EntityKind, { bg: string; text: string; accent: string }> = {
  person:       { bg: "bg-[#b08d57]/15",   text: "text-[#b08d57]/70",    accent: "text-[#b08d57]"  },
  business:     { bg: "bg-blue-500/15",    text: "text-blue-300/70",     accent: "text-blue-400"   },
  organization: { bg: "bg-emerald-500/15", text: "text-emerald-300/70",  accent: "text-emerald-400"},
  property:     { bg: "bg-[#10b981]/15",   text: "text-[#10b981]/70",    accent: "text-[#10b981]"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkInitials(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}
function abbrev(c: string | null | undefined) {
  const n = (c || "").toLowerCase().trim();
  if (n === "united states" || n === "usa") return "USA";
  if (n === "united kingdom" || n === "uk") return "UK";
  return c || "";
}
function loc(...p: (string | null | undefined)[]) {
  return p.map(x => x?.trim()).filter(Boolean).join(", ");
}

// ── Entity → GeoJSON feature adapters ────────────────────────────────────────

function personToFeature(p: EnrichedDirectoryPerson): EntityFeature | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = p as any;
  const name = p.full_name || p.username || "Member";
  const serverGeo = d._geo_lat != null ? { lat: d._geo_lat, lng: d._geo_lng, precision: d._geo_precision || "city" as const } : null;
  const coords = resolveCoords(d.latitude, d.longitude, p.city, p.state, p.country, name, serverGeo);
  if (!coords) return null;
  let signalLabel: string | null = null;
  let signalColor: string | null = null;
  if (d.open_to_work)        { signalLabel = "Open to Work"; signalColor = "bg-green-500/10 text-green-400"; }
  else if (d.open_to_hire)   { signalLabel = "Hiring";       signalColor = "bg-purple-500/10 text-purple-400"; }
  else if (d.open_to_mentor) { signalLabel = "Mentoring";    signalColor = "bg-blue-500/10 text-blue-400"; }

  return {
    type:     "Feature",
    geometry: { type: "Point", coordinates: toGeoJSONCoords(coords) },
    properties: {
      id:           `person-${p.id || p.username || name}`,
      entityKind:   "person",
      name,
      href:         p.username ? `/people/${p.username}` : "#",
      avatarUrl:    p.avatar_url ?? null,
      initials:     mkInitials(name),
      line2:        p.headline?.trim() || p.profession_name?.trim() || null,
      line3:        loc(p.city, p.state, abbrev(p.country)) || null,
      isVerified:   p.is_verified ?? false,
      signalLabel,
      signalColor,
      geoPrecision: coords.precision,
      rawCity:      p.city?.trim() || null,
      rawState:     p.state?.trim() || null,
      rawCountry:   p.country?.trim() || null,
      coverUrl: null, priceLabel: null, propertyTitle: null, beds: null, baths: null, sqm: null, listingLabel: null,
    },
  };
}

function bizToFeature(b: BusinessProfile): EntityFeature | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = b as any;
  const serverGeo = d._geo_lat != null ? { lat: d._geo_lat, lng: d._geo_lng, precision: d._geo_precision || "city" as const } : null;
  const coords = resolveCoords(d.latitude, d.longitude, b.city, b.state, b.country, b.name, serverGeo);
  if (!coords) return null;

  const hiring = b.hiring_status === "hiring" || b.hiring_status === "actively_hiring";

  return {
    type:     "Feature",
    geometry: { type: "Point", coordinates: toGeoJSONCoords(coords) },
    properties: {
      id:           `biz-${b.slug}`,
      entityKind:   "business",
      name:         b.name,
      href:         `/businesses/${b.slug}`,
      avatarUrl:    b.logo_url ?? null,
      initials:     mkInitials(b.name),
      line2:        b.industry_name?.trim() || b.business_type?.trim() || null,
      line3:        loc(b.city, b.state, abbrev(b.country)) || null,
      isVerified:   b.is_verified ?? false,
      signalLabel:  hiring ? "Hiring" : null,
      signalColor:  hiring ? "bg-green-500/10 text-green-400" : null,
      geoPrecision: coords.precision,
      rawCity:      b.city?.trim() || null,
      rawState:     b.state?.trim() || null,
      rawCountry:   b.country?.trim() || null,
      coverUrl: null, priceLabel: null, propertyTitle: null, beds: null, baths: null, sqm: null, listingLabel: null,
    },
  };
}

function orgToFeature(o: OrganizationDirectoryEntry): EntityFeature | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = o as any;
  const serverGeo = d._geo_lat != null ? { lat: d._geo_lat, lng: d._geo_lng, precision: d._geo_precision || "city" as const } : null;
  const coords = resolveCoords(d.latitude, d.longitude, o.city, o.state, o.country, o.name, serverGeo);
  if (!coords) return null;

  return {
    type:     "Feature",
    geometry: { type: "Point", coordinates: toGeoJSONCoords(coords) },
    properties: {
      id:           `org-${o.slug}`,
      entityKind:   "organization",
      name:         o.name,
      href:         `/organizations/${o.slug}`,
      avatarUrl:    o.logo_url ?? null,
      initials:     mkInitials(o.name),
      line2:        o.organization_type?.trim() || null,
      line3:        loc(o.city, o.state, abbrev(o.country)) || null,
      isVerified:   o.is_verified ?? false,
      signalLabel:  null,
      signalColor:  null,
      geoPrecision: coords.precision,
      rawCity:      o.city?.trim() || null,
      rawState:     o.state?.trim() || null,
      rawCountry:   o.country?.trim() || null,
      coverUrl: null, priceLabel: null, propertyTitle: null, beds: null, baths: null, sqm: null, listingLabel: null,
    },
  };
}

function propertyToFeature(p: EnrichedProperty): EntityFeature | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = p as any;
  const serverGeo = d._geo_lat != null ? { lat: d._geo_lat, lng: d._geo_lng, precision: d._geo_precision || "city" as const } : null;
  const coords = resolveCoords(d.latitude, d.longitude, p.city, p.state_region, p.country, p.title, serverGeo);
  if (!coords) return null;

  const displayPrice = p.is_price_public ?
    new Intl.NumberFormat("en-US", { style: "currency", currency: p.price_currency, maximumFractionDigits: 0 }).format(p.price_amount)
    : "Price on Request";

  const coverImage = p.media?.find(m => m.is_cover)?.url || p.media?.[0]?.url || null;

  const listingLabels: Record<string, string> = {
    sale: "For Sale", long_term: "Long-Term", short_term: "Short Stay", commercial: "Commercial",
  };

  return {
    type:     "Feature",
    geometry: { type: "Point", coordinates: toGeoJSONCoords(coords) },
    properties: {
      id:           `prop-${p.id}`,
      entityKind:   "property",
      name:         displayPrice,
      href:         `/properties/${p.slug}`,
      avatarUrl:    coverImage,
      initials:     "PR",
      line2:        p.title,
      line3:        loc(p.city, p.state_region, abbrev(p.country)) || null,
      isVerified:   p.is_verified ?? false,
      signalLabel:  `${p.listing_type.replace('_', ' ')} · ${p.property_type.replace('_', ' ')}`.toUpperCase(),
      signalColor:  "bg-[#10b981]/10 text-[#10b981]",
      geoPrecision: coords.precision,
      rawCity:      p.city?.trim() || null,
      rawState:     p.state_region?.trim() || null,
      rawCountry:   p.country?.trim() || null,
      // Property-specific rich preview data
      coverUrl:       coverImage,
      priceLabel:     displayPrice,
      propertyTitle:  p.title,
      beds:           p.bedrooms ?? null,
      baths:          p.bathrooms ?? null,
      sqm:            p.square_meters ?? null,
      listingLabel:   listingLabels[p.listing_type] || p.listing_type.replace('_', ' '),
    },
  };
}

// ── Property preview card (compact listing card) ─────────────────────────────
// Shown on the map popup (desktop) and top of bottom sheet (mobile).
// Clicking navigates to the full listing page.

const PropertyPreviewCard = memo(function PropertyPreviewCard({
  props,
  onNavigate,
  compact = false,
}: {
  props: EntityProps;
  onNavigate: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onNavigate}
      className="w-full text-left group cursor-pointer"
    >
      {/* Cover image */}
      {props.coverUrl ? (
        <div className={`relative w-full overflow-hidden ${compact ? "h-[100px] rounded-t-lg" : "h-[120px] rounded-t-xl"}`}>
          <img
            src={props.coverUrl}
            alt={props.propertyTitle || "Property"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {/* Listing type badge over image */}
          {props.listingLabel && (
            <span className="absolute top-2 left-2 px-2 py-[3px] rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wide text-[#10b981]">
              {props.listingLabel}
            </span>
          )}
        </div>
      ) : (
        <div className={`relative w-full flex items-center justify-center bg-[#10b981]/[0.06] ${compact ? "h-[72px] rounded-t-lg" : "h-[88px] rounded-t-xl"}`}>
          <Home size={20} className="text-[#10b981]/25" strokeWidth={1.3} />
          {props.listingLabel && (
            <span className="absolute top-2 left-2 px-2 py-[3px] rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wide text-[#10b981]">
              {props.listingLabel}
            </span>
          )}
        </div>
      )}

      {/* Info section */}
      <div className={`${compact ? "px-3 py-2.5" : "px-3.5 py-3"}`}>
        {/* Price */}
        <p className="text-[15px] font-bold text-white/90 leading-tight">
          {props.priceLabel || props.name}
        </p>

        {/* Title */}
        {props.propertyTitle && (
          <p className="text-[11px] text-white/50 font-medium mt-0.5 truncate leading-snug">
            {props.propertyTitle}
          </p>
        )}

        {/* Location */}
        {props.line3 && (
          <p className="text-[10px] text-white/28 mt-0.5 truncate">
            {props.line3}
          </p>
        )}

        {/* Specs + CTA row */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2.5">
            {props.beds != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/35 font-medium">
                <Bed size={10} strokeWidth={1.8} className="text-white/25" />
                {props.beds}
              </span>
            )}
            {props.baths != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/35 font-medium">
                <Bath size={10} strokeWidth={1.8} className="text-white/25" />
                {props.baths}
              </span>
            )}
            {props.sqm != null && (
              <span className="text-[10px] text-white/30 font-medium">
                {props.sqm}m²
              </span>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#10b981]/70 group-hover:text-[#10b981] transition-colors">
            View
            <ArrowRight size={10} strokeWidth={2} />
          </span>
        </div>
      </div>
    </button>
  );
});

// ── Panel result card ─────────────────────────────────────────────────────────

const PanelCard = memo(function PanelCard({
  props,
  isSelected,
  onClick,
  onNavigate,
}: {
  props: EntityProps;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: () => void;
}) {
  const av = AV[props.entityKind];
  const isProperty = props.entityKind === "property";

  // For properties: show a richer card with cover image when selected
  if (isProperty && isSelected) {
    return (
      <div className="border-l-2 border-[#10b981]/55 bg-[#10b981]/[0.04]">
        <PropertyPreviewCard props={props} onNavigate={onNavigate} compact />
      </div>
    );
  }

  // For properties: show image thumbnail even when not selected
  if (isProperty) {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group border-l-2 hover:bg-white/[0.04] border-transparent"
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden bg-[#10b981]/[0.06]">
          {props.coverUrl ? (
            <img
              src={props.coverUrl}
              alt={props.propertyTitle || "Property"}
              className="w-12 h-12 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center">
              <Home size={14} className="text-[#10b981]/25" strokeWidth={1.3} />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white/70 group-hover:text-white/90 truncate transition-colors">
            {props.priceLabel || props.name}
          </p>
          {props.propertyTitle && (
            <p className="text-[10px] text-white/35 truncate mt-[2px]">
              {props.propertyTitle}
            </p>
          )}
          <div className="flex items-center gap-2 mt-[2px]">
            {props.line3 && (
              <span className="text-[10px] text-white/20 truncate">{props.line3}</span>
            )}
            {props.beds != null && (
              <span className="flex items-center gap-0.5 text-[9px] text-white/22 font-medium shrink-0">
                <Bed size={8} strokeWidth={1.5} /> {props.beds}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Default card for people, businesses, organizations
  return (
    <button
      onClick={isSelected ? onNavigate : onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group border-l-2 ${
        isSelected
          ? "bg-[#b08d57]/[0.07] border-[#b08d57]/55"
          : "hover:bg-white/[0.04] border-transparent"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${
          props.avatarUrl ? "" : av.bg
        }`}
      >
        {props.avatarUrl ? (
          <img
            src={props.avatarUrl}
            alt={props.name}
            className="w-9 h-9 object-cover rounded-full"
            loading="lazy"
          />
        ) : (
          <span className={`text-[10px] font-bold uppercase ${av.text}`}>
            {props.initials}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <p
            className={`text-[12px] font-semibold truncate transition-colors ${
              isSelected ? "text-white/90" : "text-white/65 group-hover:text-white/85"
            }`}
          >
            {props.name}
          </p>
          {props.isVerified && (
            <span className="shrink-0 -mt-px">
              <VerifiedBadge size="sm" />
            </span>
          )}
        </div>
        {props.line2 && (
          <p className="text-[10px] text-white/30 truncate mt-[2px]">
            {props.line2}
          </p>
        )}
        {props.line3 && (
          <p className="text-[10px] text-white/18 truncate">{props.line3}</p>
        )}
      </div>

      {/* Selected: View arrow / Precision indicator */}
      {isSelected ? (
        <ArrowRight size={12} className="shrink-0 text-[#b08d57]/50" strokeWidth={2} />
      ) : (props.geoPrecision === "country" || props.geoPrecision === "state") ? (
        <MapPin size={10} className="shrink-0 text-white/15" strokeWidth={1.5} />
      ) : null}
    </button>
  );
});

// ── No-token fallback ─────────────────────────────────────────────────────────

function NoTokenState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-white/[0.06] border-dashed">
      <Globe size={28} className="text-white/12 mb-3" strokeWidth={1.3} />
      <p className="text-[13px] font-semibold text-white/30">Map not configured</p>
      <p className="text-[11px] text-white/18 mt-1 max-w-xs leading-relaxed">
        Add{" "}
        <code className="text-[#b08d57]/55 bg-[#b08d57]/[0.07] px-1 py-0.5 rounded text-[10px]">
          NEXT_PUBLIC_MAPBOX_TOKEN
        </code>{" "}
        to your environment to enable the interactive map.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type DirectoryMapViewProps = {
  scope:         "all" | "people" | "businesses" | "organizations" | "properties";
  totalResults:  number;
  people?:       EnrichedDirectoryPerson[];
  businesses?:   BusinessProfile[];
  organizations?:OrganizationDirectoryEntry[];
  properties?:   EnrichedProperty[];
};

// ── Zoom targets by geo precision ────────────────────────────────────────────
// "exact"   → 14.5 puts us one tick past clusterMaxZoom=14: ALL clusters break,
//              individual marker is always visible.
// "city"    → 12  shows a city neighbourhood; breaks most urban clusters.
// "state"   → 8   good regional overview.
// "country" → 5.5 shows the full country; honest about low precision.

const PRECISION_ZOOM: Record<string, number> = {
  exact:   14.5,
  city:    12,
  state:   8,
  country: 5.5,
};

export default function DirectoryMapView({
  totalResults,
  people        = [],
  businesses    = [],
  organizations = [],
  properties    = [],
}: DirectoryMapViewProps) {
  const router                = useRouter();
  const mapRef                = useRef<MapRef>(null);   // desktop map
  const mobileMapRef          = useRef<MapRef>(null);   // mobile map
  const panelRef              = useRef<HTMLDivElement>(null);   // desktop side panel scroll container
  const mobilePanelRef        = useRef<HTMLDivElement>(null);   // mobile sheet scroll container
  const [mounted,      setMounted]      = useState(false);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [sheetExpanded,setSheetExpanded]= useState(false);
  const [mapLoaded,    setMapLoaded]    = useState(false);

  // SSR guard — mapbox-gl requires browser APIs
  useEffect(() => { setMounted(true); }, []);

  // ── Focus param: auto-select a property from URL ?focus=prop-xxx ─────────
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");
  const focusAppliedRef = useRef(false);

  // ── Build GeoJSON (two-phase: sync local lookup → async Mapbox geocoding) ──

  // Phase 1 — instant: use the local lookup tables (CITY_COORDS, STATE_COORDS,
  // COUNTRY_CENTROIDS).  Features whose city is not in the local table will
  // temporarily resolve at state / country precision.
  const syncFeatures = useMemo<EntityFeature[]>(() => [
    ...people.map(personToFeature).filter(Boolean) as EntityFeature[],
    ...businesses.map(bizToFeature).filter(Boolean) as EntityFeature[],
    ...organizations.map(orgToFeature).filter(Boolean) as EntityFeature[],
    ...properties.map(propertyToFeature).filter(Boolean) as EntityFeature[],
  ], [people, businesses, organizations, properties]);

  // City resolution now happens server-side via wac_cities (154K rows) in
  // app/directory/page.tsx.  The server attaches _geo_lat/_geo_lng/_geo_precision
  // to each entity before it reaches the client.  The resolveCoords() call in
  // each feature adapter picks these up in step 1b.  No client-side geocoding
  // or Mapbox API calls needed.
  const features = syncFeatures;

  const geojson = useMemo<EntityGeoJSON>(() => ({
    type:     "FeatureCollection",
    features,
  }), [features]);

  const unmappedCount = useMemo(
    () => (people.length + businesses.length + organizations.length + properties.length) - syncFeatures.length,
    [people, businesses, organizations, properties, syncFeatures],
  );

  const selectedFeature = useMemo(
    () => features.find(f => f.properties.id === selectedId) ?? null,
    [features, selectedId],
  );

  // ── Auto-scroll selected item into view in both panels ──────────────────
  // Fires after React renders the new selectedId. Uses requestAnimationFrame
  // to ensure the DOM has updated before we query for the element.
  useEffect(() => {
    if (!selectedId) return;
    requestAnimationFrame(() => {
      // Desktop panel — scroll within the panelRef container
      if (panelRef.current) {
        const el = panelRef.current.querySelector(`[data-entity-id="${selectedId}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Mobile panel — scroll within the mobilePanelRef container
      if (mobilePanelRef.current) {
        const el = mobilePanelRef.current.querySelector(`[data-entity-id="${selectedId}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [selectedId]);


  // ── Cluster expand helper ─────────────────────────────────────────────────
  // Used by both map-click handlers and the panel-click path.

  const expandCluster = useCallback((
    mapInstance: MapRef,
    sourceId:    string,
    clusterId:   number,
    coords:      [number, number],
  ) => {
    type ClusterSource = { getClusterExpansionZoom?: (id: number, cb: (err: Error | null, z: number) => void) => void };
    const source = mapInstance.getSource(sourceId) as ClusterSource;
    if (source?.getClusterExpansionZoom) {
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (!err) mapInstance.flyTo({ center: coords, zoom: zoom + 0.5, duration: 450 });
      });
    } else {
      mapInstance.flyTo({ center: coords, zoom: mapInstance.getZoom() + 3, duration: 450 });
    }
  }, []);

  // ── Panel → map: fly to entity, zoom past any containing cluster ─────────
  //
  // Takes the map instance explicitly so it works for both desktop and mobile.
  //
  // panelPadding = true on desktop: shifts the flyTo centre left of the 330px
  // right panel so the marker lands in the visible map area, not behind the panel.

  const flyToFeature = useCallback((
    feature:      EntityFeature,
    mapInstance:  MapRef | null,
    panelPadding: boolean,
  ) => {
    if (!mapInstance) return;

    const [lng, lat]  = feature.geometry.coordinates;
    const currentZoom = mapInstance.getZoom();
    const targetZoom  = PRECISION_ZOOM[feature.properties.geoPrecision] ?? 8;

    // Only zoom IN — never pull the user back out to a lower zoom.
    const finalZoom = Math.max(currentZoom, targetZoom);

    mapInstance.flyTo({
      center:   [lng, lat],
      zoom:     finalZoom,
      duration: 780,
      // On desktop the right panel is 330px wide; shift the flyTo anchor so the
      // marker lands in the visible (non-panel) area of the canvas.
      // On mobile, leave room above the bottom sheet.
      padding: panelPadding
        ? { right: 340, top: 60, bottom: 60, left: 40 }
        : { top: 80,   bottom: 180, left: 20, right: 20 },
    });
  }, []);

  // ── Auto-focus from URL param ─────────────────────────────────────────────
  // When arriving from property detail page with ?focus=prop-xxx
  useEffect(() => {
    if (!focusParam || focusAppliedRef.current || !mapLoaded) return;
    // Find matching feature
    const target = features.find(f => f.properties.id === focusParam);
    if (!target) return;
    focusAppliedRef.current = true;
    setSelectedId(focusParam);
    // Let the DOM settle, then fly
    requestAnimationFrame(() => {
      flyToFeature(target, mapRef.current, true);
      flyToFeature(target, mobileMapRef.current, false);
    });
  }, [focusParam, mapLoaded, features, flyToFeature]);

  // ── Map click: desktop ────────────────────────────────────────────────────

  const handleDesktopMapClick = useCallback((e: MapMouseEvent) => {
    const feats = e.features;
    if (!feats?.length) { setSelectedId(null); return; }
    const feature = feats[0];
    const map = mapRef.current;
    if (!map) return;

    if (feature.layer?.id === "clusters") {
      expandCluster(
        map,
        "entities",
        feature.properties?.cluster_id as number,
        (feature.geometry as GeoJSON.Point).coordinates as [number, number],
      );
    } else if (feature.layer?.id === "unclustered-point") {
      const id = feature.properties?.id as string;
      const kind = feature.properties?.entityKind as string;
      // Properties always select (never toggle off from marker) — the preview
      // card is the pathway to the listing, not the marker itself.
      if (kind === "property") {
        setSelectedId(id);
      } else {
        setSelectedId(prev => prev === id ? null : id);
      }
    }
  }, [expandCluster]);

  // ── Map click: mobile ─────────────────────────────────────────────────────
  // Uses separate ref (mobileMapRef) and mobile-specific layer IDs.

  const handleMobileMapClick = useCallback((e: MapMouseEvent) => {
    const feats = e.features;
    if (!feats?.length) { setSelectedId(null); return; }
    const feature = feats[0];
    const map = mobileMapRef.current;
    if (!map) return;

    if (feature.layer?.id === "clusters-m") {
      expandCluster(
        map,
        "entities-mobile",
        feature.properties?.cluster_id as number,
        (feature.geometry as GeoJSON.Point).coordinates as [number, number],
      );
    } else if (feature.layer?.id === "unclustered-point-m") {
      const id = feature.properties?.id as string;
      const kind = feature.properties?.entityKind as string;
      if (kind === "property") {
        setSelectedId(id);
        // Keep sheet at peek height — property preview card shows inline
      } else {
        const wasSelected = id === selectedId;
        setSelectedId(wasSelected ? null : id);
        // Expand sheet so the user can see the selected item in the list
        if (!wasSelected) setSheetExpanded(true);
      }
    }
  }, [expandCluster]);

  const handleMouseEnter = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "pointer";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = "";
  }, []);

  // ── Derived summary numbers ───────────────────────────────────────────────

  const mappedPeople  = useMemo(() => features.filter(f => f.properties.entityKind === "person").length,       [features]);
  const mappedBiz     = useMemo(() => features.filter(f => f.properties.entityKind === "business").length,     [features]);
  const mappedOrgs    = useMemo(() => features.filter(f => f.properties.entityKind === "organization").length, [features]);
  const mappedProps   = useMemo(() => features.filter(f => f.properties.entityKind === "property").length,     [features]);

  // ── Navigation helper ────────────────────────────────────────────────────
  // Navigates to the entity's detail page. Used by PanelCard + PropertyPreview.
  const navigateToEntity = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  // ── Early returns ─────────────────────────────────────────────────────────

  if (!MAPBOX_TOKEN) return <NoTokenState />;

  if (!mounted) {
    return (
      <div
        className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] animate-pulse"
        style={{ height: "clamp(420px, 56vw, 620px)" }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedHaloFilter: [string, ...unknown[]] = selectedId
    ? ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], selectedId]]
    : ["==", ["get", "id"], "__none__"];

  return (
    <div className="w-full">

      {/* ── Desktop layout: map + right panel ────────────────────────── */}
      <div
        className="hidden lg:flex gap-0 rounded-2xl overflow-hidden border border-white/[0.07]"
        style={{ height: "clamp(460px, 52vw, 620px)" }}
      >

        {/* Map canvas */}
        <div className="relative flex-1 min-w-0">
          <MapGL
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={INITIAL_VIEW}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={["clusters", "unclustered-point"]}
            onClick={handleDesktopMapClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onLoad={() => setMapLoaded(true)}
            attributionControl={false}
            pitchWithRotate={false}
            dragRotate={false}
            touchPitch={false}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            <Source
              id="entities"
              type="geojson"
              data={geojson}
              cluster
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer {...CLUSTER_LAYER} />
              <Layer {...CLUSTER_COUNT_LAYER} />
              <Layer {...POINT_LAYER} />

              {/* Selected entity halo */}
              <Layer
                id="selected-halo"
                type="circle"
                filter={selectedHaloFilter}
                paint={{
                  "circle-radius":        16,
                  "circle-color":         "transparent",
                  "circle-stroke-width":  2.5,
                  "circle-stroke-color": [
                    "match", ["get", "entityKind"],
                    "person",       "#b08d57",
                    "business",     "#60a5fa",
                    "property",     "#10b981",
                    /* org default */"#34d399",
                  ],
                  "circle-stroke-opacity": 0.85,
                }}
              />
            </Source>

            {/* Property popup on desktop — floating preview card over marker */}
            {selectedFeature && selectedFeature.properties.entityKind === "property" && (
              <Popup
                longitude={selectedFeature.geometry.coordinates[0]}
                latitude={selectedFeature.geometry.coordinates[1]}
                anchor="bottom"
                offset={[0, -18] as [number, number]}
                closeButton={false}
                closeOnClick={false}
                className="property-map-popup"
                maxWidth="260px"
              >
                <div 
                  className="rounded-xl overflow-hidden bg-[#111113] border border-white/[0.08] shadow-2xl shadow-black/50" 
                  style={{ width: 240 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <PropertyPreviewCard
                    props={selectedFeature.properties}
                    onNavigate={() => navigateToEntity(selectedFeature.properties.href)}
                    compact
                  />
                </div>
              </Popup>
            )}
          </MapGL>

          {/* Map loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-[#070a10] flex items-center justify-center">
              <div className="flex items-center gap-2 text-[11px] text-white/25 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#b08d57]/40 animate-pulse" />
                Loading map…
              </div>
            </div>
          )}

          {/* Bottom summary bar */}
          <div
            className="absolute bottom-0 inset-x-0 px-4 py-2 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(5,8,14,0.75) 0%, transparent 100%)" }}
          >
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#b08d57]/50 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/22">
                {features.length.toLocaleString()} mapped across the diaspora
              </span>
              {unmappedCount > 0 && (
                <span className="text-[9px] text-white/14 font-medium">
                  · +{unmappedCount} without location
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side panel */}
        <div className="w-[310px] xl:w-[330px] shrink-0 flex flex-col border-l border-white/[0.06] bg-white/[0.010]">

          {/* Panel header */}
          <div className="shrink-0 border-b border-white/[0.05]">
            {selectedFeature ? (
              <div className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white/80 leading-tight truncate">
                      {selectedFeature.properties.entityKind === "property"
                        ? selectedFeature.properties.priceLabel || selectedFeature.properties.name
                        : selectedFeature.properties.name}
                    </p>
                    <p className="text-[10px] text-white/28 mt-0.5 font-medium">
                      Selected ·{" "}
                      <a
                        href={selectedFeature.properties.href}
                        className={`hover:opacity-100 transition-colors ${
                          selectedFeature.properties.entityKind === "property"
                            ? "text-[#10b981]/60 hover:text-[#10b981]/90"
                            : "text-[#b08d57]/55 hover:text-[#b08d57]/80"
                        }`}
                      >
                        {selectedFeature.properties.entityKind === "property" ? "View listing →" : "View profile →"}
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="shrink-0 text-[10px] text-white/22 hover:text-white/50 transition-colors mt-0.5"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-bold text-white/70">
                  {totalResults.toLocaleString()} {totalResults === 1 ? "result" : "results"}
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  {mappedPeople > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#b08d57]/50 font-medium">
                      <Users size={9} strokeWidth={2} />
                      {mappedPeople}
                    </span>
                  )}
                  {mappedBiz > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-blue-400/50 font-medium">
                      <Briefcase size={9} strokeWidth={2} />
                      {mappedBiz}
                    </span>
                  )}
                  {mappedOrgs > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-400/50 font-medium">
                      <Landmark size={9} strokeWidth={2} />
                      {mappedOrgs}
                    </span>
                  )}
                  {mappedProps > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-[#10b981]/50 font-medium">
                      <Home size={9} strokeWidth={2} />
                      {mappedProps}
                    </span>
                  )}
                  {unmappedCount > 0 && (
                    <span className="text-[10px] text-white/18 font-medium">
                      · +{unmappedCount} unmapped
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Entity list — scrollable, people → businesses → organizations */}
          <div
            ref={panelRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent] divide-y divide-white/[0.025]"
          >
            {features.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Globe size={20} className="text-white/12 mb-3" strokeWidth={1.3} />
                <p className="text-[12px] text-white/22">No entities with known locations</p>
              </div>
            ) : (
              features.map(f => (
                <div key={f.properties.id} data-entity-id={f.properties.id}>
                  <PanelCard
                    props={f.properties}
                    isSelected={selectedId === f.properties.id}
                    onClick={() => {
                      const isProperty = f.properties.entityKind === "property";
                      const alreadySelected = selectedId === f.properties.id;
                      // Properties: always select (never toggle off from panel row)
                      if (isProperty) {
                        setSelectedId(f.properties.id);
                      } else {
                        setSelectedId(alreadySelected ? null : f.properties.id);
                      }
                      if (!alreadySelected) flyToFeature(f, mapRef.current, true);
                    }}
                    onNavigate={() => navigateToEntity(f.properties.href)}
                  />
                </div>
              ))
            )}

            {/* Precision legend at bottom of panel */}
            {features.length > 0 && (
              <div className="px-4 py-3 flex items-center gap-3">
                <span className="text-[9px] text-white/16 font-medium uppercase tracking-wide">Precision:</span>
                <span className="flex items-center gap-1 text-[9px] text-white/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/15" />
                  exact
                </span>
                <span className="flex items-center gap-1 text-[9px] text-white/18">
                  <span className="w-2 h-2 rounded-full bg-white/22 border border-white/10" />
                  city
                </span>
                <span className="flex items-center gap-1 text-[9px] text-white/14">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/15 border border-white/08" />
                  country
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile layout: stacked map + bottom sheet ─────────────────── */}
      <div className="lg:hidden flex flex-col" style={{ height: "100dvh", maxHeight: "680px" }}>

        {/* Map takes remaining space above the sheet */}
        <div className="relative flex-1 min-h-0">
          <MapGL
            ref={mobileMapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={INITIAL_VIEW}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAP_STYLE}
            interactiveLayerIds={["clusters-m", "unclustered-point-m"]}
            onClick={handleMobileMapClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            attributionControl={false}
            pitchWithRotate={false}
            dragRotate={false}
            touchPitch={false}
          >
            <Source
              id="entities-mobile"
              type="geojson"
              data={geojson}
              cluster
              clusterMaxZoom={14}
              clusterRadius={50}
            >
              <Layer {...{ ...CLUSTER_LAYER,       id: "clusters-m"       }} />
              <Layer {...{ ...CLUSTER_COUNT_LAYER, id: "cluster-count-m"  }} />
              <Layer {...{ ...POINT_LAYER,         id: "unclustered-point-m" }} />
              <Layer
                id="selected-halo-m"
                type="circle"
                filter={selectedHaloFilter}
                paint={{
                  "circle-radius":        16,
                  "circle-color":         "transparent",
                  "circle-stroke-width":  2.5,
                  "circle-stroke-color": [
                    "match", ["get", "entityKind"],
                    "person",       "#b08d57",
                    "business",     "#60a5fa",
                    "property",     "#10b981",
                    "#34d399",
                  ],
                  "circle-stroke-opacity": 0.85,
                }}
              />
            </Source>
          </MapGL>
        </div>

        {/* Bottom sheet — property preview mode or list mode */}
        {/* When a property is selected, peek height grows to fit the preview card */}
        <div
          className="shrink-0 flex flex-col rounded-t-2xl border-t border-white/[0.08] bg-[#09090b] overflow-hidden transition-all duration-300"
          style={{
            height: sheetExpanded
              ? "42dvh"
              : selectedFeature?.properties.entityKind === "property"
                ? "auto"
                : "160px",
            maxHeight: sheetExpanded ? "42dvh" : "280px",
          }}
        >

          {/* Sheet handle + header */}
          <button
            onClick={() => setSheetExpanded(v => !v)}
            className="shrink-0 flex flex-col items-center pt-2.5 pb-2 gap-1.5"
          >
            <span className="w-9 h-[3px] rounded-full bg-white/[0.12]" />
            <div className="flex items-center gap-2 w-full px-4">
              <span className="flex-1 text-[12px] font-bold text-white/55 text-left">
                {selectedFeature
                  ? selectedFeature.properties.entityKind === "property"
                    ? selectedFeature.properties.priceLabel || selectedFeature.properties.name
                    : selectedFeature.properties.name
                  : `${totalResults.toLocaleString()} results`}
              </span>
              {sheetExpanded
                ? <ChevronDown size={14} className="text-white/25 shrink-0" />
                : <ChevronUp   size={14} className="text-white/25 shrink-0" />
              }
            </div>
          </button>

          {/* Property preview card at top of sheet when a property is selected */}
          {selectedFeature && selectedFeature.properties.entityKind === "property" && !sheetExpanded && (
            <div className="shrink-0 mx-3 mb-3 rounded-xl overflow-hidden bg-white/[0.02] border border-[#10b981]/15">
              <PropertyPreviewCard
                props={selectedFeature.properties}
                onNavigate={() => navigateToEntity(selectedFeature.properties.href)}
                compact
              />
            </div>
          )}

          {/* Scrollable entity list */}
          <div ref={mobilePanelRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-white/[0.03]">
            {features.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-[12px] text-white/22">No entities with known locations</p>
              </div>
            ) : (
              features.map(f => (
                <div key={f.properties.id} data-entity-id={f.properties.id}>
                  <PanelCard
                    props={f.properties}
                    isSelected={selectedId === f.properties.id}
                    onClick={() => {
                      const isProperty = f.properties.entityKind === "property";
                      const alreadySelected = selectedId === f.properties.id;
                      if (isProperty) {
                        setSelectedId(f.properties.id);
                      } else {
                        setSelectedId(alreadySelected ? null : f.properties.id);
                      }
                      if (!alreadySelected) {
                        flyToFeature(f, mobileMapRef.current, false);
                        if (!isProperty) setSheetExpanded(false);
                      }
                    }}
                    onNavigate={() => navigateToEntity(f.properties.href)}
                  />
                </div>
              ))
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
