# World Albanian Congress — Feature Specifications

This document defines the intended behavior of major WAC platform features.

Its purpose is to help developers and AI coding agents understand:

- what each feature is supposed to do
- how users should interact with it
- how the UI should behave
- what the priority level is

This is a functional product specification, not a marketing document.

---

# Product Scope

WAC is a structured diaspora network platform.

It is not intended to behave like a generic social media feed.

The product should emphasize:

- identity
- discoverability
- search
- opportunity
- coordination
- trust

The goal is to help Albanians globally find each other, work together, and build stronger professional and community connections.

---

# Feature Priority Levels

## Priority 1 — Core Platform Foundation

These features are most important for current development.

- Authentication
- Structured profiles
- People Directory
- Public profile pages
- Search and filtering

## Priority 2 — Network Expansion

These features come after the people directory works well.

- Businesses
- Organizations
- Ask the Network

## Priority 3 — Coordination Layer

These features deepen network value.

- Events
- Notifications
- Messaging
- Saved searches

## Priority 4 — Intelligence Layer

These features make the platform feel powerful and strategic.

- recommendations
- network graphing
- mentorship matching
- investor-founder matching
- referral mapping

---

# Feature: Authentication

## Purpose

Allow users to create accounts and sign in securely.

## Current Stack

- Supabase Auth
- Google OAuth

## Behavior

Users should be able to:

- sign up
- sign in
- sign out
- continue into onboarding/profile completion

## Notes

Do not overcomplicate authentication early.

Social sign-in should be clean and easy.

---

# Feature: Profile Onboarding

## Purpose

Collect enough structured information to make a user discoverable.

## Required Profile Input Order

1. Industry
2. Profession
3. Company
4. Specialty
5. Skills

## Required Fields

- full name
- username
- location
- one industry
- one skill or skill group
- at least one open-to flag

## Optional Fields

- bio
- ancestry fields
- website
- linkedin
- avatar
- headline

## UX Guidelines

- keep the form simple
- avoid overwhelming the user
- use structured selections whenever possible
- skills should remain mobile friendly

## Notes

The onboarding flow should optimize for completion and discoverability, not perfection.

---

# Feature: Profiles

## Purpose

Provide a structured, discoverable public identity for members.

## Core Profile Fields

- full name
- username
- headline
- profession
- company
- specialty
- industry
- skills
- city
- state
- country
- ancestry_country
- ancestry_city
- ancestry_village
- bio
- avatar
- links
- open-to flags
- verification state

## Public Profile Display Priority

1. Name
2. Headline
3. Company + Title
4. Location
5. Roots / ancestry

Headline should supersede raw job title when both exist.

## Hero Card Should Show

- avatar
- name
- verification badge
- headline
- company + title
- location
- roots
- open-to badges

## Notes

Profiles should feel like identity cards for the network, not resume dumps.

---

# Feature: People Directory

## Purpose

Allow users to discover members of the diaspora by structured attributes.

## Core Use Cases

- find Albanians in a certain industry
- find members in a certain city or state
- find mentors
- find recruiters
- find professionals with specific skills
- discover people open to work or collaboration

## Route

/people

## Display Format

Default view should show profile cards.

Each card should include:

- avatar
- full name
- verification badge if applicable
- headline
- company + title
- city/state/country
- roots if available
- top skills
- open-to badges

## Filters

The directory should support:

- keyword search
- industry
- profession
- specialty
- skill
- country
- state
- city
- verified only
- open_to_work
- open_to_hire
- open_to_mentor
- open_to_invest
- open_to_collaborate

## Sorting

Initial sort options may include:

- relevance
- recently updated
- alphabetical

Later sort options may include:

- most connected
- most active
- verified first

## Empty State

If no users match, show a clean empty state that suggests changing filters.

Do not show broken or awkward empty layouts.

## Notes

This is one of the most important features in the entire platform.

---

# Feature: Public Profile Page

## Purpose

Allow a member to have a clean public-facing page that can be searched, viewed, and shared.

## Route

/people/[username]

## Public Sections

- hero card
- about
- professional details
- skills
- roots / ancestry
- links
- opportunity flags

## Hero Card Priority

1. avatar
2. full name
3. verification badge
4. headline
5. company + title
6. location
7. ancestry/roots
8. open-to badges

## Additional Section Ideas

### About
Short bio and summary.

### Career / Professional Identity
Industry, profession, specialty, company.

### Skills
Structured chips or grouped skills.

### Roots
Ancestry fields if user chooses to display them.

### Links
LinkedIn, website, social links.

## Notes

Public profiles should feel professional and trustworthy.

