import type { PersonDirectoryRow } from "@/lib/types/person-directory";
import PersonCard from "./PersonCard";

type PeopleResultsProps = {
  people: PersonDirectoryRow[];
};

export default function PeopleResults({ people }: PeopleResultsProps) {
  if (people.length === 0) {
    return (
      <div className="wac-card p-6">
        <h2 className="text-lg font-semibold">
          No people matched your filters
        </h2>
        <p className="mt-2 text-sm opacity-75">
          Try broadening your search, removing a filter, or checking for a
          different spelling.
        </p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {people.map((person) => (
        <div
          key={person.id}
          className="mx-auto w-full max-w-[28rem] md:max-w-none"
        >
          <PersonCard person={person} />
        </div>
      ))}
    </section>
  );
}
