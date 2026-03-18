# WAC Platform — System State Report
**Generated:** 2026-03-18 (updated)
**Stack:** Next.js 16.1.6 · React 19.2.3 · TypeScript · Supabase (Postgres + Auth + Storage) · Tailwind CSS v4

---

## 1. AUTH SYSTEM

### Provider
- **Google OAuth** — primary sign-in method
- **Magic Link (Email OTP)** — fallback / alternative
- Callback at `/auth/callback`
- No password-based auth

### Session Model
- Supabase session stored in cookies; `supabase.auth.getUser()` is the canonical check
- `ActorProvider` (client-side context) loads identity on session resolution
- On sign-out: identity state cleared, `wac_active_actor_id` removed from localStorage

### Identity Layers
| Layer | Source | Notes |
|---|---|---|
| `loggedInUserId` | `auth.users.id` | Immutable while signed in |
| `currentActor` | `ActorProvider` context | Person, Business, or Org the user is acting as |
| `ownedEntities` | `entity_roles` table | All identities this user can act as |

### Entity Access
- Governed by `entity_roles` table, not `owner_id` alone
- `create_entity_with_owner` RPC creates entity + owner role atomically (SECURITY DEFINER)
- Pre-migration fallback in `ActorProvider`: if `entity_roles` errors, falls back to `owner_id` queries
- Last-owner guard enforced by Postgres trigger `trg_guard_last_entity_owner`
- Actor selection persisted to `localStorage` key `wac_active_actor_id`

### Key Auth Files
- `lib/supabase.ts` — singleton client
- `components/providers/ActorProvider.tsx` — session + identity context
- `app/login/page.tsx` — login UI
- `app/auth/callback/page.tsx` — OAuth callback handler

---

## 2. DATABASE TABLES

> **Note:** No auto-generated `database.types.ts`. Types maintained manually in `lib/types/`.

### `auth.users` (Supabase managed)
Standard Supabase auth table. `id` is the canonical user identifier throughout.

---

### `profiles`
Personal profile for each authenticated user.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | References auth.users |
| full_name | text | |
| username | text unique | URL slug for `/u/:username` |
| headline | text | Professional headline |
| tagline | text | Short personal tagline |
| avatar_url | text | |
| bio | text | Long-form biography |
| country, state, city | text | Current location |
| ancestry_city | text | Cultural roots |
| street_address, address_line_2, zip_code | text | Private; never shown publicly |
| map_visibility | text | exact / approximate / hidden |
| date_of_birth | date | |
| gender | text | |
| birthday_visibility | text | month_day / age / full / private |
| industry_id | uuid FK → industries | |
| profession_id | uuid FK → professions | |
| specialty_id | uuid FK → specialties | |
| profession | text | Denormalized profession name |
| open_to_work | bool | |
| open_to_hire | bool | |
| open_to_mentor | bool | |
| open_to_invest | bool | |
| open_to_collaborate | bool | |
| is_public | bool | Default true |
| is_verified | bool | Admin-set |

---

### `industries` / `professions` / `specialties`
Reference lookup tables for career classification.

- `industries` (id, name, slug)
- `professions` (id, name, slug, industry_id FK)
- `specialties` (id, name, slug, industry_id FK — Healthcare only currently)

---

### `skills` / `profile_skills`
- `skills` (id, name, category)
- `profile_skills` (profile_id FK, skill_id FK) — many-to-many join

---

### `profile_experiences`
Work history entries per profile.

| Column | Type |
|---|---|
| id | uuid PK |
| profile_id | uuid FK → profiles |
| title, company | text |
| start_date, end_date | date |
| is_current | bool |
| description | text |

---

### `businesses`
Business entity profiles.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → auth.users | Legacy; entity_roles is authoritative post-migration |
| name, slug | text | slug is unique |
| description | text | |
| industry_id | uuid FK | |
| business_type | text | |
| country, state, city | text | |
| website, linkedin, instagram, phone, email | text | |
| employee_count_range | text | |
| founded_year | int | |
| hiring_status | text | |
| logo_url | text | |
| is_public, is_verified | bool | |
| google_maps_url | text | |
| google_rating | numeric | |
| google_reviews_count | int | |
| wac_rating | numeric(3,2) | |
| wac_reviews_count | int | |
| created_at, updated_at | timestamptz | |

