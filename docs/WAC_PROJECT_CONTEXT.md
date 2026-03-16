# World Albanian Congress — Project Context

## Project Overview

World Albanian Congress (WAC) is a global Albanian professional and community network platform designed to connect individuals, businesses, organizations, and opportunities across the Albanian diaspora.

The platform functions as a combination of:

- Professional directory
- Business network
- Community hub
- Opportunity exchange
- Diaspora coordination platform

## Technology Stack

- Next.js
- TypeScript
- TailwindCSS
- Supabase
- PostgreSQL
- Google OAuth
- Vercel

## Current Development Status

The platform is currently in early MVP development.

The profile system is the foundation.

Structured profile fields are implemented in this order:

- Industry
- Profession
- Company
- Specialty
- Skills

Skills use mobile-friendly tap/checkbox selection instead of a long multi-select.

Healthcare professions and specialties have a structured model.

The database includes:

- industries
- professions
- specialties
- skills

## Current Immediate Task

Update the People Directory to use the new structured profile fields.

Files/pages involved:

- people_directory_v1
- /people
- /people/[username]

## Display Priority for Public Profile

Display order should prioritize personal identity first:

1. Name
2. Headline
3. Company + Title
4. Location
5. Roots / ancestry

Headline should supersede the most recent job title on profile cards.

## Coding Rules

- Prefer full file replacements, not partial snippets
- Keep components modular where reasonable
- Maintain compatibility with Supabase schema
- Do not add unnecessary libraries
- Focus on shipping working features first