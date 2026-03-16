"use client";

import { useState } from "react";
import { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import OrganizationEventsTab from "./OrganizationEventsTab";
import GoogleRatingBadge from "@/components/ui/GoogleRatingBadge";
import WacReviewTrigger from "@/components/reviews/WacReviewTrigger";

type TabType = "Overview" | "Posts" | "Events" | "Members" | "Community";

export function OrganizationTabs({
  organization,
}: {
  organization: OrganizationDirectoryEntry;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("Overview");

  const tabs: TabType[] = [
    "Overview",
    "Posts",
    "Events",
    "Members",
    "Community",
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-[var(--border)] px-4 md:px-8 flex gap-2 md:gap-8 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-6 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors duration-200 uppercase tracking-widest ${
              activeTab === tab
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-8">
        {activeTab === "Overview" && (
          <div className="grid md:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h3 className="text-xl font-bold mb-4 text-emerald-400">
                  About the Organization
                </h3>
                <div className="text-lg opacity-80 leading-relaxed whitespace-pre-wrap font-medium">
                  {organization.description ||
                    "No detailed description provided."}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="wac-card bg-[var(--surface)] p-6 rounded-2xl">
                <h3 className="text-sm uppercase tracking-widest font-bold opacity-50 mb-6">
                  Organization Details
                </h3>

                <ul className="space-y-5">
                  {organization.google_maps_url && typeof organization.google_rating === 'number' && (
                    <li className="mb-2">
                       <div className="text-xs opacity-50 mb-1">Google Rating</div>
                       <GoogleRatingBadge 
                          rating={organization.google_rating} 
                          reviewsCount={organization.google_reviews_count || 0} 
                          mapsUrl={organization.google_maps_url} 
                       />
                    </li>
                  )}
                  <li className="mb-2">
                    <div className="text-xs opacity-50 mb-1">WAC Member Rating</div>
                    <WacReviewTrigger
                      entityId={organization.id}
                      entityName={organization.name}
                      entityType="organization"
                      rating={organization.wac_rating || 0}
                      reviewsCount={organization.wac_reviews_count || 0}
                    />
                  </li>
                  {organization.leader_name && (
                    <li>
                      <div className="text-xs opacity-50 mb-1">
                        Leadership Contact
                      </div>
                      <div className="font-medium">
                        {organization.leader_name}
                      </div>
                    </li>
                  )}
                  {organization.contact_email && (
                    <li>
                      <div className="text-xs opacity-50 mb-1">Email</div>
                      <a
                        href={`mailto:${organization.contact_email}`}
                        className="font-medium hover:text-emerald-400 transition"
                      >
                        {organization.contact_email}
                      </a>
                    </li>
                  )}
                  {organization.website && (
                    <li>
                      <div className="text-xs opacity-50 mb-1">Website</div>
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-emerald-400 transition flex items-center gap-2"
                      >
                        {organization.website
                          .replace(/^https?:\/\//, "")
                          .replace(/\/$/, "")}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </li>
                  )}
                  <li>
                    <div className="text-xs opacity-50 mb-1">
                      Joined Network
                    </div>
                    <div className="font-medium">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Posts" && (
          <div className="text-center py-24 opacity-50 animate-in fade-in duration-500">
            <h3 className="text-xl font-medium mb-2">Public Posts</h3>
            <p>No recent public updates from this organization.</p>
          </div>
        )}

        {activeTab === "Events" && (
          <OrganizationEventsTab organizationId={organization.id} />
        )}

        {activeTab === "Members" && (
          <div className="text-center py-24 opacity-50 animate-in fade-in duration-500">
            <h3 className="text-xl font-medium mb-2">Organization Members</h3>
            <p>Member list visibility is restricted by the organization.</p>
          </div>
        )}

        {activeTab === "Community" && (
          <div className="text-center py-24 px-6 bg-[var(--surface)] border border-[var(--border)] rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-emerald-400">
              Members Only Area
            </h3>
            <p className="opacity-70 mb-8 max-w-sm mx-auto leading-relaxed text-lg">
              Join this organization's community to participate in internal
              discussions, coordinate volunteering, and connect with other
              locals.
            </p>
            <button
              onClick={() => {}}
              className="wac-button-chip-primary bg-emerald-500 text-white border-transparent hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Join Community to Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
