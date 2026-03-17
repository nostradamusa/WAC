export interface EventDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  date: string; // ISO date string or formatted date
  time: string; // e.g. "6:00 PM EST"
  location: string; // e.g. "Marriott Marquis, NYC"
  city?: string;
  state?: string;
  country?: string;
  description: string;
  attendees_count: number;
  cover_image_url?: string;
}
