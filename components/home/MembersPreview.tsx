import Link from "next/link";

export default function MembersPreview() {
  const members = [
    {
      name: "Ardit Hoxha",
      role: "Construction Business Owner",
      location: "New York / New Jersey",
    },
    { name: "Liridon Krasniqi", role: "Software Engineer", location: "London" },
    { name: "Elira Berisha", role: "Finance Director", location: "Zurich" },
    { name: "Dr. Arben Gashi", role: "Medical Doctor", location: "Detroit" },
    {
      name: "Arta Kola",
      role: "Founder – Albanian Cultural Association",
      location: "Toronto",
    },
  ];

  return (
    <section id="members-preview" className="py-24 px-4 bg-[var(--background)]">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif tracking-tight sm:text-6xl mb-4 text-white">
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Members
            </span>{" "}
            of the Network
          </h2>
          <div className="space-y-4 text-xl opacity-80 max-w-3xl mx-auto leading-relaxed font-medium">
            <p>
              The World Albanian Congress platform is built by and for the
              Albanian diaspora.
            </p>
            <p>
              Professionals, entrepreneurs, and organizations across the world
              are joining the network to connect and collaborate.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {members.map((member) => (
            <Link
              key={member.name}
              href="/people"
              className="wac-card group flex flex-col p-6 transition-transform hover:-translate-y-2 block h-full text-center border border-[var(--border)] hover:border-[var(--accent)]/50"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold text-xl mb-4 group-hover:bg-[var(--accent)] group-hover:text-black transition-colors">
                {member.name.charAt(0)}
                {member.name.includes("Dr. ")
                  ? member.name.split(" ")[1].charAt(0)
                  : member.name.split(" ")[1]?.charAt(0)}
              </div>
              <h3 className="font-bold mb-1 opacity-90">{member.name}</h3>
              <div className="text-sm opacity-60 mb-3 leading-tight">
                {member.role}
              </div>
              <div className="mt-auto text-xs font-bold text-[var(--accent)] uppercase tracking-widest bg-[var(--accent)]/5 py-1 px-3 rounded-full inline-block mx-auto">
                {member.location}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