---

### `organizations`
Org entity profiles. Same shape as `businesses` with org-specific columns.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → auth.users | Legacy |
| name, slug | text | slug is unique |
| description | text | |
| organization_type | text | |
| country, state, city | text | |
| website, contact_email | text | |
| leader_name | text | |
| logo_url, banner_url | text | |
| is_public, is_verified | bool | |
| google_maps_url | text | |
| google_rating | numeric | |
| google_reviews_count | int | |
| wac_rating | numeric(3,2) | |
| wac_reviews_count | int | |
| created_at, updated_at | timestamptz | |

---

### `entity_roles`
Role-based access control for businesses and organizations.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| entity_type | text | 'business' or 'organization' |
| entity_id | uuid | Points to businesses or organizations |
| role | text | owner / admin / editor / member |
| created_at | timestamptz | |

Trigger: `trg_guard_last_entity_owner` — prevents removing the last owner.

---

### `entity_invites`
Email-bound invite tokens for entity membership.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| entity_type | text | |
| entity_id | uuid | |
| email | text | |
| role | text | Role to be granted on acceptance |
| token | text unique | |
| status | text | pending / accepted / revoked / expired |
| expires_at | timestamptz | +7 days from creation |
| created_by | uuid FK | |
| created_at | timestamptz | |

---

### `feed_posts`
Network feed posts. V1 publishing model active.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| submitted_by | uuid FK → auth.users | Human who submitted |
| author_profile_id | uuid FK → profiles | Legacy |
| author_business_id | uuid FK → businesses | Legacy |
| author_organization_id | uuid FK → organizations | Legacy |
| source_type | text | user / organization / business / group |
| source_id | uuid | Points to the publishing entity |
| content | text | |
| content_type | text | post / event / discussion |
| post_type | text | Legacy: always 'general' |
| post_intent | text | update / announcement / opportunity / job / volunteer |
| image_url | text | |
| cta_url, cta_label | text | Call-to-action link |
| visibility | text | public / followers / members |
| distribute_to_pulse | bool | Show in For You feed |
| distribute_to_following | bool | Show in Following feed |
| display_on_source_wall | bool | Show on entity profile wall |
| linked_group_id | uuid FK → groups | |
| is_pinned | bool | |
| status | text | published / draft / archived / deleted |
| hot_score | numeric | Engagement-weighted score for Top sort |
| repost_count | int | |
| original_post_id | uuid FK → feed_posts | For reposts |
| likes_count, comments_count | int | Denormalized counters |
| created_at, updated_at | timestamptz | |

Indexes: `idx_feed_posts_pulse`, `idx_feed_posts_following`, `idx_feed_posts_status`, `idx_feed_posts_source`

---

### `feed_likes`
Emoji reactions on feed posts.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK → feed_posts | |
| profile_id | uuid FK → profiles | |
| reaction_type | text | like / heart / laugh / fire / applause / smile |
| created_at | timestamptz | |

UNIQUE constraint: (post_id, profile_id) — one reaction per user per post.

---

### `feed_comments`
Nested comment threads on feed posts.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid FK → feed_posts | |
| submitted_by | uuid FK → auth.users | |
| author_profile_id | uuid FK → profiles | |
| author_business_id | uuid FK → businesses | |
| author_organization_id | uuid FK → organizations | |
| parent_id | uuid FK → feed_comments | Nullable; for nesting |
| content | text | |
| created_at, updated_at | timestamptz | |

---

### `comment_reactions`
Emoji reactions on comments.

| Column | Type |
|---|---|
| id | uuid PK |
| comment_id | uuid FK → feed_comments |
| profile_id | uuid FK → profiles |
| reaction_type | text |
| created_at | timestamptz |

---

### `wac_reviews`
User reviews of businesses and organizations.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| reviewer_id | uuid FK → auth.users | |
| target_business_id | uuid FK → businesses | Nullable |
| target_organization_id | uuid FK → organizations | Nullable |
| rating | int | 1–5 |
| content | text | |
| created_at | timestamptz | |

