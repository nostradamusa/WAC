"use client";

import { useState } from "react";
import { Plus, X, Search, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";

export default function NewMessageFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollDirection = useScrollDirection();

  const mockContacts = [
    { id: "1", name: "Arben Lleshi", headline: "Real Estate Broker", verified: true, avatar: "https://i.pravatar.cc/150?u=a" },
    { id: "3", name: "Teuta Hoxha", headline: "Architect", verified: false, avatar: "https://i.pravatar.cc/150?u=b" },
    { id: "5", name: "Dritan Celaj", headline: "Software Engineer", verified: true, avatar: "https://i.pravatar.cc/150?u=c" },
    { id: "7", name: "Erand Kapo", headline: "CEO at TechCorp", verified: false, avatar: "https://i.pravatar.cc/150?u=d" },
  ];

  const filteredContacts = mockContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 md:right-6 w-14 h-14 bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 z-[60] overflow-hidden group transition-all duration-300 ease-in-out ${
          scrollDirection === "down" ? "bottom-6" : "bottom-24 md:bottom-6"
        }`}
      >
        <Plus size={28} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[600px] max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-xl font-bold font-serif tracking-tight">New Message</h2>
              <button onClick={() => setIsOpen(false)} className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-[var(--border)]">
               <div className="relative">
                 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Search people or organizations..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)] transition text-white"
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto wac-scrollbar">
               {filteredContacts.length === 0 ? (
                 <div className="p-8 text-center text-white/50 text-sm">
                   No contacts found matching "{searchQuery}"
                 </div>
               ) : (
                 <div className="p-2 flex flex-col gap-1">
                   {filteredContacts.map(contact => (
                     <button key={contact.id} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition text-left">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                           <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col flex-1">
                           <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">{contact.name}</span>
                              {contact.verified && <CheckCircle2 size={12} className="text-[#D4AF37]" />}
                           </div>
                           <span className="text-xs text-white/50">{contact.headline}</span>
                        </div>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
