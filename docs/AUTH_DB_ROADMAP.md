# Auth and Database Roadmap

This roadmap defines the current state, planned architecture, and upcoming migration phases for the WAC platform's Authentication and Database layers. 

> **Important AI Handoff Note:** 
> Both Gemini and Claude Code must read this document before making significant changes to schemas or auth flows.

## 1. Authentication Layer

### Current State
*   **Provider:** Supabase Auth
*   **Methods:** Email/Password matching, Google OAuth.
*   **Flow:** Standard server-side and client-side auth via `@supabase/ssr` or `@supabase/supabase-js`. 
*   **Session Management:** Handled via Next.js Middleware (`middleware.ts`) to ensure secure route protection.

### Roadmap & Next Steps
*   [ ] **Role-Based Access Control (RBAC):** Move beyond basic authentication to role authorization (e.g., Admin vs. Standard User vs. Business Owner).
*   [ ] **Social Logins Expansion:** Consider adding LinkedIn OAuth since this is a professional networking platform.
*   [ ] **Account Recovery & Security:** Implement strict email verification gates and 2FA for sensitive roles (e.g., organization managers).
*   [ ] **Entity Authentication Contexts:** Allow users to "act as" a Business or Organization they own without needing separate logins.

## 2. Database Layer 

### Current State
*   **Provider:** Supabase PostgreSQL
*   **Core Schema:** `profiles`, `industries`, `professions`, `specialties`, `skills`, `feed_posts`, `events`.
*   **Integrations:** Uses Row Level Security (RLS) to restrict data access based on `auth.uid()`.
*   **Migrations:** Managed via SQL files in `supabase/migrations/`. 

### Roadmap & Next Steps

#### Phase 1: Taxonomy & Profiling Enforcement
*   [ ] Complete migration mapping free-text `profession`, `industry`, and `specialty` fields in the `profiles` table to strict foreign-key references to their respective taxonomy tables.
*   [ ] Finalize dynamic "Open-To" flags (`open_to_work`, `open_to_hire`, `open_to_invest`, etc.) for network matching.

#### Phase 2: Entity Expansion (Businesses & Organizations)
*   [ ] Finalize relationships where Profiles can be owners/managers of `businesses` and `organizations`.
*   [ ] Enforce RLS allowing only assigned Owners/Managers to mutate entity data.

#### Phase 3: Community & Interaction Systems
*   [ ] Deploy the `help_requests` and `help_request_responses` tables to support "Ask the Network".
*   [ ] Standardize feed reactions, bookmarks, and re-posts.
*   [ ] Roll out the `verifications` table to support a trustworthy directory (verifying businesses, orgs, and notable people).

#### Phase 4: Scaling & Performance
*   [ ] Consolidate full-text search strategies using Postgres `tsvector` / `pg_trgm` indexes for fast directory browsing.
*   [ ] Establish caching layers for static taxonomies (Skills, Industries).
