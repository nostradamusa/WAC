"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Compass, Activity, CalendarDays, Network, Bell } from "lucide-react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { useNotificationCount } from "@/lib/hooks/useUnreadCounts";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { name: "Directory", href: "/directory", icon: Compass,      isPulse: false, isAlerts: false },
  { name: "Events",    href: "/events",    icon: CalendarDays, isPulse: false, isAlerts: false },
  { name: "Pulse",     href: "/community", icon: Activity,     isPulse: true,  isAlerts: false },
  { name: "Groups",    href: "/groups",    icon: Network,      isPulse: false, isAlerts: false },
  { name: "Alerts",    href: "/notifications", icon: Bell,     isPulse: false, isAlerts: true },
];

function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileBottomNav() {
  const pathname       = usePathname();
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

  if (pathname === "/post" || pathname === "/stories/new" || pathname === "/welcome") return null;

  const isMessaging = pathname.startsWith("/messages");
  const hideNav = !isMessaging && scrollDirection === "down";

  return (
    <nav
      aria-label="Main navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/96 backdrop-blur-xl border-t border-white/[0.07] safe-area-pb transition-transform duration-300 ease-in-out ${
        hideNav ? "translate-y-[120%]" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = mounted ? isRouteActive(pathname, item.href) : false;
          const { icon: Icon, isPulse, isAlerts } = item;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                if (isActive && isPulse) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("wac-refresh-feed"));
                }
              }}
              className={`group relative flex flex-col items-center justify-center transition-all duration-200 ${
                isPulse ? "w-[3.25rem] h-[3.25rem]" : "w-10 h-10 sm:w-11 sm:h-11"
              } ${
                isActive && !isPulse ? "text-[var(--accent)]" : !isPulse ? "text-white/45 hover:text-white/75" : ""
              }`}
            >
              {isPulse ? (
                // ── Pulse: circular container — live/real-time identity ─────────
                <div className={`flex items-center justify-center w-[3.25rem] h-[3.25rem] rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-rose-500/[0.13] ring-1 ring-rose-500/35 drop-shadow-[0_0_20px_rgba(244,63,94,0.45)]"
                    : "bg-white/[0.05] ring-1 ring-white/[0.07] group-hover:bg-rose-500/[0.07] group-hover:ring-rose-500/20"
                }`}>
                  <Activity
                    size={24}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={`transition-colors ${
                      isActive ? "text-rose-400" : "text-white/40 group-hover:text-rose-400/70"
                    }`}
                  />
                </div>
              ) : (
                // ── Standard items ────────────────────────────────────────────
                <div className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 transition-all duration-200 ${
                  isActive
                    ? "drop-shadow-[0_0_10px_rgba(176,141,87,0.75)]"
                    : "group-hover:drop-shadow-[0_0_10px_rgba(176,141,87,0.5)]"
                }`}>
                  <Icon size={24} strokeWidth={isActive ? 2.2 : 1.6} />

                  {/* Active dot */}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(176,141,87,1)]" />
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
