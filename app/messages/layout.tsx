"use client";

import { usePathname } from "next/navigation";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActiveChat = pathname.startsWith("/messages/") && pathname.split("/").length > 2;

  return (
    <div 
      className={`flex bg-black text-white overflow-hidden w-full relative h-[calc(100dvh-74px)] -mb-[72px] md:-mb-0 md:h-[calc(100vh-80px)] transition-none`}
    >
      {/* 
        This layout structure allows the `/messages` page to render the list of chats,
        and `/messages/[id]` to render the active chat alongside it (on desktop).
      */}
      {children}
    </div>
  );
}
