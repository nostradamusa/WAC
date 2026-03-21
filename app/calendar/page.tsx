import MyCalendar from "@/components/calendar/MyCalendar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Calendar | World Albanian Congress",
  description:
    "Your personalized ecosystem calendar driven by organizations you subscribe to.",
};

export default function CalendarPage() {
  return (
    <main className="min-h-screen flex flex-col pt-16 bg-[var(--background)]">
      {/* PAGE HERO */}
      <section className="bg-[var(--foreground)]/5 border-b border-[var(--foreground)]/10 py-16 px-4">
        <div className="max-w-[75rem] mx-auto">
          <div className="wac-eyebrow mb-4 opacity-80 text-[var(--accent)]">
            <span className="inline-block w-6 h-[2px] bg-[var(--accent)] mr-3 align-middle"></span>
            Personalized Events
          </div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-4 text-white">
            <span className="text-[#b08d57] italic font-light opacity-90">
              My
            </span>{" "}
            Calendar
          </h1>
          <p className="text-lg opacity-70 max-w-2xl leading-relaxed">
            Events from across the diaspora, filtered by the organizations,
            hubs, and life-stages you follow.
          </p>
        </div>
      </section>

      {/* CALENDAR APP */}
      <MyCalendar />
    </main>
  );
}
