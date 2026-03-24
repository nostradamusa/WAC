"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Search, User, Briefcase, Landmark, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { logAdminAction } from "@/lib/adminLogger";

type Entity = {
  id: string;
  name: string;
  type: "profile" | "business" | "organization";
  is_verified: boolean;
  avatar_url?: string;
  email?: string; // only for profiles
};

export default function AdminVerificationPage() {
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEntities = async (searchQuery: string) => {
    setLoading(true);
    
    // We do sequential searches since it's an internal admin tool
    const [profilesRes, businessesRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, is_verified, avatar_url, email").ilike("full_name", `%${searchQuery}%`).limit(10),
      supabase.from("businesses").select("id, name, is_verified, logo_url").ilike("name", `%${searchQuery}%`).limit(10),
      supabase.from("organizations").select("id, name, is_verified, logo_url").ilike("name", `%${searchQuery}%`).limit(10),
    ]);

    const results: Entity[] = [];
    
    if (profilesRes.data) {
      results.push(...profilesRes.data.map(p => ({
        id: p.id,
        name: p.full_name || "Unnamed",
        type: "profile" as const,
        is_verified: p.is_verified,
        avatar_url: p.avatar_url,
        email: p.email
      })));
    }
    
    if (businessesRes.data) {
      results.push(...businessesRes.data.map(b => ({
        id: b.id,
        name: b.name,
        type: "business" as const,
        is_verified: b.is_verified,
        avatar_url: b.logo_url
      })));
    }

    if (orgsRes.data) {
      results.push(...orgsRes.data.map(o => ({
        id: o.id,
        name: o.name,
        type: "organization" as const,
        is_verified: o.is_verified,
        avatar_url: o.logo_url
      })));
    }

    setEntities(results);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        searchEntities(query);
      } else {
        setEntities([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleVerification = async (entity: Entity) => {
    const newValue = !entity.is_verified;
    const table = entity.type === "profile" ? "profiles" : entity.type === "business" ? "businesses" : "organizations";
    
    // Optimistic update
    setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, is_verified: newValue } : e));
    
    const { error } = await supabase.from(table).update({ is_verified: newValue }).eq("id", entity.id);
    
    if (error) {
      toast.error(`Failed to update ${entity.name}`);
      console.error(error);
      // Revert
      setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, is_verified: entity.is_verified } : e));
    } else {
      const logged = await logAdminAction(newValue ? "GRANT_VERIFICATION" : "REVOKE_VERIFICATION", entity.type, entity.id, { name: entity.name });
      if (!logged) {
         toast.error("WARNING: Action succeeded but trace log was not recorded!");
      } else {
         toast.success(`${entity.name} is now ${newValue ? 'verified' : 'unverified'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-[50rem] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="text-[#b08d57]" />
              Verification Desk
            </h1>
            <p className="text-white/50 text-sm">Grant or revoke the golden eagle badge.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors">
            Back
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text"
            placeholder="Search people, businesses, or orgs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#b08d57]/50 focus:bg-white/[0.04] transition-all"
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-white/40 text-sm text-center py-8">Searching directory...</p>
          ) : query.length > 1 && entities.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No matching entities found.</p>
          ) : (
            entities.map((entity) => (
              <div key={entity.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {entity.avatar_url ? (
                      <img src={entity.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-xs">
                        {entity.type === "profile" ? <User size={16} /> : entity.type === "business" ? <Briefcase size={16} /> : <Landmark size={16} />}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{entity.name}</p>
                      {entity.is_verified && <VerifiedBadge size="xs" />}
                    </div>
                    <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                      <span className="capitalize">{entity.type}</span>
                      {entity.email && <span>· {entity.email}</span>}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleVerification(entity)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                    entity.is_verified 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                      : 'bg-[#b08d57]/10 text-[#b08d57] border-[#b08d57]/20 hover:bg-[#b08d57]/20 flex items-center gap-1.5'
                  }`}
                >
                  {entity.is_verified ? "Revoke Badge" : <><Check size={14} /> Grant</>}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
