# Directory UI Polish & Taxonomy Filters Implementation Plan

The user requested two major updates to the Directory search interface:
1. **Layout Alignment:** The "Refine" sidebar on desktop is vertically misaligned with the content cards (it sits higher than the "Suggested for You" row).
2. **Searchable Taxonomy Pull-downs:** The filter bar must include "Industry", "Profession", and "Skills" as custom pull-down menus rather than basic free-text `<input>` boxes.

## User Review Required

> [!IMPORTANT]
> **Database Fetching Paradigm:** Pulling industries, professions, and skills requires async data fetching. I plan to create a standalone client-side hook (`useTaxonomies`) that fetches and caches these lists via Supabase, ensuring the filter panels fast-load and react smoothly without cluttering the main directory server component with deep taxonomy prop-drilling.

## Proposed Changes

### 1. Database & RPC Level

#### [MODIFY] `add_skills_filter_rpc.sql` (and its active deployed version)
- **Goal:** Add `p_profession TEXT DEFAULT NULL` to the `get_people_directory_scored` RPC function so we can actually filter on professions natively.
- **Details:** 
  - Update the `DROP FUNCTION` definitions.
  - Update the `CREATE OR REPLACE FUNCTION` signature to include `p_profession TEXT DEFAULT NULL`.
  - Add the `AND (p_profession IS NULL OR p_profession = '' OR v.profession_name ILIKE '%' || p_profession || '%' OR v.profession_slug ILIKE '%' || p_profession || '%')` clause in the `WHERE` condition.
  - Execute the script using `supabase-mcp-server` to update the active Supabase database.

### 2. Service Layer

#### [MODIFY] `lib/services/searchService.ts`
- **Goal:** Wire the new `profession` filter down to the RPC.
- **Details:** 
  - Add `profession?: string` to the `SearchFilters` type.
  - Update `getPeopleDirectory` to pass `p_profession: filters.profession || null` into the RPC arguments.

### 3. UI Components

#### [MODIFY] `components/directory/UnifiedDiscoveryLayout.tsx`
- **Goal:** Fix the vertical alignment of the desktop sidebar.
- **Details:** Add top margin (e.g., `mt-[52px]` or similar layout matching offset) to the `<aside>` block when in desktop view to guarantee that it is perfectly aligned with the grid item cards containing the "Suggested for You" header.

#### [NEW] `hooks/useTaxonomies.ts`
- **Goal:** Abstract the fetching of taxonomies.
- **Details:** A React hook utilizing `useEffect` to fetch rows from `industries`, `professions`, and `skills` tables via supabase on mount, storing them in state.

#### [NEW] `components/ui/SearchableCombobox.tsx`
- **Goal:** Create an interactive, searchable dropdown menu.
- **Details:** Since `TaxonomySheet` lacks type-ahead text-search (crucial for long lists like Skills or Industries), we will build or adapt a `SearchableCombobox` with a textual filter input inside the dropdown.

#### [MODIFY] `components/directory/GlobalDirectoryFilters.tsx`
- **Goal:** Replace standard HTML text inputs with the new comboboxes.
- **Details:** 
  - Introduce the `useTaxonomies()` hook.
  - Replace the "Industry" `<input>` with `<SearchableCombobox>` mapped to the industries taxonomy.
  - Add a "Profession" section utilizing `<SearchableCombobox>`.
  - Add a "Skills" section (possibly a Multi-Select or tokenized select, or just passing a single skill param for now based on URL structure).
  - Update the form submission logic (`handleApplyFilters`) or onChange callbacks to correctly push query parameters (e.g., `?industry=Tech&profession=Dev&skills=React`) to the Next.js router.

## Open Questions

> [!WARNING]
> Regarding "Skills", do you want users to be able to select **multiple** skills at once (e.g. appending a `?skills=React&skills=Node` array), or just a single skill filter? Our initial plan assumes single-selection for layout simplicity unless multi-select is strictly required.

## Verification Plan

### Manual Verification
- View `/directory` on Desktop. Verify the "Refine" sidebar starts exactly flush with the profile cards.
- Test the new Comboboxes. Verify data (industries, professions) populates correctly.
- Select an option and ensure the URL updates. Verify the results list filters accordingly.
- Repeat the test while in Map view.