---

# Feature: Search

## Purpose

Allow users to find relevant people, businesses, or organizations quickly.

## Route

/search

## Search Scope

Eventually this route should support searching across:

- people
- businesses
- organizations
- asks
- events

## MVP Search Scope

Start with people only.

## Search Behavior

- keyword search
- filtering
- structured taxonomy-based matching
- public records only

## Notes

Search should be one of the strongest parts of the product.

This is not a feed-driven app. Discovery is the engine.

---

# Feature: Businesses

## Purpose

Allow Albanian-owned or Albanian-operated businesses to be discovered.

## Route

/businesses

## Core Business Fields

- business name
- business type
- description
- industry
- location
- website
- social links
- hiring status
- verification status

## Business Directory Card

Each card should include:

- business name
- category/business type
- location
- short description
- verification badge if applicable

## Core Filters

- industry
- business type
- country
- state
- city
- hiring
- verified

## Notes

Businesses must remain separate from people.

Do not collapse them into profile records.

---

# Feature: Organizations

## Purpose

Allow community and nonprofit organizations to be visible and searchable.

## Route

/organizations

## Core Organization Fields

- name
- organization type
- description
- location
- website
- leadership/contact info
- verification state

## Organization Card

Each card should include:

- organization name
- organization type
- location
- short description
- verification if applicable

## Filters

- organization type
- city
- state
- country
- verified

## Notes

Organizations are not businesses and should be handled separately.

---

# Feature: Ask the Network

## Purpose

Create active collaboration and problem-solving across the diaspora.

## Route

/ask

## Core Use Cases

- looking for a mentor
- looking for a recruiter
- hiring help
- legal referrals
- business partnerships
- relocation help
- investment introductions

## Ask Fields

- title
- description
- request type
- industry
- location
- urgency
- status

## Responses

Users should be able to respond to asks.

Each ask can have multiple responses.

## Notes

This feature is one of the most important network activation tools.

It makes the platform useful even before deep social features exist.

---

# Feature: Open-To Flags

## Purpose

Turn passive profiles into actionable opportunity profiles.

## Flags

- open_to_work
- open_to_hire
- open_to_mentor
- open_to_invest
- open_to_collaborate

## Display

Open-to flags should appear as badges on:

- profile cards
- public profile hero sections

## Search

Each flag should be filterable in the People Directory.

## Notes

These flags are critical because they show what a user is willing to do, not just who they are.

---

# Feature: Verification

## Purpose

Build trust across the network.

## Applicable Entities

- people
- businesses
- organizations

## UI Behavior

Verified entities should show a clean verification badge.

Do not overdesign the badge.

## Notes

Trust is critical in a diaspora platform. Verification should become more important as the network grows.

---

# Feature: Events

## Purpose

Support networking, gatherings, conferences, and community coordination.

## Route

/events

## Event Fields

- title
- description
- event type
- host organization or business
- location
- start and end time
- registration link
- visibility

## Notes

Events should come after core directories are working.

---

# Feature: Notifications

## Purpose

Keep users informed about relevant opportunities and activity.

## Future Notification Types

- someone responded to your ask
- new member matches your filters
- event posted in your region
- organization update
- verification status changed

## Notes

Do not build a bloated notification system too early.

---

# Feature: Messaging

## Purpose

Allow direct communication between members.

## Notes

This should not be an early priority.

The platform should prove value through search, profiles, and asks before direct messaging is built.

---

# Feature: Saved Searches

## Purpose

Let users save discovery patterns.

## Example Saved Searches

- pharma professionals in New Jersey
- Albanian recruiters open to mentoring
- businesses hiring in Michigan

## Notes

This feature becomes powerful once search and notifications exist.

---

# UI Design Principles

1. Personal identity first
2. Structured information second
3. Keep layouts clean
4. Avoid clutter
5. Prioritize usability over decoration
6. Mobile-friendliness matters

---

# What Makes WAC Valuable

The platform becomes valuable when users can:

- find the right people
- find the right businesses
- identify opportunity
- act on connection

The product should not optimize for endless scrolling.

It should optimize for useful discovery and action.

---

# Guidance for AI Coding Agents

When implementing features:

1. Follow the priority levels in this document.
2. Do not skip ahead to lower-priority features without reason.
3. Preserve separation between people, businesses, and organizations.
4. Use structured data where available.
5. Keep public profile display hierarchy consistent.
6. Focus first on the People Directory and profile pages.

---

# Current Immediate Focus

The current immediate focus is:

- structured profiles
- People Directory
- public profile pages
- search and filtering

These features should be considered the highest product priority.