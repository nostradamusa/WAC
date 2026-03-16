# World Albanian Congress — Database Schema

This document describes the current and planned database structure for the WAC platform.

The purpose of this file is to help developers and AI coding agents understand:

- which tables exist
- what each table is for
- how tables relate to each other
- what fields are expected
- which parts are current vs planned

This platform is built on:

- Supabase
- PostgreSQL
- Row Level Security (RLS)

The schema is designed for a structured diaspora network platform, not a generic social media app.

---

# Schema Status Notes

This file contains a mix of:

- current tables already in use
- current structured taxonomy tables
- near-term planned tables that align with the architecture

AI agents must not assume every planned table already exists in production.

When modifying code, always verify against the live database before making destructive changes.

---

# Core Principles

1. Keep People, Businesses, and Organizations as separate entities.
2. Prefer structured taxonomy tables over uncontrolled free text.
3. Use join tables for many-to-many relationships.
4. Design for discoverability, filtering, and search.
5. Preserve compatibility with Supabase and RLS.

---

# Current Core Entity: Profiles

## Table: `profiles`

This is the main member identity table for individual users.

Each authenticated user may have one primary profile.

### Purpose

Stores public-facing member profile data used for:

- people directory
- public profile pages
- profile onboarding
- search and discovery

### Fields

- `id`
  - uuid
  - primary key

- `username`
  - text
  - unique username used in public URLs

- `gender`
  - text or nullable text
  - optional

- `profession`
  - text or foreign-key-backed display field depending on implementation stage
  - user-facing profession label

- `company`
  - text
  - current company display field

- `bio`
  - text
  - profile summary

- `country`
  - text
  - current country of residence

- `state`
  - text
  - current state or region

- `city`
  - text
  - current city

- `ancestry_country`
  - text
  - Albanian roots country or region

- `ancestry_city`
  - text
  - ancestry city

- `ancestry_village`
  - text
  - ancestry village

- `avatar_url`
  - text
  - profile image URL

- `website`
  - text
  - external website

- `linkedin`
  - text
  - LinkedIn URL

- `is_public`
  - boolean
  - whether profile is visible in public directory/search

- `is_verified`
  - boolean
  - whether profile has been verified by platform/admin

### Structured fields currently in active use

The profile flow has been updated to support structured fields in this order:

- Industry
- Profession
- Company
- Specialty
- Skills

### Recommended / active extended fields

Depending on migration progress, the following fields should exist or be added:

- `full_name`
  - text
  - display name for member

- `headline`
  - text
  - short personal/professional brand line
  - this should take priority over raw job title in profile cards

- `industry_id`
  - uuid or bigint foreign key to `industries`
  - structured industry reference

- `profession_id`
  - uuid or bigint foreign key to `professions`
  - structured profession reference

- `specialty_id`
  - uuid or bigint foreign key to `specialties`
  - structured specialty reference

### Open-to flags

These fields are important for engagement and search:

- `open_to_work`
  - boolean

- `open_to_hire`
  - boolean

- `open_to_mentor`
  - boolean

- `open_to_invest`
  - boolean

- `open_to_collaborate`
  - boolean

### Notes

- `headline` should supersede the most recent job title on cards and public profile hero sections.
- `profession` may remain as display text while `profession_id` becomes the structured backend source.
- `company` is currently fine as text, even if later linked to a business entity.

---

# Current Taxonomy Tables

These tables support structured profiles and search.

---

## Table: `industries`

Standardized industries for structured filtering and classification.

### Purpose

Prevents chaos from users typing random versions of the same industry.

### Fields

- `id`
  - primary key

- `name`
  - text
  - display name

- `slug`
  - text
  - URL-safe unique identifier

- `parent_industry_id`
  - nullable foreign key to `industries.id`
  - supports hierarchy

### Examples

- healthcare
- pharma
- biotech
- finance
- construction
- hospitality
- legal
- technology

### Notes

Supports future hierarchy such as:

- Healthcare
  - Pharma
  - Biotech

---

## Table: `professions`

Standardized professions for structured member identity.

### Purpose

Allows consistent profession selection instead of uncontrolled free text.

### Fields

- `id`
  - primary key

- `industry_id`
  - foreign key to `industries.id`
  - optional depending on implementation

- `name`
  - text
  - profession label

- `slug`
  - text
  - unique identifier

- `sort_order`
  - integer or nullable integer
  - controls display order in UI

- `is_active`
  - boolean
  - whether profession is selectable

### Examples

- software engineer
- physician
- attorney
- pharmaceutical sales representative
- recruiter
- entrepreneur

