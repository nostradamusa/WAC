export type GroupPrivacy    = "public" | "private" | "secret";
export type GroupJoinPolicy = "open"   | "request" | "invite_only";
export type GroupMemberRole = "owner"  | "admin"   | "moderator" | "member";

export interface GroupRule {
  id:          string;
  title:       string;
  description: string;
}

export interface GroupMember {
  id:         string;
  full_name:  string;
  username:   string;
  avatar_url?: string | null;
  role:       GroupMemberRole;
  joined_at:  string;
  headline?:  string | null;
}

export interface GroupPost {
  id:               string;
  author_name:      string;
  author_username:  string;
  author_avatar?:   string | null;
  author_role?:     GroupMemberRole;
  content:          string;
  created_at:       string;
  likes_count:      number;
  comments_count:   number;
  is_pinned:        boolean;
  is_featured:      boolean;
}

export interface GroupEvent {
  id:              string;
  name:            string;
  slug:            string;
  date:            string;
  time?:           string;
  location?:       string;
  city?:           string;
  country?:        string;
  description?:    string;
  attendees_count: number;
  is_past:         boolean;
}

export interface GroupMedia {
  id:          string;
  type:        "photo" | "video";
  url:         string;
  caption?:    string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface GroupFile {
  id:           string;
  name:         string;
  file_type:    string;
  file_size_kb: number;
  url:          string;
  uploaded_by:  string;
  uploaded_at:  string;
  description?: string;
}

export interface GroupData {
  id:               string;
  slug:             string;
  name:             string;
  tagline?:         string | null;
  description:      string;
  category:         string;
  pathway?:         string;
  privacy:          GroupPrivacy;
  join_policy:      GroupJoinPolicy;
  member_count:     number;
  activity_summary: string;
  created_at:       string;
  avatar_bg:        string;
  avatar_color:     string;
  avatar_url?:      string | null;
  banner_url?:      string | null;
  parent_org_name?: string | null;
  parent_org_slug?: string | null;
  location_relevance?: string | null;
  tags:    string[];
  rules:   GroupRule[];
  members: GroupMember[];
  posts:   GroupPost[];
  events:  GroupEvent[];
  media:   GroupMedia[];
  files:   GroupFile[];
  is_member:          boolean;
  current_user_role?: GroupMemberRole | null;
}
