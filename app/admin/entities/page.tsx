"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Search, Users, Briefcase, Landmark, User, X, PowerOff, Trash2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { logAdminAction } from "@/lib/adminLogger";

type GlobalEntity = {
  id: string;
  name: string;
  type: "profile" | "business" | "organization" | "group";
  is_verified?: boolean;
  is_suspended: boolean;
  avatar_url?: string;
  description?: string;
  created_at: string;
  metadata?: any;
};

export default function AdminEntityManagementPage() {
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<GlobalEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<GlobalEntity | null>(null);
  const [owners, setOwners] = useState<any[]>([]);

  const searchEntities = async (searchQuery: string) => {
    setLoading(true);
    
    // Globally search all domains
    const [profilesRes, businessesRes, orgsRes, groupsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, is_verified, is_suspended, avatar_url, created_at").ilike("full_name", `%${searchQuery}%`).limit(15),
      supabase.from("businesses").select("id, name, is_verified, is_suspended, logo_url, created_at").ilike("name", `%${searchQuery}%`).limit(15),
      supabase.from("organizations").select("id, name, is_verified, is_suspended, logo_url, created_at").ilike("name", `%${searchQuery}%`).limit(15),
      supabase.from("groups").select("id, name, description, is_suspended, created_at, privacy").ilike("name", `%${searchQuery}%`).limit(15),
    ]);

    const results: GlobalEntity[] = [];
    
    if (profilesRes.data) {
      results.push(...profilesRes.data.map(p => ({
        id: p.id, name: p.full_name || "Unnamed", type: "profile" as const,
        is_verified: p.is_verified, is_suspended: p.is_suspended ?? false,
        avatar_url: p.avatar_url, created_at: p.created_at
      })));
    }
    
    if (businessesRes.data) {
      results.push(...businessesRes.data.map(b => ({
        id: b.id, name: b.name, type: "business" as const,
        is_verified: b.is_verified, is_suspended: b.is_suspended ?? false,
        avatar_url: b.logo_url, created_at: b.created_at
      })));
    }

    if (orgsRes.data) {
      results.push(...orgsRes.data.map(o => ({
        id: o.id, name: o.name, type: "organization" as const,
        is_verified: o.is_verified, is_suspended: o.is_suspended ?? false,
        avatar_url: o.logo_url, created_at: o.created_at
      })));
    }

    if (groupsRes.data) {
      results.push(...groupsRes.data.map(g => ({
        id: g.id, name: g.name, type: "group" as const,
        is_suspended: g.is_suspended ?? false,
        description: g.description, created_at: g.created_at, metadata: { privacy: g.privacy }
      })));
    }

    setEntities(results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) searchEntities(query);
      else setEntities([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Ownership Fetcher
  const loadOwnership = async (entity: GlobalEntity) => {
    setOwners([]);
    try {
      if (entity.type === "group") {
        const { data: members } = await supabase.from("group_members").select("profile_id, role").eq("group_id", entity.id).in("role", ["owner", "admin"]);
        if (members && members.length > 0) {
          const profileIds = members.map(m => m.profile_id);
          const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", profileIds);
          if (profs) {
            setOwners(members.map(m => {
              const p = profs.find(pr => pr.id === m.profile_id);
              return { id: m.profile_id, full_name: p?.full_name || "Unknown", avatar_url: p?.avatar_url, role: m.role };
            }));
          }
        }
      } else if (entity.type === "business" || entity.type === "organization") {
        const table = entity.type === "business" ? "businesses" : "organizations";
        const { data: ent } = await supabase.from(table).select("owner_id").eq("id", entity.id).single();
        if (ent && ent.owner_id) {
          const { data: p } = await supabase.from("profiles").select("id, full_name, avatar_url").eq("id", ent.owner_id).single();
          if (p) setOwners([{ id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, role: "Owner" }]);
        }
      } else {
        setOwners([{ id: entity.id, full_name: entity.name, avatar_url: entity.avatar_url, role: "Self" }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openSheet = (entity: GlobalEntity) => {
    setSelectedEntity(entity);
    loadOwnership(entity);
  };

  // Mutators
  const toggleSuspension = async () => {
    if (!selectedEntity) return;
    const table = selectedEntity.type === "profile" ? "profiles" : selectedEntity.type === "group" ? "groups" : selectedEntity.type === "business" ? "businesses" : "organizations";
    const newState = !selectedEntity.is_suspended;
    
    setSelectedEntity({...selectedEntity, is_suspended: newState});
    setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { ...e, is_suspended: newState } : e));
    
    const { error } = await supabase.from(table).update({ is_suspended: newState }).eq("id", selectedEntity.id);
    if (error) {
      toast.error("Database update failed.");
      // Revert optimistic update
      setSelectedEntity({...selectedEntity, is_suspended: !newState});
      setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { ...e, is_suspended: !newState } : e));
    } else {
      const logged = await logAdminAction(newState ? "SUSPEND_ENTITY" : "UNSUSPEND_ENTITY", selectedEntity.type, selectedEntity.id, { name: selectedEntity.name });
      if (!logged) {
        toast.error("WARNING: Action succeeded but trace log was not recorded!");
      } else {
        toast.success(`Entity ${newState ? 'suspended' : 'unsuspended'}.`);
      }
    }
  };

  const toggleVerification = async () => {
    if (!selectedEntity) return;
    const table = selectedEntity.type === "profile" ? "profiles" : selectedEntity.type === "group" ? "groups" : selectedEntity.type === "business" ? "businesses" : "organizations";
    const newState = !selectedEntity.is_verified;
    
    setSelectedEntity({...selectedEntity, is_verified: newState});
    setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { ...e, is_verified: newState } : e));
    
    const { error } = await supabase.from(table).update({ is_verified: newState }).eq("id", selectedEntity.id);
    if (error) {
      toast.error("Database badge grant failed.");
      setSelectedEntity({...selectedEntity, is_verified: !newState});
      setEntities(prev => prev.map(e => e.id === selectedEntity.id ? { ...e, is_verified: !newState } : e));
    } else {
      const logged = await logAdminAction(newState ? "GRANT_VERIFICATION" : "REVOKE_VERIFICATION", selectedEntity.type, selectedEntity.id, { name: selectedEntity.name });
      if (!logged) {
        toast.error("WARNING: Action succeeded but trace log was not recorded!");
      } else {
        toast.success(`Golden badge ${newState ? 'granted' : 'revoked'}.`);
      }
    }
  };

  const executeHardDelete = async () => {
    if (!selectedEntity || !window.confirm(`DANGER: Are you absolutely sure you want to hard delete ${selectedEntity.name}? This will cascade and permanently destroy all attached data.`)) return;
    
    const table = selectedEntity.type === "profile" ? "profiles" : selectedEntity.type === "group" ? "groups" : selectedEntity.type === "business" ? "businesses" : "organizations";
    const targetId = selectedEntity.id;

    setSelectedEntity(null);
    setEntities(prev => prev.filter(e => e.id !== targetId));

    const { error } = await supabase.from(table).delete().eq("id", targetId);
    if (error) {
      toast.error(`Failed to delete entity: ${error.message}`);
    } else {
      const logged = await logAdminAction("HARD_DELETE_ENTITY", selectedEntity.type, targetId, { deleted_name: selectedEntity.name });
      if (!logged) {
        toast.error("WARNING: Entity deleted but trace log was NOT recorded!");
      } else {
        toast.success("Entity permanently deleted from database.");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "profile": return <User size={16} />;
      case "business": return <Briefcase size={16} />;
      case "organization": return <Landmark size={16} />;
      case "group": return <Users size={16} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-[50rem] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="text-rose-500" />
              Entity Management
            </h1>
            <p className="text-white/50 text-sm">Deep inspection, suspension, and deletion controls.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-white transition-colors">
            Back
          </Link>
        </div>

        {/* Global Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            type="text"
            placeholder="Search profiles, businesses, orgs, and groups globally..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-rose-500/50 focus:bg-white/[0.04] transition-all"
          />
        </div>

        {/* Result Queue */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-white/40 text-sm text-center py-8">Searching infrastructure...</p>
          ) : query.length > 1 && entities.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-8">No matching entities found.</p>
          ) : (
            entities.map((entity) => (
              <div key={entity.id} onClick={() => openSheet(entity)} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10 cursor-pointer transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {entity.avatar_url ? (
                      <img src={entity.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/40 text-xs">{getIcon(entity.type)}</span>
                    )}
                    {entity.is_suspended && <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center backdrop-blur-[1px]"><PowerOff size={14} className="text-white" /></div>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${entity.is_suspended ? 'text-white/50 line-through' : 'text-white'}`}>{entity.name}</p>
                      {entity.is_verified && <VerifiedBadge size="xs" />}
                      {entity.type === "group" && entity.metadata?.privacy === 'secret' && <span className="text-[9px] uppercase font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">Secret</span>}
                    </div>
                    <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5 capitalize">
                      {entity.type} {entity.is_suspended && <span className="text-rose-400 font-bold ml-1">• Suspended</span>}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg text-xs font-bold text-white/40 border border-white/[0.05] bg-white/[0.02]">
                  Manage
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Detail Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedEntity(null)}></div>
          <div className="wac-card w-full max-w-lg relative z-10 p-6 md:p-8 flex flex-col gap-8 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {selectedEntity.avatar_url ? <img src={selectedEntity.avatar_url} className="w-full h-full object-cover" /> : getIcon(selectedEntity.type)}
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {selectedEntity.name} {selectedEntity.is_verified && <VerifiedBadge size="sm" />}
                    </h2>
                    <p className="text-sm text-white/50 capitalize">{selectedEntity.type} • ID: <span className="font-mono text-[10px] text-white/30">{selectedEntity.id.split('-')[0]}...</span></p>
                 </div>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 transition"><X size={16} /></button>
            </div>

            {/* Ownership Roster */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
               <h4 className="text-xs uppercase tracking-wider font-bold text-white/40 mb-3">Ownership & Core Governance</h4>
               {owners.length === 0 ? <p className="text-sm text-white/30 italic">No linked governance records found.</p> : (
                 <div className="space-y-2">
                   {owners.map((o, i) => (
                     <div key={i} className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden">
                         {o.avatar_url ? <img src={o.avatar_url} className="w-full h-full object-cover" /> : <User size={10} className="m-1.5 text-white/30" />}
                       </div>
                       <p className="text-sm text-white/80">{o.full_name || o.name}</p>
                       <span className="text-[10px] uppercase font-bold text-[#b08d57] bg-[#b08d57]/10 px-2 py-0.5 rounded-full">{o.role}</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Moderation Controls */}
            <div>
               <h4 className="text-xs uppercase tracking-wider font-bold text-white/40 mb-3">Moderation Execution</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={toggleVerification} className={`p-4 rounded-xl border flex flex-col gap-1 transition-all text-left ${selectedEntity.is_verified ? 'bg-[#b08d57]/10 border-[#b08d57]/30 text-[#b08d57] hover:bg-[#b08d57]/20' : 'bg-white/[0.02] border-white/[0.05] text-white hover:bg-white/[0.04]'}`}>
                    <span className="font-bold text-sm flex items-center gap-2"><ShieldCheck size={16} /> {selectedEntity.is_verified ? "Revoke Verification" : "Grant Badge"}</span>
                    <span className={`text-[10px] ${selectedEntity.is_verified ? 'text-[#b08d57]/60' : 'text-white/40'}`}>Gives identity weight across discovery engines.</span>
                  </button>

                  <button onClick={toggleSuspension} className={`p-4 rounded-xl border flex flex-col gap-1 transition-all text-left ${selectedEntity.is_suspended ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' : 'bg-white/[0.02] border-white/[0.05] text-white hover:bg-white/[0.04]'}`}>
                    <span className="font-bold text-sm flex items-center gap-2"><PowerOff size={16} /> {selectedEntity.is_suspended ? "Un-Suspend Entity" : "Suspend & Hide"}</span>
                    <span className={`text-[10px] ${selectedEntity.is_suspended ? 'text-amber-500/60' : 'text-white/40'}`}>Removes visibility across all searches.</span>
                  </button>
                  
                  <button onClick={executeHardDelete} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-left group md:col-span-2">
                    <span className="font-bold text-sm text-rose-500 flex items-center justify-center gap-2 group-hover:text-rose-400"><Trash2 size={16} /> Extreme Hard Delete</span>
                    <span className="text-[10px] text-rose-500/50 group-hover:text-rose-400/70 mt-1 block text-center">Irreversible database cascade drop.</span>
                  </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
