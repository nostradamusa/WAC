# World Albanian Congress — Opportunity Graph

This document defines the Opportunity Graph architecture used by the WAC platform.

The Opportunity Graph is the system that transforms the platform from a static directory into a dynamic diaspora network.

Instead of simply storing users and businesses, the platform maps relationships between:

- people
- skills
- industries
- locations
- organizations
- businesses
- opportunities

These relationships allow the system to recommend connections, surface opportunities, and strengthen coordination across the diaspora.

---

# Core Concept

The platform should not function like a typical social media feed.

Instead, it should function as a **network graph of opportunity and collaboration**.

Every major object in the system becomes a **node** in the network.

Relationships between them form the **edges** of the graph.

From this structure the platform can generate:

- recommendations
- introductions
- discovery tools
- opportunity matching
- network insights

---

# Node Types

Nodes represent primary objects in the network.

## People

Members of the diaspora with structured profiles.

Fields include:

- industry
- profession
- specialty
- skills
- location
- ancestry roots
- opportunity flags

People are the primary node type.

---

## Businesses

Businesses owned or operated by members of the diaspora.

Examples:

- restaurants
- consulting firms
- startups
- construction companies
- recruiting firms

Businesses create economic nodes in the graph.

---

## Organizations

Community institutions.

Examples:

- student organizations
- nonprofits
- cultural associations
- chambers of commerce

Organizations coordinate events and initiatives.

---

## Opportunities

Opportunities are dynamic nodes.

Examples:

- job openings
- mentorship requests
- partnership requests
- investment opportunities
- referrals

These are created primarily through the **Ask the Network** system.

---

## Events

Events connect people physically or virtually.

Examples:

- networking events
- community gatherings
- conferences
- mentorship sessions

Events create high-density network interactions.

---

# Edge Types (Relationships)

Edges represent connections between nodes.

---

## Profile → Skill

A member possesses a skill.

Example

Person → pharmaceutical sales

---

## Profile → Industry

A member works in a specific industry.

Example

Person → healthcare

---

## Profile → Profession

A member has a profession.

Example

Person → attorney

---

## Profile → Specialty

A member has a specialization.

Example

Person → gastroenterology

---

## Profile → Location

A member is located in a region.

Example

Person → New Jersey

---

## Profile → Roots

A member has ancestral roots.

Example

Person → Struga

Roots are an important diaspora signal.

---

## Profile → Business

A member owns or operates a business.

Example

Person → Construction Company

---

## Profile → Organization

A member leads or participates in an organization.

Example

Person → Albanian Student Association

---

## Profile → Opportunity

A member created or responded to an opportunity.

Example

Person → mentorship request

---

# Opportunity Signals

Opportunity signals are key indicators used to generate recommendations.

Important signals include:

- shared industry
- shared profession
- shared specialty
- shared skills
- shared location
- shared ancestry
- participation in same organization
- ownership of related business
- responses to help requests
- open-to flags

The more signals two nodes share, the stronger their connection.

---

# Open-To Flags

Profiles include opportunity signals called **open-to flags**.

These indicate willingness to participate in certain activities.

Flags include:

open_to_work  
open_to_hire  
open_to_mentor  
open_to_invest  
open_to_collaborate  

These are critical signals for the opportunity graph.

Example

A recruiter may be matched with:

- profiles with open_to_work
- similar industry
- similar location

---

# Graph Queries

The Opportunity Graph allows complex discovery queries.

Examples

Find Albanians in pharma in New Jersey who are open to mentoring.

Find Albanian-owned construction businesses hiring in Detroit.

Find Albanian recruiters connected to tech startups.

Find lawyers with roots in a specific region.

These queries combine structured attributes and relationship signals.

---

# Recommendation Engine

The recommendation engine will eventually use graph signals.

Example recommendation types:

## People You Should Know

Suggested connections based on:

- shared location
- shared profession
- shared skills
- shared ancestry
- mutual network activity

---

## Opportunities For You

Surface relevant opportunities based on:

- skills
- industry
- profession
- location
- open-to flags

---

## Businesses To Connect With

Recommend businesses relevant to a member's profession or industry.

---

## Organizations Near You

Surface organizations operating in the user's location.

---

# Warm Introductions

The graph can identify warm introduction paths.

Example

User A → shares profession with User B  
User B → belongs to Organization C  
Organization C → hosts Event D  

This path creates an introduction opportunity.

---

# Network Density

Network density measures the strength of the diaspora in a region or industry.

Examples

- New York healthcare network
- Detroit student organizations
- Florida hospitality businesses
- Texas construction companies

These clusters become powerful hubs.

---

# Engagement Signals

The system should track signals that strengthen the graph.

Examples

- responding to an ask
- posting opportunities
- attending events
- creating businesses
- joining organizations

These activities increase network connectivity.

---

# Long-Term Intelligence Layer

The Opportunity Graph eventually enables advanced features.

Examples

Mentorship matching

Match young professionals with experienced mentors.

Investor-founder matching

Connect startup founders with investors.

Referral engine

Identify who can introduce whom.

Diaspora mapping

Visualize where members of the diaspora live and work.

Network health metrics

Measure growth and collaboration strength.

---

# Initial Implementation Strategy

The first versions of the platform do not require a specialized graph database.

The graph can be represented using relational tables in PostgreSQL.

Important tables include:

profiles  
industries  
professions  
specialties  
skills  
profile_skills  
businesses  
organizations  
help_requests  
help_request_responses  

Relationships are computed using joins.

Graph logic can be layered on top of the relational model.

---

# Scaling Strategy

If the network becomes large enough, the platform could later add:

- graph analytics
- recommendation services
- network clustering algorithms

However, these should not be implemented prematurely.

The relational model is sufficient for the early stages of the platform.

---

# Product Philosophy

The Opportunity Graph reflects the core philosophy of the platform.

The goal is not to maximize content.

The goal is to maximize **useful connections**.

Every feature should strengthen:

- discovery
- trust
- collaboration
- opportunity

---

# Guidance for AI Coding Agents

When building features:

1. Treat people, businesses, organizations, and opportunities as nodes.
2. Treat relationships as signals.
3. Use structured data whenever possible.
4. Avoid introducing unnecessary complexity early.
5. Preserve the relational model unless explicitly directed otherwise.

---

# Final Summary

The Opportunity Graph is the architecture that transforms the WAC platform into a living diaspora network.

Instead of simply listing members, the system maps relationships between people, skills, businesses, organizations, and opportunities.

This allows the platform to surface:

- relevant connections
- meaningful opportunities
- stronger collaboration across the Albanian diaspora.

The Opportunity Graph is the foundation of the platform's long-term value.