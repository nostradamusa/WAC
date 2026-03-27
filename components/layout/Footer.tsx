"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const comingSoonItems = [
  { label: "Job Board", note: "Hiring across the diaspora" },
  { label: "Mentorship Program", note: "1-on-1 expert connections" },
  { label: "Investment Funds", note: "Albanian capital network" },
  { label: "Homeland Travel Guide", note: "Curated regional guides" },
  { label: "WAC Academy", note: "Courses & certifications" },
  { label: "Business Accelerator", note: "Scale with the community" },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/notifications' || pathname === '/post' || pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#070707] pt-16 pb-8">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">

          {/* ── Brand Column ── */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 flex items-center gap-3 md:w-max group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#b08d57]/60 bg-[var(--accent)] transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(176,141,87,0.45)]">
                <img
                  src="/images/wac-logo.jpg"
                  alt="WAC"
                  className="h-full w-full object-cover scale-[1.4] mix-blend-multiply opacity-95"
                />
              </div>
              <span className="text-xl font-serif tracking-tight text-white">
                World <span className="text-[#b08d57] italic font-light opacity-90">Albanian</span> Congress
              </span>
            </Link>

            <p className="mb-2 max-w-[300px] text-sm leading-relaxed text-white/50">
              The premier global network built to connect, empower, and unify the Albanian diaspora across all borders and professions.
            </p>

            {/* Beta badge */}
            <p className="mb-6 text-[11px] font-medium text-[#b08d57]/50 tracking-widest uppercase">
              Currently in Beta
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <FacebookIcon />, label: "Facebook" },
                { icon: <InstagramIcon />, label: "Instagram" },
                { icon: <LinkedInIcon />, label: "LinkedIn" },
              ].map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] text-white/50 transition hover:bg-[#b08d57]/15 hover:border-[#b08d57]/30 hover:text-[#b08d57]"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Links Grid ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">

            {/* Platform */}
            <div>
              <h3 className="mb-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">
                Platform
              </h3>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  { label: "Directory", href: "/directory" },
                  { label: "Pulse", href: "/community" },
                  { label: "Events", href: "/events" },
                  { label: "Groups", href: "/groups" },
                  { label: "Vision", href: "/vision" },
                  { label: "Help & Support", href: "/help" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/55 transition hover:text-[#b08d57]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Congress */}
            <div>
              <h3 className="mb-5 text-[11px] font-bold tracking-widest text-white/40 uppercase">
                Congress
              </h3>
              <ul className="flex flex-col gap-3 text-sm">
                {[
                  { label: "Our Mission", href: "/vision" },
                  { label: "Leadership Team", href: "/vision" },
                  { label: "Become a Member", href: "/contact" },
                  { label: "Contact Us", href: "/contact" },
                  { label: "Privacy Policy", href: "/privacy" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-white/55 transition hover:text-[#b08d57]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coming Soon */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <h3 className="text-[11px] font-bold tracking-widest text-white/40 uppercase">
                  Coming Soon
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#b08d57]/10 border border-[#b08d57]/20 text-[#b08d57]/70">
                  Pipeline
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-4">
                {comingSoonItems.map(({ label, note }) => (
                  <li key={label}>
                    <span className="block text-[13px] italic font-light text-white/30 leading-snug">
                      {label}
                    </span>
                    <span className="block text-[10px] text-white/18 leading-snug mt-0.5">
                      {note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mt-14 flex flex-col items-center justify-between border-t border-white/[0.07] pt-7 text-[11px] text-white/35 md:flex-row gap-4">
          <p>© {new Date().getFullYear()} World Albanian Congress. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition hover:text-white/60">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-white/60">Terms of Service</Link>
            <a href="#" className="transition hover:text-white/60">Cookie Guidelines</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
