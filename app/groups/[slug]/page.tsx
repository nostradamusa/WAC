import { notFound } from "next/navigation";
import GroupProfilePage from "@/components/groups/GroupProfilePage";
import type { GroupData } from "@/lib/types/group";
import { getGroupBySlug } from "@/lib/services/groupService";

// ── Mock data ─────────────────────────────────────────────────────────────────
// Replace with getGroupBySlug(slug) once the groups table is live.

const MOCK_GROUPS: GroupData[] = [
  {
    id:               "8",
    slug:             "albanian-founders-circle",
    name:             "Albanian Founders Circle",
    description:      "For entrepreneurs building companies within the Albanian diaspora and homeland. From pre-seed to Series B, this group supports founders with fundraising strategy, co-founder connections, investor introductions, and founder AMA sessions. We believe Albanian builders deserve a serious community — not just a chat group.",
    category:         "Business & Founder",
    pathway:          "industry",
    privacy:          "private",
    join_policy:      "request",
    member_count:     97,
    activity_summary: "14 posts this week",
    created_at:       "2024-09-15",
    avatar_bg:        "bg-[#b08d57]/15",
    avatar_color:     "text-[#b08d57]",
    parent_org_name:  null,
    parent_org_slug:  null,
    location_relevance: "Global",
    tags:             ["founders", "startups", "fundraising", "venture"],
    rules: [
      {
        id:          "r1",
        title:       "Be founder-to-founder honest",
        description: "Share real wins and real struggles. No performative hustle. This is a support group, not a highlight reel.",
      },
      {
        id:          "r2",
        title:       "Protect commercial information",
        description: "Do not share confidential business details, investor term sheets, or proprietary roadmaps without explicit consent.",
      },
      {
        id:          "r3",
        title:       "No unsolicited pitching",
        description: "You may share updates on your company. Do not DM members unsolicited pitch decks or fundraising asks.",
      },
      {
        id:          "r4",
        title:       "Introductions are reciprocal",
        description: "If someone makes an introduction for you, close the loop. Update them. This community runs on trust.",
      },
    ],
    members: [
      { id: "m1", full_name: "Erion Basha",    username: "erionbasha",    role: "owner",     joined_at: "2024-09-15", headline: "Founder & CEO, Kaldaia" },
      { id: "m2", full_name: "Arta Koci",       username: "artakoci",      role: "admin",     joined_at: "2024-09-20", headline: "Partner, Illyrian Ventures" },
      { id: "m3", full_name: "Besian Çeku",     username: "besianceku",    role: "admin",     joined_at: "2024-10-01", headline: "Co-founder, TechValë" },
      { id: "m4", full_name: "Mirela Duka",     username: "mireladuka",    role: "member",    joined_at: "2024-10-12", headline: "Founder, OriginAL" },
      { id: "m5", full_name: "Altin Prenga",    username: "altinprenga",   role: "member",    joined_at: "2024-11-03", headline: "CTO, Bleri.io" },
      { id: "m6", full_name: "Dorina Hyseni",   username: "dorinahyseni",  role: "member",    joined_at: "2024-11-18", headline: "CEO, Shpresa Health" },
      { id: "m7", full_name: "Kreshnik Rama",   username: "kreshnikrama",  role: "member",    joined_at: "2025-01-07", headline: "Founder, Kastriot AI" },
      { id: "m8", full_name: "Vjosa Halili",    username: "vjosahalili",   role: "member",    joined_at: "2025-01-22", headline: "Product Lead, Balkan Labs" },
    ],
    posts: [
      {
        id:              "p1",
        author_name:     "Erion Basha",
        author_username: "erionbasha",
        author_role:     "owner",
        content:         "Welcome to Albanian Founders Circle — the serious community for Albanian founders. This group is private: what's said here, stays here. We run quarterly AMAs with active investors, monthly pitch nights, and open co-founder matching threads. Introduce yourself below.",
        created_at:      "2024-09-15",
        likes_count:     47,
        comments_count:  31,
        is_pinned:       true,
        is_featured:     true,
      },
      {
        id:              "p2",
        author_name:     "Mirela Duka",
        author_username: "mireladuka",
        author_role:     "member",
        content:         "Has anyone raised a pre-seed round in the US as a foreign-domiciled founder? I'm navigating Delaware C-Corp conversion for a company currently registered in Kosovo. Specifically trying to understand the SAFEs vs. convertible notes question for international founders.",
        created_at:      "2025-03-11",
        likes_count:     18,
        comments_count:  9,
        is_pinned:       false,
        is_featured:     false,
      },
      {
        id:              "p3",
        author_name:     "Kreshnik Rama",
        author_username: "kreshnikrama",
        author_role:     "member",
        content:         "We just launched Kastriot AI in private beta — AI-powered paralegal tools for immigration law starting with Albanian-speaking communities in the US and UK. If any of you are adjacent to legal or immigration, I'd love early feedback. DM me for access.",
        created_at:      "2025-03-14",
        likes_count:     34,
        comments_count:  12,
        is_pinned:       false,
        is_featured:     false,
      },
      {
        id:              "p4",
        author_name:     "Arta Koci",
        author_username: "artakoci",
        author_role:     "admin",
        content:         "Illyrian Ventures is reviewing applications for our Spring 2026 cohort. We back pre-seed founders in the Albanian diaspora. If you're raising or know someone who should be — DM me directly. We move fast, standard terms, and we add value beyond the check.",
        created_at:      "2025-03-16",
        likes_count:     52,
        comments_count:  8,
        is_pinned:       false,
        is_featured:     false,
      },
    ],
    events: [
      {
        id:              "ev1",
        name:            "Albanian Founders Pitch Night — Spring 2026",
        slug:            "founders-pitch-night-spring-2026",
        date:            "2026-03-30",
        time:            "6:30 PM EST",
        location:        "WeWork Times Square",
        city:            "New York",
        country:         "USA",
        description:     "5-minute pitches. Structured Q&A. Real investors. An intimate, closed-door event for Albanian founders only.",
        attendees_count: 38,
        is_past:         false,
      },
      {
        id:              "ev2",
        name:            "Founders Dinner — Tirana",
        slug:            "founders-dinner-tirana-2025",
        date:            "2025-11-08",
        time:            "7:00 PM CET",
        location:        "Hotel Rogner",
        city:            "Tirana",
        country:         "Albania",
        description:     "Annual founders dinner bringing the diaspora community together with local Albanian entrepreneurs.",
        attendees_count: 24,
        is_past:         true,
      },
    ],
    media: [
      { id: "md1", type: "photo", url: "", caption: "Founders Pitch Night 2025",         uploaded_by: "erionbasha",   uploaded_at: "2025-11-10" },
      { id: "md2", type: "photo", url: "", caption: "Tirana Founders Dinner",             uploaded_by: "mireladuka",   uploaded_at: "2025-11-09" },
      { id: "md3", type: "video", url: "", caption: "AMA with Arta Koci — Fundraising",   uploaded_by: "artakoci",     uploaded_at: "2025-12-01" },
      { id: "md4", type: "photo", url: "", caption: "Co-founder matching session",         uploaded_by: "besianceku",   uploaded_at: "2026-01-15" },
      { id: "md5", type: "photo", url: "", caption: "NYC Founders Happy Hour",             uploaded_by: "vjosahalili",  uploaded_at: "2026-02-20" },
      { id: "md6", type: "video", url: "", caption: "Kastriot AI beta launch demo",        uploaded_by: "kreshnikrama", uploaded_at: "2026-03-10" },
    ],
    files: [
      {
        id:           "f1",
        name:         "2026 Funding Landscape — Albanian Startups",
        file_type:    "PDF",
        file_size_kb: 1240,
        url:          "#",
        uploaded_by:  "Arta Koci",
        uploaded_at:  "2026-02-28",
        description:  "An overview of active investors, fund sizes, and thesis alignment for Albanian diaspora founders.",
      },
      {
        id:           "f2",
        name:         "Pitch Deck Template v2",
        file_type:    "PPTX",
        file_size_kb: 3680,
        url:          "#",
        uploaded_by:  "Erion Basha",
        uploaded_at:  "2026-01-10",
        description:  "Community-reviewed pitch deck template. Used by three members in successful seed rounds.",
      },
      {
        id:           "f3",
        name:         "Investor Intro Request Template",
        file_type:    "DOCX",
        file_size_kb: 48,
        url:          "#",
        uploaded_by:  "Besian Çeku",
        uploaded_at:  "2025-12-20",
        description:  "How to ask for an investor introduction without being awkward. Template + written guidance.",
      },
    ],
    is_member:          false,
    current_user_role:  null,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Try DB first, then fall back to mock data (demo groups)
  const group: GroupData | undefined =
    (await getGroupBySlug(slug)) ?? MOCK_GROUPS.find(g => g.slug === slug);

  if (!group) notFound();

  return <GroupProfilePage group={group} />;
}