Constraint: one review per user per entity (CHECK ensures only one target set).

---

### `conversations`
DM and group chat threads.

| Column | Type |
|---|---|
| id | uuid PK |
| type | text (direct / group) |
| created_at | timestamptz |

---

### `conversation_participants`
Members of a conversation.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| conversation_id | uuid FK | |
| participant_id | uuid | |
| participant_type | text | user / organization / business |
| joined_at | timestamptz | |

---

### `messages`
Individual messages.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| conversation_id | uuid FK | |
| sender_id | uuid | |
| sender_type | text | user / organization / business |
| sent_by_user_id | uuid FK → auth.users | Human auth id |
| content | text | |
| is_read | bool | |
| created_at | timestamptz | |

---

### `connection_requests`
Follow / connect workflow between users.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| requester_id | uuid FK → auth.users | |
| recipient_id | uuid FK → auth.users | |
| status | text | pending / accepted / declined |
| created_at | timestamptz | |

---

### `group_memberships`
Group join/follow state.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| group_id | uuid | |
| user_id | uuid FK → auth.users | |
| role | text | member / moderator / admin |
| status | text | active / pending / banned |
| created_at | timestamptz | |

---

### `events`
Event listings.

| Column | Type |
|---|---|
| id | uuid PK |
| name, slug | text |
| date, time | text |
| location, city, state, country | text |
| description | text |
| attendees_count | int |
| cover_image_url | text |
| created_at | timestamptz |

---

### `search_history`
(Schema created; UI not yet built)

| Column | Type |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| query | text |
| created_at | timestamptz |

---

## 3. DATABASE VIEWS

| View | Purpose |
|---|---|
| `businesses_directory_v1` | Joined business + industry + ratings for directory queries |
| `organizations_directory_v1` | Joined org + ratings for directory queries |
| `people_directory_v1` | Joined profiles + industry + profession + specialty |
| `people_search_view` | Full-text tsvector search over people |

---

## 4. RPC FUNCTIONS

| Function | Purpose |
|---|---|
| `create_entity_with_owner(p_name, p_slug, p_description, p_entity_type)` | Atomically creates business/org and assigns caller as owner. SECURITY DEFINER. |
| `invite_to_entity(p_entity_type, p_entity_id, p_email, p_role)` | Generate invite token for entity membership |
| `accept_entity_invite(p_token)` | Redeem invite token, create entity_roles row |
| `revoke_entity_role(p_entity_type, p_entity_id, p_user_id)` | Remove a user's role. Blocked by last-owner guard. |
| `get_people_directory_scored(user_id, country, industry, specialty, skills[], ...)` | Returns people with relevance score based on industry/location/skill overlap |
| `wac_get_post_reactions(p_post_id)` | Returns reaction breakdown (emoji → count) for a post |

---

## 5. TRIGGERS

| Trigger | Table | Purpose |
|---|---|---|
| `trg_guard_last_entity_owner` | `entity_roles` | Prevents removing the sole owner of an entity |

---

## 6. STORAGE BUCKETS

| Bucket | Status | Notes |
|---|---|---|
| `feed_media` | **Pending** — `create_feed_media_bucket.sql` not yet run | Required for post image uploads |

---

## 7. ALL ROUTES

### Authentication
| Route | File | Notes |
|---|---|---|
| `/login` | `app/login/page.tsx` | Google OAuth + magic link UI |
| `/auth/callback` | `app/auth/callback/page.tsx` | OAuth redirect handler |

### Core
| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Home — hero, feed preview, events |
| `/terms` | `app/terms/page.tsx` | Terms of service |

### Discovery & Directory
| Route | File | Notes |
|---|---|---|
| `/directory` | `app/directory/page.tsx` | Unified discovery (people, businesses, orgs, events) |
| `/people` | `app/people/page.tsx` | People directory (untracked — not committed) |
| `/people/[username]` | `app/people/[username]/page.tsx` | Public person profile |
| `/businesses` | `app/businesses/page.tsx` | Business directory |
| `/businesses/[slug]` | `app/businesses/[slug]/page.tsx` | Business detail |
| `/organizations` | `app/organizations/page.tsx` | Organization directory |
| `/organizations/[slug]` | `app/organizations/[slug]/page.tsx` | Organization detail |