---

## Table: `specialties`

Structured specialties connected to professions.

### Purpose

Adds a more precise layer beneath profession, especially useful in healthcare and other specialized industries.

### Fields

- `id`
  - primary key

- `profession_id`
  - foreign key to `professions.id`

- `name`
  - text
  - specialty name

- `slug`
  - text
  - unique identifier

- `sort_order`
  - integer or nullable integer

- `is_active`
  - boolean

### Examples

For healthcare:
- gastroenterology
- rheumatology
- cardiology

For engineering:
- frontend
- backend
- DevOps

---

## Table: `skills`

Structured skill taxonomy.

### Purpose

Supports skill-based search, filtering, and profile enrichment.

### Fields

- `id`
  - primary key

- `name`
  - text
  - skill name

- `slug`
  - text
  - unique identifier

- `category`
  - text or nullable text
  - optional grouping

- `sort_order`
  - integer or nullable integer

- `is_active`
  - boolean

### Examples

- pharmaceutical sales
- JavaScript
- recruiting
- financial analysis
- project management
- construction management

### Notes

Do not allow skills to become uncontrolled free text unless explicitly designed for that.

---

# Join Tables

---

## Table: `profile_skills`

Connects profiles to skills.

### Purpose

Many-to-many relationship between member profiles and skill records.

One profile can have many skills.
One skill can belong to many profiles.

### Fields

- `id`
  - primary key

- `profile_id`
  - foreign key to `profiles.id`

- `skill_id`
  - foreign key to `skills.id`

- `proficiency_level`
  - nullable text or enum-like text
  - examples: beginner, intermediate, advanced, expert

- `years_experience`
  - nullable numeric or integer

- `created_at`
  - timestamp

### Notes

This table is critical for directory filtering and future recommendation systems.

---

# Planned Core Entity Tables

These are part of the approved architecture even if not fully implemented yet.

---

## Table: `businesses`

Stores Albanian-owned or Albanian-operated businesses.

### Purpose

Supports business discovery, business directory pages, and future hiring/service features.

### Fields

- `id`
  - primary key

- `owner_id`
  - foreign key to authenticated user or profile owner

- `name`
  - text
  - business name

- `slug`
  - text
  - URL-safe identifier

- `description`
  - text

- `industry_id`
  - foreign key to `industries.id`

- `business_type`
  - text
  - category of business

- `country`
  - text

- `state`
  - text

- `city`
  - text

- `website`
  - text

- `linkedin`
  - text

- `instagram`
  - text or nullable text

- `phone`
  - text or nullable text

- `email`
  - text or nullable text

- `employee_count_range`
  - text or nullable text

- `founded_year`
  - integer or nullable integer

- `hiring_status`
  - text or nullable text

- `is_public`
  - boolean

- `is_verified`
  - boolean

- `created_at`
  - timestamp

- `updated_at`
  - timestamp

### Examples

- pizzeria
- law firm
- recruiting agency
- construction company
- startup
- medical practice

---

## Table: `organizations`

Stores organizations, nonprofits, community groups, and associations.

### Purpose

Supports community coordination and organization discovery.

### Fields

- `id`
  - primary key

- `owner_id`
  - foreign key to authenticated user or org manager

- `name`
  - text

- `slug`
  - text

- `description`
  - text

- `organization_type`
  - text

- `country`
  - text

- `state`
  - text

- `city`
  - text

- `website`
  - text

- `contact_email`
  - text or nullable text

- `leader_name`
  - text or nullable text

- `is_public`
  - boolean

- `is_verified`
  - boolean

- `created_at`
  - timestamp

- `updated_at`
  - timestamp

### Examples

- nonprofit
- student association
- chamber of commerce
- cultural association
- religious organization
- professional association

---

# Community Engagement Tables

---

## Table: `help_requests`

Stores requests posted by users to the network.

### Purpose

Drives engagement and opportunity exchange.

This is a core feature of the “Ask the Network” system.

### Fields

- `id`
  - primary key

- `created_by_user_id`
  - foreign key to auth user

- `title`
  - text

- `description`
  - text

- `request_type`
  - text

- `industry_id`
  - nullable foreign key to `industries.id`

- `city`
  - nullable text

- `state`
  - nullable text

- `country`
  - nullable text

- `urgency_level`
  - nullable text

- `status`
  - text
  - examples: open, closed, fulfilled

- `created_at`
  - timestamp

- `updated_at`
  - timestamp

### Example request types

- job_search
- hiring
- mentorship
- referral
- legal_help
- business_service
- relocation_help
- investment
- partnership

