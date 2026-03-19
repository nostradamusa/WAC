import GroupsHub from "@/components/groups/GroupsHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups | World Albanian Congress",
  description: "Find your community. Join groups organized around career, family, industry, travel, and culture.",
};

export default function GroupsPage() {
  return <GroupsHub />;
}