### Feed & Community
| Route | File | Notes |
|---|---|---|
| `/community` | `app/community/page.tsx` | The Pulse — main feed |
| `/post` | `app/post/page.tsx` | Full-screen composer (hides Navbar) |
| `/notifications` | `app/notifications/page.tsx` | Notification center (placeholder) |
| `/groups` | `app/groups/page.tsx` | Groups hub |

### Events & Calendar
| Route | File | Notes |
|---|---|---|
| `/events` | `app/events/page.tsx` | Events discovery |
| `/events/[id]` | `app/events/[id]/page.tsx` | Event detail |
| `/events/create` | `app/events/create/page.tsx` | Create event |
| `/calendar` | `app/calendar/page.tsx` | Personal calendar |

### Messaging
| Route | File | Notes |
|---|---|---|
| `/messages` | `app/messages/page.tsx` | Conversations list |
| `/messages/[id]` | `app/messages/[id]/page.tsx` | Individual thread |

### Profile & Account
| Route | File | Notes |
|---|---|---|
| `/profile` | `app/profile/page.tsx` | Authenticated user's profile editor |
| `/profile/entities/new` | `app/profile/entities/new/page.tsx` | Create business or org |
| `/profile/entities/[id]` | `app/profile/entities/[id]/page.tsx` | Entity profile editor |

### Guides
| Route | File | Notes |
|---|---|---|
| `/guide/travel` | `app/guide/travel/page.tsx` | Travel guide |
| `/guide/living` | `app/guide/living/page.tsx` | Living guide |
| `/guide/real-estate` | `app/guide/real-estate/page.tsx` | Real estate guide |
| `/guide/real-estate/[id]` | `app/guide/real-estate/[id]/page.tsx` | Property detail |

### Jobs & Talent
| Route | File | Notes |
|---|---|---|
| `/jobs` | `app/jobs/page.tsx` | Job listings (placeholder) |
| `/talent-bench` | `app/talent-bench/page.tsx` | Talent matching (placeholder) |

### API Routes
| Route | File | Notes |
|---|---|---|
| `/api/search/instant` | `app/api/search/instant/route.ts` | Instant search endpoint |

---

## 8. KEY COMPONENTS

### Layout & Navigation
| Component | File | Notes |
|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | Fixed header. Avatar triggers dropdown (desktop) or bottom sheet (mobile) with identity switcher, My Profile, Sign Out. Hidden on `/post`. |
| `MobileBottomNav` | `components/layout/MobileBottomNav.tsx` | 5-item bottom nav. Pulse item has persistent orb treatment. Hidden on `/post`. Hides on scroll-down. |
| `GlobalSearchOverlay` | `components/layout/GlobalSearchOverlay.tsx` | Full-screen AI search modal. Suspense-wrapped. |
| `FloatingMessagingIcon` | `components/layout/FloatingMessagingIcon.tsx` | Floating message FAB with thread list (794 lines) |
| `LanguageToggle` | `components/layout/LanguageToggle.tsx` | Language selector |
| `ConditionalFooter` | `components/layout/ConditionalFooter.tsx` | Hides footer on certain routes |

### Providers
| Component | File | Notes |
|---|---|---|
| `ActorProvider` | `components/providers/ActorProvider.tsx` | Multi-identity context. Loads person + entity roles. Persists to localStorage. Pre-migration owner_id fallback. |

### Feed
| Component | File | Notes |
|---|---|---|
| `FeedList` | `components/feed/FeedList.tsx` | For You / Following tabs. Center ⌄ chevron opens Top / Recent sort menu. Pool filtered by `distribute_to_pulse` vs `distribute_to_following`. |
| `PostCard` | `components/feed/PostCard.tsx` | Full post UI: intent badges, emoji reactions, comments, repost, share, edit/delete |
| `PostComments` | `components/feed/PostComments.tsx` | Nested comment thread with emoji reactions |
| `CreatePostBox` | `components/feed/CreatePostBox.tsx` | Inline post composer in community feed (media upload, actor-aware) |

