"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/notifications' || pathname === '/post' || pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[#0A0A0A] pt-16 pb-8">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="mb-6 flex items-center gap-3 transition-opacity md:w-max hover:opacity-90"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] shadow-md">
                <img
                  src="/images/wac-logo.jpg"
                  alt="World Albanian Congress Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-serif tracking-tight text-white">
                  World <span className="text-[var(--accent)] italic font-light opacity-90">Albanian</span>{" "}
                  Congress
                </span>
              </div>
            </Link>
            <p className="mb-6 max-w-sm text-sm leading-relaxed opacity-70">
              The premier global network built to connect, empower, and unify
              the Albanian diaspora across all borders and professions.
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold opacity-80">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                Fb
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                Ig
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                In
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
            <div>
              <h3 className="mb-5 text-sm font-bold tracking-wider text-white uppercase">
                Platform
              </h3>
              <ul className="flex flex-col gap-3 text-sm opacity-70">
                <li>
                  <Link
                    href="/directory"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Global Directory
                  </Link>
                </li>
                <li>
                  <Link
                    href="/entities"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Organizations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Community Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Advanced Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/feed"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Network Feed
                  </Link>
                </li>
                <li>
                  <Link
                    href="/groups"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Network Groups
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-sm font-bold tracking-wider text-white uppercase">
                Resources
              </h3>
              <ul className="flex flex-col gap-3 text-sm opacity-70">
                <li>
                  <Link
                    href="/guide/travel"
                    className="transition hover:text-[var(--accent)]"
                  >
                    Homeland Travel Guide
                  </Link>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Mentorship Program
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Investment Funds
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Job Board
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="mb-5 text-sm font-bold tracking-wider text-white uppercase">
                Congress
              </h3>
              <ul className="flex flex-col gap-3 text-sm opacity-70">
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Our Mission
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Leadership Team
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Become a Member
                  </a>
                </li>
                <li>
                  <a href="#" className="transition hover:text-[var(--accent)]">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between border-t border-[rgba(255,255,255,0.1)] pt-8 text-xs opacity-60 md:flex-row">
          <p>
            © {new Date().getFullYear()} World Albanian Congress. All rights
            reserved.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <a href="#" className="transition hover:text-white">
              Privacy Policy
            </a>
            <Link href="/terms" className="transition hover:text-white">
              Terms of Service
            </Link>
            <a href="#" className="transition hover:text-white">
              Cookie Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
