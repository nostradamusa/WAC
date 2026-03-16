"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Compass, Activity, CalendarDays, Bell } from "lucide-react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: "Home", href: "/", icon: null, imageSrc: "/images/wac-logo.jpg" },
    { name: "Directory", href: "/directory", icon: Compass },
    { name: "The Pulse", href: "/community", icon: Activity },
    { name: "Events", href: "/events", icon: CalendarDays },
    { name: "Alerts", href: "/notifications", icon: Bell },
  ];

  if (pathname === '/post') {
    return null;
  }

  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-md border-t border-white/10 px-2 py-2 safe-area-pb transition-transform duration-300 ease-in-out ${
        scrollDirection === "down" ? "translate-y-[120%]" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = mounted ? pathname === item.href : false;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`group flex flex-col items-center justify-center w-16 gap-1 transition-all ${
                isActive ? "text-[var(--accent)]" : "text-white/60 hover:text-[var(--accent)]"
              }`}
            >
              <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]' : 'group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]'}`}>
                {Icon ? (
                  <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                ) : item.imageSrc ? (
                  <div className={`w-6 h-6 rounded-full overflow-hidden border ${isActive ? "border-[var(--accent)]" : "border-white/20"} flex items-center justify-center`}>
                    <img src={item.imageSrc} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : null}
                {item.name === "Alerts" && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    3
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
