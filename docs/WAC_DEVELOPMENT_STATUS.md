# World Albanian Congress — Development Status

This document describes the current state of development for the WAC platform.

Its purpose is to ensure developers and AI coding agents understand:

- what has already been completed
- what is currently being worked on
- what should be built next

Do not assume features exist unless they are listed as completed here.

---

# Current Platform Stack

Frontend

- Next.js (App Router)
- TypeScript
- TailwindCSS

Backend

- Supabase
- PostgreSQL
- Row Level Security

Authentication

- Google OAuth via Supabase

Hosting

- Vercel

---

# Current Database Foundation

The following structured tables exist or are actively in use:

profiles  
industries  
professions  
specialties  
skills  
profile_skills  
businesses

These support the structured professional profile system and business network.

The system intentionally uses **taxonomy tables** to prevent uncontrolled free-text fields.

---

# Completed Milestones

Phase 1 is complete:
- Authentication & Onboarding
- Structured Profiles
- People Directory
- Search (Phase 1)
- 'Who Should I Know?' Opportunity Graph logic

Phase 2 is partially complete:
- **Businesses Directory is complete**
- Organizations (Next)
- Ask the Network (Next)

---

# Profile Fields Currently Used

Profiles currently include fields such as:

username  
gender  
profession  
company  
bio  
country  
state  
city  
ancestry_country  
ancestry_city  
ancestry_village  
avatar_url  
website  
linkedin  
is_public  
is_verified  

Additional structured fields may include:

industry_id  
profession_id  
specialty_id  

Profiles also support "open-to" flags.

---

# Open-To Flags

Profiles include optional flags for opportunity matching.

open_to_work  
open_to_hire  
open_to_mentor  
open_to_invest  
open_to_collaborate  

These fields will later power search filters and recommendation systems.

---

# Public Profile Design

Public profile pages should prioritize identity first.

Display order:

1. Name
2. Headline
3. Company + Title
4. Location
5. Roots / ancestry

Example layout

Alban Musa  
Founder of World Albanian Congress • Pharmaceutical Sales Strategist

AbbVie • Senior GI Representative  
New Jersey, USA  
Roots: Struga

The headline should take priority over the raw job title.

---

# Next Development Phase

Phase 2 (Continued)

Organizations  
Ask the Network

Phase 3

Events  
Messaging  
Notifications

Phase 4

Mentorship matching  
Investor network  
Diaspora map  

---

# What Should NOT Be Built Yet

Avoid building the following features before the directory is stable.

Messaging systems  
Complex social feeds  
Advanced analytics  
Overly complex homepage features  

The focus should remain on **discoverability and connection**.

---

# Development Priorities

Short-term priorities:

1. Finalize Phase 2 (Organizations, Ask the Network)
2. Expand Global Search to include Businesses and Organizations

The platform should demonstrate real discovery value before expanding feature scope.

---

# Guidance for AI Coding Agents

Before modifying the codebase:

1. Read this file.
2. Confirm the current milestone.
3. Avoid rebuilding completed systems.
4. Focus on the Phase 2 goals.

Major architecture changes should be confirmed before implementation.

---

# Current Goal

The immediate objective is:

**Deploy the Organizations directory and the 'Ask the Network' hub to finalize Phase 2.**

Once this works, the platform has achieved its foundation for community collaboration.