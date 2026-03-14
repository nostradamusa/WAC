import type { ReactNode } from "react";

type PeopleDirectoryLayoutProps = {
  filters: ReactNode;
  results: ReactNode;
};

export default function PeopleDirectoryLayout({
  filters,
  results,
}: PeopleDirectoryLayoutProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">{filters}</aside>
      <div className="min-w-0">{results}</div>
    </section>
  );
}