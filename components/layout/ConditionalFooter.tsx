"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// Pages where the footer should be suppressed (utility / overlay surfaces)
const SUPPRESS_PATHS = ["/messages", "/notifications", "/post", "/login", "/signup", "/stories/new"];

export default function ConditionalFooter() {
  const pathname = usePathname();

  if (SUPPRESS_PATHS.some(p => pathname === p || pathname?.startsWith(p + "/"))) {
    return null;
  }

  return <Footer />;
}
