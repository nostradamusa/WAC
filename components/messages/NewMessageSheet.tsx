"use client";

import { useState, useRef, useEffect } from "react";
import { X, Search, User, Building2, Briefcase } from "lucide-react";
import Link from "next/link";

interface NewMessageSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewMessageSheet({ isOpen, onClose }: NewMessageSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Mock search results (Priority: 1. People, 2. Organizations, 3. Businesses)
  const results = [
    { id: "1", type: "person", name: "Dritan Hoxha", username: "@dritan", avatar: "https://i.pravatar.cc/150?u=d" },
    { id: "2", type: "person", name: "Emina Prifti", username: "@emina_p", avatar: "https://i.pravatar.cc/150?u=e" },
    { id: "5", type: "person", name: "Arben Lleshi", username: "@arben", avatar: "https://i.pravatar.cc/150?u=a" },
    { id: "3", type: "organization", name: "Albanian Professionals Network", typeDesc: "Organization", avatar: null },
    { id: "4", type: "business", name: "Illyrian Real Estate", typeDesc: "Business", avatar: null },
  ].filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  const people = results.filter(r => r.type === "person");
  const organizations = results.filter(r => r.type === "organization");
  const businesses = results.filter(r => r.type === "business");

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/60 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="w-full sm:max-w-lg bg-[#0A0A0A] sm:rounded-2xl sm:border border-white/5 h-[90dvh] sm:h-[650px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-white tracking-tight">New Message</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 py-4 border-b border-white/[0.05] bg-[#111]">
          <div className="relative flex items-center bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#b08d57]/60 focus-within:shadow-[0_0_15px_rgba(176,141,87,0.1)] transition-all">
            <div className="pl-4 pr-3 text-white/40">
              <Search size={18} />
            </div>
            <input 
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people, organizations, businesses..."
              className="w-full bg-transparent py-3.5 pr-4 text-[15px] outline-none text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto wac-scrollbar px-3 py-2">
          {searchQuery.trim() === "" ? (
             <div className="flex flex-col items-center justify-center h-full text-white/30 text-[15px]">
                <Search size={40} strokeWidth={1} className="mb-4 opacity-40 text-[#b08d57]" />
                <p>Search for a contact or group to message</p>
             </div>
          ) : results.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-white/30 text-[15px]">
                <p>No results found for "{searchQuery}"</p>
             </div>
          ) : (
             <div className="flex flex-col gap-6 py-4">
                
                {/* 1. PEOPLE */}
                {people.length > 0 && (
                   <div>
                      <h3 className="px-4 text-[11px] font-bold tracking-widest uppercase text-[#b08d57] mb-2.5">People</h3>
                      <div className="flex flex-col">
                         {people.map(person => (
                            <Link href={`/messages/${person.id}`} key={person.id} onClick={onClose} className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition group">
                               <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 bg-[#1A1A1A] flex items-center justify-center">
                                  {person.avatar ? (
                                     <img src={person.avatar} className="w-full h-full object-cover" />
                                  ) : (
                                     <User size={20} className="text-white/30" />
                                  )}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[15px] font-bold text-white/90 group-hover:text-[#b08d57] transition-colors">{person.name}</h4>
                                  <p className="text-[13px] text-white/40 truncate">{person.username}</p>
                               </div>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

                {/* 2. ORGANIZATIONS */}
                {organizations.length > 0 && (
                   <div>
                      <h3 className="px-4 text-[11px] font-bold tracking-widest uppercase text-[#b08d57] mb-2.5">Organizations</h3>
                      <div className="flex flex-col">
                         {organizations.map(org => (
                            <Link href={`/messages/${org.id}`} key={org.id} onClick={onClose} className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition group">
                               <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#1A1A1A] flex items-center justify-center text-white/30">
                                 <Building2 size={20} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[15px] font-bold text-white/90 group-hover:text-white transition-colors">{org.name}</h4>
                                  <p className="text-[13px] text-[#b08d57]/70 truncate">{org.typeDesc}</p>
                               </div>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

                {/* 3. BUSINESSES */}
                {businesses.length > 0 && (
                   <div>
                      <h3 className="px-4 text-[11px] font-bold tracking-widest uppercase text-[#b08d57] mb-2.5">Businesses</h3>
                      <div className="flex flex-col">
                         {businesses.map(biz => (
                            <Link href={`/messages/${biz.id}`} key={biz.id} onClick={onClose} className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-white/5 transition group">
                               <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#1A1A1A] flex items-center justify-center text-white/30">
                                 <Briefcase size={20} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[15px] font-bold text-white/90 group-hover:text-white transition-colors">{biz.name}</h4>
                                  <p className="text-[13px] text-[#b08d57]/70 truncate">{biz.typeDesc}</p>
                               </div>
                            </Link>
                         ))}
                      </div>
                   </div>
                )}

             </div>
          )}
        </div>
      </div>
    </div>
  );
}
