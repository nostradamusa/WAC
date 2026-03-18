"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Activity, CalendarDays, Bell } from "lucide-react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { useNotificationCount } from "@/lib/hooks/useUnreadCounts";
import { supabase } from "@/lib/supabase";

export default function MobileBottomNav() {
  const pathname  = usePathname();
  const scrollDirection = useScrollDirection();
  const [mounted, setMounted]     = useState(false);
  const [userId, setUserId]       = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  const notifCount = useNotificationCount(userId, userEmail);

  const navItems = [
    { name: "Home",      href: "/",             icon: null,     imageSrc: "/images/wac-logo.jpg" },
    { name: "Directory", href: "/directory",     icon: Search,   imageSrc: null },
    { name: "The Pulse", href: "/community",     icon: Activity, imageSrc: null },
    { name: "Events",    href: "/events",        icon: CalendarDays, imageSrc: null },
    { name: "Alerts",    href: "/notifications", icon: Bell,     imageSrc: null },
  ];

  if (pathname === "/post") return null;

  return (
    <nav
      aria-label="Main navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/96 backdrop-blur-xl border-t border-white/[0.07] safe-area-pb transition-transform duration-300 ease-in-out ${
        scrollDirection === "down" ? "translate-y-[120%]" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = mounted ? pathname === item.href : false;
          const isPulse  = item.href === "/community";
          const isAlerts = item.name === "Alerts";
          const Icon     = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center justify-center transition-all duration-200 ${
                isPulse ? "w-14 h-14" : "w-12 h-12"
              } ${
                isActive && !isPulse ? "text-[var(--accent)]" : !isPulse ? "text-white/45 hover:text-white/75" : ""
              }`}
            >
              {isPulse ? (
                // ── Pulse: circular container, center of gravity ─────────────
                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-[var(--accent)]/[0.13] ring-1 ring-[var(--accent)]/35 drop-shadow-[0_0_20px_rgba(212,175,55,0.55)]"
                    : "bg-white/[0.05] ring-1 ring-white/[0.07] group-hover:bg-[var(--accent)]/[0.07] group-hover:ring-[var(--accent)]/20"
                }`}>
                  <Activity
                    size={24}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={`transition-colors ${
                      isActive ? "text-[var(--accent)]" : "text-white/40 group-hover:text-[var(--accent)]"
                    }`}
                  />
                </div>
              ) : (
                // ── Standard items ───────────────────────────────────────────
                <div className={`relative flex items-center justify-center w-12 h-12 transition-all duration-200 ${
                  isActive
                    ? "drop-shadow-[0_0_10px_rgba(212,175,55,0.75)]"
                    : "group-hover:drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                }`}>
                  {Icon ? (
                    <Icon size={26} strokeWidth={isActive ? 2.1 : 1.6} />
                  ) : item.imageSrc ? (
                    <div className={`w-7 h-7 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[var(--accent)] transition-all ${
                      isActive
                        ? "border-[var(--accent)] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                        : "border-white/20 group-hover:border-[var(--accent)]/40"
                    }`}>
                      <img
                        src={item.imageSrc}
                        alt=""
                        className="w-full h-full object-cover scale-[1.4] mix-blend-multiply"
                      />
                    </div>
                  ) : null}

                  {/* Active dot */}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(212,175,55,1)]" />
                  )}

                  {/* Notification badge */}
                  {isAlerts && notifCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] font-bold text-white leading-none">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
