import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

const members = [
  { name: "Ardit Hoxha",       role: "Construction Business Owner",              location: "New York / New Jersey" },
  { name: "Liridon Krasniqi",  role: "Software Engineer",                        location: "London" },
  { name: "Elira Berisha",     role: "Finance Director",                         location: "Zurich" },
  { name: "Dr. Arben Gashi",   role: "Medical Doctor",                           location: "Detroit" },
  { name: "Arta Kola",         role: "Founder \u2013 Albanian Cultural Association", location: "Toronto" },
];

export default function MembersPreview() {
  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 bg-[var(--background)]">
      <div className="mx-auto max-w-screen-xl">

        <div className="max-w-3xl mb-10 md:mb-14">
          <SectionLabel label="Members of the Network" variant="standard" className="mb-5" />
          <h2 className="font-serif text-[28px] md:text-[38px] leading-[1.2] tracking-tight text-[var(--warm-ivory)]">
            Built by the people who will shape it.
          </h2>
          <p className="mt-4 text-[15px] leading-[1.8] text-white/45 max-w-2xl">
            Professionals, founders, operators, and organizations across the diaspora are already entering the network.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {members.map((member) => (
            <Link
              key={member.name}
              href="/people"
              className="wac-card group flex flex-col p-5 md:p-6 text-center border border-white/[0.07] hover:border-[#b08d57]/30 transition-all hover:-translate-y-1"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 flex items-center justify-center text-[#b08d57] font-bold text-lg mb-4 group-hover:bg-[#b08d57] group-hover:text-black transition-colors">
                {member.name.charAt(0)}
                {member.name.includes("Dr. ")
                  ? member.name.split(" ")[1].charAt(0)
                  : member.name.split(" ")[1]?.charAt(0)}
              </div>
              <h3 className="font-semibold text-[14px] text-white/85 mb-1">{member.name}</h3>
              <p className="text-[12px] text-white/40 mb-3 leading-snug">
                {member.role}
              </p>
              <span className="mt-auto text-[10px] font-bold text-[#b08d57]/70 uppercase tracking-widest bg-[#b08d57]/[0.06] py-1 px-3 rounded-full inline-block mx-auto">
                {member.location}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