### Composer (Full-Screen)
| Component | File | Notes |
|---|---|---|
| `ComposePostPage` | `app/post/page.tsx` | Full-screen composer. Modes: Update / Event / Discussion. Photo + CTA link toolbar. Autosaves identity. |

### Community
| Component | File | Notes |
|---|---|---|
| `CommunityHub` | `components/community/CommunityHub.tsx` | Pulse page layout. Acting-as banner desktop-only. Height calc responsive. |
| `WacSpotlightWidget` | `components/community/WacSpotlightWidget.tsx` | Sidebar discovery widget |

### Discovery
| Component | File | Notes |
|---|---|---|
| `GlobalDirectoryFilters` | `components/directory/GlobalDirectoryFilters.tsx` | Filter UI for unified directory |
| `UnifiedResults` | `components/directory/UnifiedResults.tsx` | Tabbed results: people / businesses / orgs / events |

### People
| Component | Notes |
|---|---|
| `PersonCard` | Open-to badges, skills, location, ancestry |
| `PeopleFilters` | Country, industry, specialty, skills, open-to filters |
| `PublicProfile` | Person detail page |

### Businesses / Organizations
| Component | Notes |
|---|---|
| `BusinessCard` | Logo, verified badge, rating, hiring status |
| `OrganizationCard` | Logo, verified badge, rating, location |

### Profile Editors
| Component | Notes |
|---|---|
| `app/profile/page.tsx` | Personal profile editor — autosave, floating save indicator |
| `app/profile/entities/[id]/page.tsx` | Entity profile editor — autosave, single-column, null-safe |
| `app/profile/entities/new/page.tsx` | Create entity form. Calls `create_entity_with_owner` RPC. |

### UI Primitives
| Component | Notes |
|---|---|
| `VerifiedBadge` | Gold checkmark |
| `WacRatingBadge` | WAC platform rating |
| `GoogleRatingBadge` | Google rating |
| `ReactionIcon` | Emoji reaction renderer |
| `WacSelect` | Custom select dropdown |

---

## 9. LIB / SERVICES

### `lib/supabase.ts`
Singleton Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### `lib/services/feedService.ts`
- `togglePostReaction(postId, reactionType)` — add/update/remove emoji reaction
- `toggleCommentReaction()` — emoji reaction on comment
- `deletePost()` — delete feed post
- `editPost()` — update post content
- Reaction types: like / heart / laugh / fire / applause / smile

### `lib/services/searchService.ts`
- `getPeopleDirectory(filters, userId)` — calls `get_people_directory_scored()` RPC
- `getBusinessesDirectory(filters)` — queries `businesses_directory_v1`
- `getOrganizationsDirectory(filters)` — queries `organizations_directory_v1`
- `getEventsDirectory(filters)` — queries events
- State management for filter/results context

### `lib/services/messagingService.ts`
- Conversation create / list / fetch
- Message send / fetch
- Participant management
- Connection requests (send, accept, decline)

### `lib/services/profileService.ts`
- Basic profile read operations

### `lib/hooks/useDebounce.ts`
Standard debounce hook for search inputs.

### `lib/hooks/useScrollDirection.ts`
Tracks scroll direction — used by `MobileBottomNav` to hide on scroll-down.

### `lib/types/`
| File | Exports |
|---|---|
| `network-feed.ts` | `NetworkPost`, `NetworkComment`, `ContentType`, `PostIntent`, `SourceType`, `PostStatus` |
| `business-directory.ts` | `BusinessDirectoryRow` |
| `organization-directory.ts` | `OrganizationDirectoryEntry` |
| `person-directory.ts` | `PersonDirectoryRow` |
| `person.ts` | `Person` |
| `event-directory.ts` | `EventDirectoryEntry` |
| `filters.ts` | `PeopleDirectoryFilters` |

---

## 10. DEPENDENCIES

### Runtime
| Package | Version | Purpose |
|---|---|---|
| `next` | 16.1.6 | Framework |
| `react` / `react-dom` | 19.2.3 | UI |
| `@supabase/supabase-js` | ^2.98.0 | DB + Auth + Storage |
| `lucide-react` | ^0.577.0 | Icons |
| `emoji-picker-react` | ^4.18.0 | Emoji picker for reactions |

