// ─── Ask the Network — shared constants ───────────────────────────────────────
// Single source of truth for category and urgency values.
// Import from here; do not duplicate across files.

export const ASK_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "hiring",       label: "Hiring"            },
  { slug: "mentorship",   label: "Mentorship"        },
  { slug: "referral",     label: "Referral"          },
  { slug: "legal",        label: "Legal"             },
  { slug: "services",     label: "Business Services" },
  { slug: "real_estate",  label: "Real Estate"       },
  { slug: "investment",   label: "Investment"        },
  { slug: "partnership",  label: "Partnership"       },
  { slug: "community",    label: "Community Need"    },
  { slug: "education",    label: "Education"         },
  { slug: "event_support",label: "Event Support"     },
  { slug: "other",        label: "Other"             },
];

export const ASK_URGENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "normal", label: "Normal"  },
  { value: "soon",   label: "Soon"    },
  { value: "urgent", label: "Urgent"  },
];

/** Map slug → human label for display */
export function getCategoryLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return ASK_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
