# World Albanian Congress — Organizations, Groups, and Follow/Join Model

This document defines how Organizations, Groups, and community participation should work in the WAC platform.

Its purpose is to help developers and AI coding agents understand:

- the difference between organizations and groups
- how follow and join actions should behave
- how public and member-only communication should work
- how this system should scale over time

This model is designed to keep the user experience simple while preserving long-term flexibility.

---

# Core Principle

Organizations and Groups are related, but they are not the same thing.

## Organization

An organization is a public-facing institutional entity.

Examples:

- nonprofit
- student association
- chamber of commerce
- cultural association
- religious/community institution

An organization has a public identity in the WAC ecosystem.

---

## Group

A group is an interactive membership space.

Examples:

- local chapter
- alumni circle
- student member space
- volunteer team
- professional subgroup
- regional community

A group is where discussion, coordination, and member interaction happen.

---

# Core Rule

Use this mental model:

Organization = public identity  
Group = community space

This distinction should remain true across product design, backend modeling, and UI.

---

# Why This Separation Matters

If organizations and groups are merged too early, the platform becomes inflexible.

Problems that happen when they are treated as the same thing:

- every organization is forced into community behavior even if it only wants a public presence
- informal communities cannot exist unless they become organizations
- future regional/industry groups become harder to model
- public content and private/member content become mixed together

Keeping them distinct avoids these problems.

---

# Recommended V1 Product Behavior

For V1, every organization should have:

- a public organization page
- public posts
- public events
- followers

Some organizations may also enable:

- a default community space
- joined members
- member-only posts or messages

This gives a clean user experience without forcing every organization into full group functionality.

---

# Follow vs Join

These two actions must remain distinct.

---

## Follow

Following is a lightweight relationship.

When a user follows an organization, it means:

- they want public updates from the organization
- they want to see public posts in their feed
- they want to see public events and announcements
- they do not become a member of the organization’s internal community

Follow is best understood as:

“I want to stay updated.”

### Follow behavior

A follower should:

- see the organization’s public posts in the global/network feed
- see the organization’s public events
- see the organization appear in their followed entities list
- receive future notifications for public activity if notifications are later enabled

A follower should NOT automatically gain access to:

- member-only discussions
- internal announcements
- private resources
- member-only messaging

---

## Join

Joining is a stronger relationship.

When a user joins an organization’s community, it means:

- they are part of that organization’s community space inside WAC
- they may participate in discussion
- they may receive member-only updates
- they may access internal posts or announcements

Join is best understood as:

“I belong in this community.”

### Join behavior

A member should:

- have access to member-only community content
- appear in the community member list if visibility rules allow
- participate in member discussions
- receive member-targeted updates or posts
- potentially access future features such as files, resources, channels, or committees

A joined member may also be a follower, but the product should treat join as the stronger relationship.

---

# Public vs Member-Only Communication

Organizations should communicate through two lanes.

---

## Lane 1 — Public Communication

Public communication is visible to everyone.

Examples:

- organization announcements
- public updates
- public event invitations
- partnerships
- scholarship notices
- community news

Public content should appear in:

- the organization page
- the global feed
- follower feeds
- public discovery/search where appropriate

This is how organizations broadcast to the wider network.

---

## Lane 2 — Member-Only Communication

Member-only communication is visible only to joined members of the organization’s community.

Examples:

- volunteer coordination
- internal planning updates
- chapter/member notes
- member discussion threads
- leadership announcements meant for members only

Member-only content should appear in:

- the organization’s community tab/space
- the joined member feed if that surface exists later
- member-only notifications if notifications are later enabled

This is how organizations build internal cohesion.

---

# Recommended V1 UX

An organization page should not force users to understand multiple separate products.

The UX should feel simple.

Recommended organization page actions:

- Follow
- Join Community

This is much better than asking users to:

- follow the org
- separately discover a group
- separately join a forum
- separately manage feed settings

The organization page should serve as the front door.

---

# Recommended Organization Page Structure

Suggested tabs or sections:

- Overview
- Posts
- Events
- Members
- Community