### Dev
| Package | Purpose |
|---|---|
| `tailwindcss` v4 + `@tailwindcss/postcss` | CSS |
| `typescript` ^5 | Types |
| `eslint` + `eslint-config-next` | Linting |
| `pg` | PostgreSQL driver (scripts) |
| `dotenv` | Env vars (scripts) |
| `tsx` | Run TypeScript scripts |

---

## 11. ENVIRONMENT & CONFIG

### Required Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### `next.config.ts` — Image remote patterns
```
i.postimg.cc
images.unsplash.com
i.pravatar.cc
```

### Theme (`globals.css`)
- Dark background: `#0a0a0a`
- Accent gold: `#D4AF37`
- CSS variables: `--background`, `--accent`, `--border`, `--card`

---

## 12. RECENT CHANGES (This Session — 2026-03-18)

### Composer (`app/post/page.tsx`)
- Renamed content mode `Post` → `Update` (DB value `post` unchanged)
- Mode selector redesigned: solid gold fill → gold-tint active state (`bg-[var(--accent)]/[0.1]`)
- Removed icons from mode tabs — labels only, `text-[10px]`
- Placeholder updated: Event → `"What's happening?"`, Discussion → `"Start the conversation…"`
- Removed `Save draft` button (drafts have no UI to access them)
- Added `canPublish` guard (requires media upload to finish)
- Added CTA link button to toolbar (all formats, not just events)
- Photo button: icon-only, circular

### Navbar (`components/layout/Navbar.tsx`)
- Desktop: Removed separate identity-switcher pill + profile icon
- Desktop: Single avatar button opens dropdown with identity switcher + My Profile + Sign Out
- Mobile: Avatar opens bottom sheet (same content as desktop dropdown)
- `My Profile` routes: person → `/profile`, entity → `/profile/entities/:id`
- Outside-click on desktop only (`window.innerWidth >= 768` guard)

### Mobile Pulse (`app/community/page.tsx`, `CommunityHub.tsx`)
- Pulse header hidden on mobile (`hidden md:block`)
- Acting-as banner hidden on mobile (`hidden md:flex`)
- CommunityHub height: `h-[calc(100vh-3.5rem)] md:h-[calc(100vh-8.25rem)]`
- Feed top padding: `pt-4 md:pt-6`

### Bottom Nav (`components/layout/MobileBottomNav.tsx`)
- Pulse item gets persistent orb (`w-12 h-12 rounded-full`)
- Active: `bg-[var(--accent)]/[0.14]` gold tint + ring + glow
- Inactive: `bg-white/[0.04]` ghost ring — always distinguishable

### Feed (`components/feed/FeedList.tsx`)
- Tab parameter now used (`_tab` → `tab`)
- Pool distinction: For You = `distribute_to_pulse=true`, Following = `distribute_to_following=true`
- Sort (Top/Recent) applies to both pools
- Sort control: center chevron (`ChevronDown`) between tab labels + explicit `Top`/`Recent` label
- Popover fixed: removed `overflow-hidden` from card (was clipping the sort menu)
- Sort popover centered below chevron, checkmark on active option

### Entity Editor (`app/profile/entities/[id]/page.tsx`)
- Complete redesign aligning with person profile editor
- Single-column `max-w-4xl`, floating autosave indicator
- Null-safe data population (`?? ""` instead of `|| ""`)
- Fixed infinite useEffect loop (removed `type` from deps)
- Calendar URL validation (must contain `ical`, `.ics`, or `calendar.google`)

---

## 13. PENDING SQL MIGRATIONS

These files exist in the project root but need to be run in the Supabase SQL editor:

| File | What it enables | Impact if missing |
|---|---|---|
| `add_entity_roles.sql` | `entity_roles` table, RPCs, invite system | ActorProvider uses owner_id fallback; invite flow broken |
| `v1_publishing_system.sql` | `source_type`, `source_id`, `content_type`, distribution flags | Composer inserts may fail; feed filtering broken |
| `create_feed_media_bucket.sql` | `feed_media` storage bucket | Post image uploads fail silently |
| `add_skills_filter_rpc.sql` | `get_people_directory_scored()` RPC | People directory returns 0 results |
| `wac_get_post_reactions.sql` | Reaction breakdown RPC | Reactions modal shows no data |
| `update_feed_reactions.sql` | `reaction_type` column on `feed_likes` | Emoji reactions fail; only boolean likes work |