---

## Table: `help_request_responses`

Stores responses to help requests.

### Purpose

Allows community members to respond to posted asks.

### Fields

- `id`
  - primary key

- `help_request_id`
  - foreign key to `help_requests.id`

- `responder_user_id`
  - foreign key to auth user

- `message`
  - text

- `is_best_response`
  - boolean or nullable boolean

- `created_at`
  - timestamp

---

# Future Event System

---

## Table: `events`

Stores events hosted by organizations, businesses, or members.

### Purpose

Supports networking, conferences, local meetups, and diaspora events.

### Fields

- `id`
  - primary key

- `organization_id`
  - nullable foreign key to `organizations.id`

- `business_id`
  - nullable foreign key to `businesses.id`

- `created_by_user_id`
  - foreign key to auth user

- `title`
  - text

- `description`
  - text

- `event_type`
  - text

- `country`
  - text

- `state`
  - text

- `city`
  - text

- `venue`
  - nullable text

- `starts_at`
  - timestamp

- `ends_at`
  - timestamp

- `registration_url`
  - nullable text

- `visibility`
  - text

- `created_at`
  - timestamp

### Examples

- networking event
- community gathering
- professional meetup
- student event
- mentoring session

---

# Verification / Trust Layer

---

## Table: `verifications`

Stores verification records for people, businesses, or organizations.

### Purpose

Creates platform trust and credibility signals.

### Fields

- `id`
  - primary key

- `entity_type`
  - text
  - examples: profile, business, organization

- `entity_id`
  - uuid or bigint
  - ID of entity being verified

- `verification_type`
  - text
  - examples: email_verified, linkedin_verified, business_verified, community_verified

- `status`
  - text
  - examples: pending, approved, rejected

- `reviewed_at`
  - nullable timestamp

- `notes`
  - nullable text

---

# Key Relationships

This section describes the intended relationships.

## Users to Profiles

- one user → one primary profile

## Profiles to Skills

- one profile → many skills through `profile_skills`
- one skill → many profiles through `profile_skills`

## Industries to Professions

- one industry → many professions

## Professions to Specialties

- one profession → many specialties

## Users to Businesses

- one user → many businesses

## Users to Organizations

- one user → many organizations

## Users to Help Requests

- one user → many help requests

## Help Requests to Responses

- one help request → many responses

---

# Public Search Implications

The schema is intentionally designed to support searches like:

- Find Albanians in pharma in New Jersey
- Find Albanian recruiters open to mentoring
- Find Albanian-owned businesses in construction
- Find student organizations in Michigan
- Find professionals with a certain specialty

This is why structured fields matter.

---

# RLS Guidance

These are the intended access patterns.

## Profiles

- public can read profiles where `is_public = true`
- users can update only their own profile
- admins can verify profiles

## Profile Skills

- readable when parent profile is public
- editable only by profile owner or admin

## Businesses

- public can read businesses where `is_public = true`
- owners can manage their own businesses
- admins can verify or moderate

## Organizations

- public can read organizations where `is_public = true`
- owners/admins can manage records

## Help Requests

- authenticated users can create
- public read rules depend on platform decision
- owners/admins can update/close

---

# Current Product-Building Priority

The immediate schema-backed milestone is:

Users can sign up, complete a structured profile, and appear in the People Directory.

That means the most important current tables are:

- `profiles`
- `industries`
- `professions`
- `specialties`
- `skills`
- `profile_skills`

These should be considered the most stable and highest priority for current implementation work.

---

# Guidance for AI Coding Agents

Before making changes related to the database or data-driven UI:

1. Read this file completely.
2. Verify whether a table is current or planned.
3. Do not invent new columns unless explicitly requested.
4. Prefer existing taxonomy structures over new free-text fields.
5. Keep People, Businesses, and Organizations separate.
6. Preserve compatibility with existing profile flows and structured field order.

---

# Current Structured Profile Order

The current profile flow follows this order:

1. Industry
2. Profession
3. Company
4. Specialty
5. Skills

This order should be respected in profile creation, editing, and display logic unless explicitly changed.

---

# Current Public Profile Display Priority

For public profile cards and hero sections, use this display hierarchy:

1. Name
2. Headline
3. Company + Title
4. Location
5. Roots / ancestry

Headline should supersede raw job title where both exist.

---

# Final Note

This schema is intended to support a scalable Albanian diaspora network platform that combines:

- professional discovery
- business discovery
- organizational coordination
- opportunity exchange
- long-term ecosystem growth

Treat the schema as infrastructure, not decoration.