### Overview
Public description, mission, leadership, links, location.

### Posts
Public posts and updates.

### Events
Public upcoming events and past events.

### Members
Public or limited member display depending on privacy rules.

### Community
Interactive member area, shown only if the organization has enabled community features.

---

# V1 Community Model

To reduce product complexity in V1:

- organizations may have one default community space
- this can exist behind the scenes as a group model
- the user does not need to think in terms of a separate “group product”

In other words:

Organization page → includes Community tab

This is much simpler than making organizations create and manage separate visible groups immediately.

---

# Long-Term Model

In the long run, the system should support both:

- formal organizations
- standalone groups not tied to organizations

Examples of standalone groups:

- Albanian Tech in NYC
- Albanian Founders Circle
- Pharma Sales Network
- Struga Roots Group
- Detroit Community Builders

These are communities, but not necessarily institutions.

This is why the platform should not permanently hard-merge organizations and groups.

---

# Recommended Backend Model

Long-term data model may include:

## organizations
Public institutional entities

## groups
Community spaces

## group_members
Membership relationships

## organization_groups
Optional relationship between organizations and groups

For V1, an organization can have one default group/community behind the scenes.

This allows the product to scale later without breaking its logic.

---

# Permissions Model

---

## Public Users

Public users can:

- view public organization pages
- view public posts
- view public events
- follow organizations

Public users cannot:

- access member-only community content
- post in member-only spaces
- see internal updates unless explicitly public

---

## Followers

Followers can:

- receive public updates in their feed
- view public events
- track the organization more closely

Followers cannot:

- access member-only content unless they also join the community

---

## Joined Members

Joined members can:

- access community discussions
- view member-only posts if enabled
- participate in internal interaction
- receive targeted member communications

---

## Org Admins / Leaders

Org admins can:

- manage organization profile
- publish public posts
- create public events
- manage community settings
- publish member-only updates
- moderate discussions
- accept/approve members if approval workflows are later enabled

---

# Posting Rules

Organization-originated content should support visibility modes.

Recommended modes:

- public
- members_only

This should apply to posts, announcements, and possibly events later.

### Public posts
Shown to everyone and followers.

### Members-only posts
Shown only in the community/member area.

---

# Event Rules

Events may also support visibility later.

Recommended event visibility modes:

- public event
- member event

Public events are visible to everyone.

Member events are shown only to joined members of the community.

V1 can start with public events only if needed.

---

# Feed Integration

The WAC feed should eventually include:

### Public organization content
Visible in the wider network feed.

### Member-only organization content
Visible only inside the org community space or member-targeted feed surfaces.

This keeps the main feed useful while preserving private community value.

---

# Design Principles

1. Keep the public/org layer simple.
2. Keep community participation clear.
3. Follow and Join must not mean the same thing.
4. Organizations should be able to broadcast publicly and coordinate privately.
5. The system should support future standalone groups.

---

# V1 Product Recommendation

For the first release of this concept:

### Organizations should support:
- public profile page
- public posts
- public events
- Follow button

### Selected organizations may also support:
- Join Community button
- member-only community area
- member-only updates/discussions

This is the cleanest starting point.

---

# Future Expansion

Later the platform may add:

- approval-based membership
- group channels
- chapter structures
- committees
- files/resources
- discussion threads
- event RSVPs by group
- cross-org collaboration spaces
- industry groups not tied to formal organizations

This is why the underlying model must remain flexible.

---

# Guidance for AI Coding Agents

When implementing organization/community features:

1. Do not treat organizations and groups as the same object.
2. Treat Follow and Join as separate relationships.
3. Keep public posts and member-only posts distinct.
4. Keep the user experience simple on the organization page.
5. Preserve future support for standalone groups.

---

# Final Summary

The WAC platform should model organizations and groups as related but distinct layers.

Organizations are the public-facing institutions of the diaspora.

Groups are the membership spaces where interaction and coordination happen.

Users should be able to:

- Follow organizations for public updates
- Join organization communities for deeper participation

This structure allows WAC to support both public visibility and private community cohesion while staying flexible enough for future groups, chapters, and network communities.