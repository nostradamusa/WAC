"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Only render the massive global footer on the homepage
  if (pathname !== "/") {
    return null;
  }

  return <Footer />;
}
