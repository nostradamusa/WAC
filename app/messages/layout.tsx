import NewMessageFAB from "@/components/messages/NewMessageFAB";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden w-full relative">
      {/* 
        This layout structure allows the `/messages` page to render the list of chats,
        and `/messages/[id]` to render the active chat alongside it (on desktop).
      */}
      {children}
      <NewMessageFAB />
    </div>
  );
}
