"use client";

import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const noAnimateRoutes = ["/messages", "/stories/new", "/post"];

  if (noAnimateRoutes.some(route => pathname && pathname.startsWith(route))) {
    return <>{children}</>;
  }

  return (
    <div
      key={pathname}
      className="w-full flex-1 flex flex-col min-h-0 animate-page-enter"
    >
      {children}
    </div>
  );
}
