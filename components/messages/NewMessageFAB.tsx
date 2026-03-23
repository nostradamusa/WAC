"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, CheckCircle2 } from "lucide-react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";
import { searchMessagingContacts, getOrCreateConversation, MessagingContact, MessagingActorType } from "@/lib/services/messagingService";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useActor } from "@/components/providers/ActorProvider";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function toMessagingActorType(type: "person" | "business" | "organization"): MessagingActorType {
  return type === "person" ? "user" : type;
}

export default function NewMessageFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollDirection = useScrollDirection();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<MessagingContact[]>([]);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { currentActor } = useActor();

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setTimeout(() => setFilteredContacts([]), 0);
      return;
    }

    async function search() {
      setIsSearching(true);
      const results = await searchMessagingContacts(debouncedQuery);
      setFilteredContacts(results);
      setIsSearching(false);
    }
    
    search();
  }, [debouncedQuery]);

  const handleStartChat = async (contact: MessagingContact) => {
    setIsCreating(true);
    
    if (!currentActor) {
      alert("You must be logged in to send a message.");
      setIsCreating(false);
      return;
    }

    const { success, conversationId } = await getOrCreateConversation(
      currentActor.id,
      toMessagingActorType(currentActor.type),
      contact.id,
      contact.type
    );

    setIsCreating(false);

    if (success && conversationId) {
      setIsOpen(false);
      router.push(`/messages/${conversationId}`);
    } else {
      alert("Failed to create conversation.");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 md:right-6 w-14 h-14 bg-[var(--accent)] text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(176,141,87,0.4)] hover:scale-110 z-[60] overflow-hidden group transition-all duration-300 ease-in-out ${
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
               {isSearching ? (
                 <div className="p-8 flex justify-center"><Loader2 className="animate-spin opacity-50" size={24} /></div>
               ) : searchQuery.length < 2 ? (
                 <div className="p-8 text-center text-white/50 text-sm">
                   Type at least 2 characters to search...
                 </div>
               ) : filteredContacts.length === 0 ? (
                 <div className="p-8 text-center text-white/50 text-sm">
                   No contacts found matching &quot;{searchQuery}&quot;
                 </div>
               ) : (
                 <div className="p-2 flex flex-col gap-1">
                   {filteredContacts.map(contact => (
                     <button 
                       key={contact.id}
                       disabled={isCreating}
                       onClick={() => handleStartChat(contact)}
                       className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition text-left disabled:opacity-50"
                     >
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[var(--accent)] text-xs">
                           {contact.avatar_url ? (
                             <img src={contact.avatar_url} alt={contact.name} className="w-full h-full object-cover" />
                           ) : (
                             contact.name.charAt(0)
                           )}
                        </div>
                        <div className="flex flex-col flex-1">
                           <div className="flex items-center gap-1">
                              <span className="font-semibold text-sm">{contact.name}</span>
                              {contact.is_verified && <CheckCircle2 size={12} className="text-[#b08d57]" />}
                              <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded bg-white/10 capitalize">{contact.type}</span>
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
