# World Albanian Congress — Master Architecture

This document describes the technical architecture of the WAC platform.

The goal is to build a scalable network platform for the Albanian diaspora using modern web technologies.

---

# Technology Stack

Frontend

- Next.js (App Router)
- TypeScript
- TailwindCSS

Backend

- Supabase
- PostgreSQL
- Row Level Security (RLS)

Authentication

- Supabase Auth
- Google OAuth

Hosting

- Vercel

Infrastructure Goals

- simple deployment
- scalable architecture
- secure database access
- structured relational data

---

# System Architecture Overview

The platform is structured as a web application with the following layers:

Frontend

Next.js application providing UI and routing.

Backend

Supabase providing:

- authentication
- database
- storage
- API access

Database

PostgreSQL relational schema supporting the network graph.

---

# Core Architectural Principles

## No Orphan Content
Every post, activity item, discussion, or update in the platform must belong to a meaningful network object. Valid parent objects include:
- person/profile
- business
- organization
- event
- opportunity
- community

The platform should not evolve into a generic social feed with floating content disconnected from the ecosystem. All engagement systems must remain permanently anchored to structured network entities.

---

# Core Data Entities

The platform revolves around three core entity types.

People  
Businesses  
Organizations

Each entity is stored in a separate database table.

This separation keeps the schema clean and scalable.

---

# Database Tables

## Users

Handles authentication and account management.

Fields

- id
- email
- created_at

Auth is managed through Supabase.

---

## Profiles

Represents individual members.

Fields

- id
- user_id
- username
- full_name
- headline
- profession
- company
- bio
- country
- state
- city
- ancestry_country
- ancestry_city
- ancestry_village
- avatar_url
- website
- linkedin
- is_public
- is_verified
- industry_id
- open_to_work
- open_to_hire
- open_to_mentor
- open_to_invest
- open_to_collaborate

Profiles power the People Directory.

---

## Industries

Standardized industry categories.

Fields

- id
- name
- slug
- parent_industry_id

This allows hierarchical industry classification.

---

## Skills

Standardized skill taxonomy.

Fields

- id
- name
- slug
- category

Skills should be controlled vocabulary.

---

## Profile Skills

Join table connecting profiles to skills.

Fields

- id
- profile_id
- skill_id
- proficiency_level
- years_experience

---

## Businesses

Businesses owned by members.

Fields

- id
- owner_id
- name
- slug
- description
- industry_id
- business_type
- country
- state
- city
- website
- linkedin
- is_public
- is_verified

---

## Organizations

Community organizations.

Fields

- id
- owner_id
- name
- slug
- description
- organization_type
- country
- state
- city
- website
- is_public
- is_verified

---

## Help Requests

Community requests and opportunities.

Fields

- id
- created_by_user_id
- title
- description
- request_type
- industry_id
- city
- state
- country
- urgency_level
- status
- created_at

---

## Help Request Responses

Responses to help requests.

Fields

- id
- help_request_id
- responder_user_id
- message
- created_at

---

# Core Application Routes

The platform will include the following routes.
