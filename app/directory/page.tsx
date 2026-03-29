import { Suspense } from "react";
import UnifiedDiscoveryLayout from "@/components/directory/UnifiedDiscoveryLayout";
import UnifiedResults from "@/components/directory/UnifiedResults";
import {
  getPeopleDirectory,
  getEntitiesDirectory,
  getPropertiesDirectory,
} from "@/lib/services/searchService";
import { supabase } from "@/lib/supabase";
import type { SearchFilters, EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { EnrichedProperty } from "@/lib/types/property-directory";
import { batchResolveCities, cityLookupKey } from "@/lib/geo/coordinates";
import { PROPERTIES_ENABLED } from "@/lib/constants/featureFlags";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    view?: string;
    country?: string;
    industry?: string;
    profession?: string;
    skills?: string | string[];
    mentor?: string;
    work?: string;
    hire?: string;
    invest?: string;
    collab?: string;
  }>;
}) {
  const params = await searchParams;

  const scopeRaw = params.scope?.toLowerCase() || "all";
  const validScopes = PROPERTIES_ENABLED
    ? ["all", "people", "businesses", "organizations", "properties"]
    : ["all", "people", "businesses", "organizations"];
  const scope = validScopes.includes(scopeRaw)
    ? (scopeRaw as "all" | "people" | "businesses" | "organizations" | "properties")
    : "all";

  const viewRaw = params.view?.toLowerCase() || "browse";
  const view: "browse" | "map" = viewRaw === "map" ? "map" : "browse";

  const filters: SearchFilters = {
    q:                params.q?.trim() ?? "",
    country:          params.country?.trim() ?? "",
    industry:         params.industry?.trim() ?? "",
    profession:       params.profession?.trim() ?? "",
    specialty:        "",
    skills:           Array.isArray(params.skills) ? params.skills : (params.skills ? [params.skills] : []),
    mentorOnly:       params.mentor === "true",
    openToWork:       params.work   === "true",
    openToHire:       params.hire   === "true",
    openToInvest:     params.invest === "true",
    openToCollaborate: params.collab === "true",
    listing_type:     (params as any).listing_type?.trim() ?? "",
    property_type:    (params as any).property_type?.trim() ?? "",
    bedrooms:         (params as any).bedrooms?.trim() ?? "",
  };

  const { data: { user } } = await supabase.auth.getUser();

  const fetchPeople     = scope === "all" || scope === "people";
  const fetchEntities   = scope === "all" || scope === "organizations" || scope === "businesses";
  const fetchProperties = scope === "properties";

  const [peopleRes, entitiesRes, propertiesRes] = await Promise.all([
    fetchPeople
      ? getPeopleDirectory(filters, user?.id)
      : Promise.resolve({ data: [], error: null, count: 0 }),
    fetchEntities
      ? getEntitiesDirectory(filters)
      : Promise.resolve({ businesses: [], organizations: [], error: null }),
    fetchProperties
      ? getPropertiesDirectory(filters)
      : Promise.resolve({ properties: [], error: null }),
  ]);

  const people        = peopleRes.data;
  const businesses    = fetchEntities ? entitiesRes.businesses    : [];
  const organizations = fetchEntities ? entitiesRes.organizations : [];
  const properties    = fetchProperties ? propertiesRes.properties : [];

  // ── Batch-resolve city coordinates from wac_cities (154K rows, zero API cost) ─
  // Collect all entities with city data, resolve via the DB, then attach lat/lng
  // so the client-side map resolver picks them up as "city" precision in step 1.
  const allEntitiesForGeo = [
    ...people.map(p => ({ city: p.city, state: p.state, country: p.country })),
    ...businesses.map(b => ({ city: b.city, state: b.state, country: b.country })),
    ...organizations.map(o => ({ city: o.city, state: o.state, country: o.country })),
    ...properties.map(p => ({ city: p.city, state: p.state_region, country: p.country })),
  ];
  const cityCoords = await batchResolveCities(allEntitiesForGeo);

  // Attach resolved coordinates to each entity as _geo_lat / _geo_lng.
  // The map feature adapters read these via (entity as any)._geo_lat / _geo_lng.
  for (const p of people) {
    if (!p.city || !p.country) continue;
    const key = cityLookupKey(p.city, p.state, p.country);
    const resolved = key ? cityCoords.get(key) : null;
    if (resolved) {
      (p as Record<string, unknown>)._geo_lat       = resolved.lat;
      (p as Record<string, unknown>)._geo_lng       = resolved.lng;
      (p as Record<string, unknown>)._geo_precision = "city";
    }
  }
  for (const b of businesses) {
    if (!b.city || !b.country) continue;
    const key = cityLookupKey(b.city, b.state, b.country);
    const resolved = key ? cityCoords.get(key) : null;
    if (resolved) {
      (b as Record<string, unknown>)._geo_lat       = resolved.lat;
      (b as Record<string, unknown>)._geo_lng       = resolved.lng;
      (b as Record<string, unknown>)._geo_precision = "city";
    }
  }
  for (const o of organizations) {
    if (!o.city || !o.country) continue;
    const key = cityLookupKey(o.city, o.state, o.country);
    const resolved = key ? cityCoords.get(key) : null;
    if (resolved) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oa = o as any;
      oa._geo_lat       = resolved.lat;
      oa._geo_lng       = resolved.lng;
      oa._geo_precision = "city";
    }
  }
  for (const p of properties) {
    if (!p.city || !p.country) continue;
    const key = cityLookupKey(p.city, p.state_region, p.country);
    const resolved = key ? cityCoords.get(key) : null;
    if (resolved) {
      (p as Record<string, unknown>)._geo_lat       = resolved.lat;
      (p as Record<string, unknown>)._geo_lng       = resolved.lng;
      (p as Record<string, unknown>)._geo_precision = "city";
    }
  }

  const totalResults = people.length + businesses.length + organizations.length + properties.length;

  return (
    <UnifiedDiscoveryLayout
      initialQuery={filters.q || ""}
      scope={scope}
      view={view}
      defaultFiltersOpen={false}
      totalResults={totalResults}
      peopleCount={people.length}
      businessCount={businesses.length}
      organizationsCount={organizations.length}
      propertiesCount={properties.length}
      people={people as EnrichedDirectoryPerson[]}
      businesses={businesses}
      organizations={organizations}
      properties={properties}
      results={
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="wac-card h-[196px] animate-pulse" />
            ))}
          </div>
        }>
          <UnifiedResults
            query={filters.q || undefined}
            scope={scope}
            people={people as EnrichedDirectoryPerson[]}
            businesses={businesses}
            organizations={organizations}
            properties={properties}
          />
        </Suspense>
      }
    />
  );
}