---

## 14. CURRENT GAPS & KNOWN ISSUES

### No follows/followers table
- `Following` tab in feed currently filters by `distribute_to_following = true` (author intent)
- Not filtered to accounts the user actually follows
- `connection_requests` table exists but no follow-specific table
- **Impact:** Following tab shows same content as For You, not personalized

### No drafts UI
- `Save draft` button removed from composer (intentional)
- Drafts can be inserted with `status='draft'` but no UI to view/resume/delete them
- **Needed:** `/drafts` route or profile drafts section

### Entity editor uses owner_id filter (pre-migration)
- `/profile/entities/[id]` still queries by `owner_id` for some operations
- Should use `entity_roles` after `add_entity_roles.sql` is confirmed run

### No invite acceptance UI
- `accept_entity_invite` RPC exists
- No route or component for the invitation acceptance flow

### No entity member management UI
- `entity_roles` can be queried but no UI for managing team members

### Auth holes
- Some pages load without auth check at component level (rely on Supabase RLS)
- No Next.js middleware for redirect-on-unauthenticated

### Placeholder pages
- `/notifications` — empty skeleton
- `/jobs` — empty skeleton
- `/talent-bench` — empty skeleton
- `/groups` — partial (GroupsHub component exists, limited functionality)
- `/calendar` — partial (MyCalendar component, no Supabase integration)

### No real-time
- Feed does not update in real-time (manual refresh trigger)
- Messages have no Supabase Realtime subscription

### No error boundaries
- No `error.tsx` files in any route segment
- Errors surface as blank pages or console logs

### Hardcoded notification count
- `MobileBottomNav` Alerts badge shows hardcoded `3`
- Messages FAB shows hardcoded `2` unread badge

### Feed `hot_score` column
- Used for Top sort ordering but no scoring function implemented
- All posts may have same `hot_score` (null or 0), making Top = insertion order

---

## 15. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────────────┐   │
│  │  Navbar     │   │ MobileBottom │   │  ActorProvider        │   │
│  │  (desktop   │   │ Nav          │   │  (currentActor,       │   │
│  │  dropdown + │   │ (Pulse orb   │   │   ownedEntities,      │   │
│  │  mobile     │   │  active)     │   │   loggedInUserId)     │   │
│  │  sheet)     │   └──────────────┘   └───────────────────────┘   │
│  └─────────────┘                                                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Pages                                                      │   │
│  │  /community → CommunityHub → FeedList → PostCard           │   │
│  │  /post      → ComposePostPage (Update/Event/Discussion)    │   │
│  │  /directory → UnifiedDiscovery → People/Biz/Org/Events     │   │
│  │  /profile   → PersonProfileEditor (autosave)               │   │
│  │  /profile/entities/[id] → EntityProfileEditor (autosave)   │   │
│  │  /messages  → MessagingService → conversations/messages    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ Supabase JS SDK
┌────────────────────────────────▼────────────────────────────────────┐
│  Supabase                                                           │
│                                                                     │
│  Auth (Google OAuth, Magic Link)                                    │
│                                                                     │
│  Postgres                                                           │
│  ├── profiles, industries, professions, specialties, skills        │
│  ├── businesses, organizations                                      │
│  ├── entity_roles, entity_invites                                   │
│  ├── feed_posts, feed_likes, feed_comments, comment_reactions      │
│  ├── conversations, messages, connection_requests                   │
│  ├── events, group_memberships, search_history, wac_reviews        │
│  ├── Views: businesses_directory_v1, organizations_directory_v1    │
│  │          people_directory_v1, people_search_view                │
│  └── RPCs: create_entity_with_owner, get_people_directory_scored   │
│            invite_to_entity, accept_entity_invite, revoke_role     │
│            wac_get_post_reactions                                   │
│                                                                     │
│  Storage                                                            │
│  └── feed_media (PENDING — bucket not created)                     │
└─────────────────────────────────────────────────────────────────────┘
```
