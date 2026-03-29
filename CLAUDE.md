# WAC — World Albanian Congress

Albanian diaspora professional network platform connecting Albanians globally through a structured directory of people, organizations, and businesses.

## Dev Commands

```bash
npm run dev      # Start dev server (Next.js with webpack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Setup

Requires `.env.local` with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** TailwindCSS 4 via PostCSS
- **Database/Auth:** Supabase (PostgreSQL + Supabase Auth + Google OAuth)
- **Hosting:** Vercel

## Project Structure

```
app/                    # Next.js App Router — pages and API routes
  api/search/instant/   # Instant search API route
  auth/callback/        # OAuth callback handler
  people/               # People directory pages
  organizations/        # Organization pages
  businesses/           # Business directory pages
  events/               # Events pages
  groups/               # Community groups
  jobs/                 # Job listings
  messages/             # Messaging
  notifications/        # Notifications

components/             # Reusable React components, organized by feature
  admin/                # Admin panel components
  people/               # People search/results
  organizations/        # Org search/results
  businesses/           # Business search/results
  feed/                 # Social feed
  messaging/            # Chat/messaging UI
  calendar/             # Calendar and events
  layout/               # Navbar, footer, mobile nav
  ui/                   # Primitive UI components

lib/
  supabase.ts           # Supabase client
  services/             # Data services (feed, groups, messaging, profiles, search)
  hooks/                # Custom React hooks
  types/                # TypeScript interfaces
  constants/            # App-wide constants

supabase/migrations/    # 47+ SQL migration files — full DB schema history
scripts/                # Utility/migration scripts (run with tsx)
docs/                   # Detailed architecture and feature docs
public/                 # Static assets (SVGs, images, logos)
```

## Key Conventions

- **Path alias:** `@/*` maps to project root — use for all imports
- **TypeScript:** Strict mode enabled
- **Styling:** TailwindCSS 4 utility classes; CSS variables in `app/globals.css`
- **Color palette:** Heritage Red `#9e2424`, Heritage Gold `#b08d57`, Warm Ivory `#f3ede3`, Deep Charcoal `#151311`
- **Font:** Playfair Display (display), Geist Sans (body)
- **Components:** Feature-organized under `components/<feature>/`
- **Data fetching:** Supabase client in `lib/supabase.ts`; service functions in `lib/services/`

## Core Entities

1. **People** — professional profiles with skills, industry, profession, company
2. **Organizations** — nonprofits, chambers, cultural institutions, community groups
3. **Businesses** — Albanian-owned enterprises with verification, ratings, maps

## Database

Supabase (PostgreSQL). All schema history is in `supabase/migrations/`. Key tables:
`profiles`, `organizations`, `businesses`, `industries`, `professions`, `specialties`, `skills`, `feed_posts`, `feed_comments`, `feed_reactions`, `messages`, `conversations`, `events`, `jobs`, `wac_reviews`, `user_follows`

## Docs

`/docs` contains detailed architecture and design documentation:
- `WAC_PROJECT_CONTEXT.md` — project background
- `WAC_PRODUCT_VISION.md` — product goals
- `WAC_DATABASE_SCHEMA.md` — full schema reference
- `WAC_ARCHITECTURE.md` — system architecture
- `WAC_FEATURE_SPECS.md` — feature specifications

## AI Collaboration & Handoffs (Gemini & Claude Code)

To ensure seamless collaboration between human developers, Gemini 3.1 Pro (planner), and Claude Code (execution):
- **CRITICAL**: Before starting any task, ALWAYS check for and read `docs/ACTIVE_IMPLEMENTATION_PLAN.md`. This is where Gemini outputs the current implementation plan detailing tasks, architecture, and step-by-step logic.
- **CRITICAL**: Before making any Auth or Database structural changes or schemas, ALWAYS read `docs/AUTH_DB_ROADMAP.md` to ensure alignment with our current migration states and RBAC constraints.
- As Gemini, whenever I create an implementation plan, I will maintain a synced copy at `docs/ACTIVE_IMPLEMENTATION_PLAN.md` to execute this handoff automatically.
