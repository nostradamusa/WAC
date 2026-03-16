# AI Agent Startup Instructions

Before making any changes to this repository you MUST complete the following steps.

Do not begin coding until these files are read and understood.

---

# Step 1 — Read Project Context

Read the following files in order:

docs/WAC_PROJECT_CONTEXT.md  
docs/WAC_PRODUCT_VISION.md  
docs/WAC_MASTER_ARCHITECTURE.md  

These documents describe:

- the purpose of the platform
- the system architecture
- the database structure
- the long-term vision

This project is a **diaspora professional network platform**, not a generic social network.

---

# Step 2 — Understand the Technology Stack

Frontend

Next.js (App Router)  
TypeScript  
TailwindCSS  

Backend

Supabase  
PostgreSQL  
Row Level Security

Auth

Supabase Auth  
Google OAuth

Hosting

Vercel

Do not attempt to convert the project to a different framework.

---

# Step 3 — Understand Core Entities

The platform revolves around three primary entities.

People  
Businesses  
Organizations

These are separate tables and must remain separate.

The database schema is designed to support a relational network.

Do not merge these entities into a single table.

---

# Step 4 — Coding Rules

Follow these rules when modifying the codebase.

1. Prefer full file replacements instead of partial code snippets.

2. Do not rewrite working code unless specifically requested.

3. Do not introduce unnecessary libraries.

4. Maintain compatibility with the existing Supabase schema.

5. Do not convert the architecture to a different framework.

6. Keep components modular.

7. Avoid extremely large files when possible.

---

# Step 5 — Development Philosophy

Priorities for this platform are:

structured data  
discoverability  
clean architecture  
scalability  

Avoid building unnecessary complexity early.

Focus on delivering working features that support:

- profiles
- directories
- search
- discovery

---

# Step 6 — Current Development Goal

The current milestone for the project is:

Users can sign up, create a structured profile, and appear in the People Directory.

Current work involves updating:

/people  
/people/[username]  
people_directory_v1  

to use the new structured profile fields.

---

# Step 7 — How to Provide Code Changes

When suggesting code changes:

Provide full file replacements when possible.

Clearly label file paths.

Example:

app/people/page.tsx

Then provide the full file content.

Avoid partial snippets unless explicitly requested.

---

# Step 8 — Ask Before Large Changes

If a task would require:

- new dependencies
- new database tables
- major architecture changes

Ask for confirmation before proceeding.

---

# End of Instructions