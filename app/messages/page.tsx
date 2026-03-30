"use client";

import { Search } from "lucide-react";
import ConversationList from "@/components/messages/ConversationList";

export default function MessagesInboxPage() {
  return (
    <>
      <ConversationList />

      {/* Desktop right panel — empty state placeholder */}
      <div className="hidden md:flex flex-1 flex-col relative pt-16 md:pt-16 bg-[#070707] z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b08d57]/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-[#b08d57]/10 rounded-full blur-xl scale-125 transition-transform duration-700 group-hover:scale-150" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-b from-[#1a1711] to-[#0A0A0A] flex items-center justify-center border border-[#b08d57]/20 shadow-2xl relative z-10">
              <Search size={42} strokeWidth={1.2} className="text-[#b08d57] opacity-80" />
            </div>
          </div>

          <h2 className="text-3xl font-serif tracking-tight text-white mb-4">Your Conversations</h2>
          <p className="text-[15px] text-white/40 max-w-[360px] mx-auto mb-10 leading-relaxed">
            Open an existing thread from the inbox or start a new conversation with the compose button.
          </p>
        </div>
      </div>
    </>
  );
}
