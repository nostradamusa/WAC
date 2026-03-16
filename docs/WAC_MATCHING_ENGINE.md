# World Albanian Congress — Matching Engine

This document defines the first-version matching engine for WAC.

Its purpose is to help developers and AI coding agents implement
the "Who Should I Know?" recommendation system.

The goal is to suggest relevant people in the network based on:

- professional similarity
- diaspora relevance
- opportunity compatibility
- location proximity

---

# Purpose

The matching engine helps transform WAC from a static directory into an active network.

Instead of only showing searchable lists of people, the platform should proactively suggest:

- people you should know
- people near you
- people in your field
- people aligned with your goals

---

# V1 Matching Inputs

The first version should use structured profile data only.

Important matching inputs include:

- country
- state
- city
- industry_id
- profession_id
- specialty_id
- shared skills
- ancestry_country
- ancestry_city
- ancestry_village
- open_to_work
- open_to_hire
- open_to_mentor
- open_to_invest
- open_to_collaborate
- is_verified

---

# Candidate Eligibility Rules

A profile is eligible to be recommended only if:

- profile is public
- profile is not the current user
- profile has enough meaningful data to display
- profile is active when activity tracking exists

Avoid recommending:

- private profiles
- empty/incomplete junk profiles
- duplicate records

---

# V1 Scoring Model

Recommended initial weights:

- same country = 5
- same state = 8
- same city = 12
- same industry = 15
- same profession = 12
- same specialty = 10
- each shared skill = 6
- same ancestry country = 6
- same ancestry city = 8
- same ancestry village = 12
- verified = 3

Open-to compatibility:

- current user open_to_work + candidate open_to_hire = 10
- current user open_to_hire + candidate open_to_work = 10
- both open_to_collaborate = 10
- future mentorship and investment logic can be added later

---

# Match Explanation Labels

Every recommendation should explain why it appeared.

Possible explanation badges:

- Same industry
- Same profession
- Same specialty
- Shared skills
- Nearby
- Shared roots
- Open to hire
- Open to work
- Open to collaborate
- Verified

The UI should show 2 to 3 of the strongest reasons.

---

# Initial UI Placement

Recommended first surfaces:

- user dashboard
- people directory sidebar or section
- public/private profile page

---

# Initial Output Shape

Each recommendation should return:

- profile id
- username
- full name
- avatar
- headline
- company
- city
- state
- country
- verification state
- match score
- match reasons

---

# Product Principles

The matching engine should favor:

- usefulness over novelty
- clarity over mystery
- quality over quantity

Do not try to make it overly clever in V1.

A simple and explainable system is better than a complex and opaque one.

---

# Future Evolution

Later versions may add:

- engagement history
- ask/response activity
- event attendance
- organization membership
- business relationships
- second-degree warm intro paths
- stronger mentorship logic
- investor-founder logic

---

# Final Goal

The purpose of the matching engine is to reduce the distance between a member and the right next connection.

The platform should help users answer:

Who should I know next?