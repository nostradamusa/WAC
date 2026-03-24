"use client";

import Link from "next/link";
import { ArrowLeft, Bell, EyeOff, UserX, SwitchCamera, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import WacToggle from "@/components/ui/WacToggle";

export default function MessageSettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    readReceipts: true,
    onlineStatus: true,
    messageRequests: "everyone", // everyone, followers
    notifications: true,
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (data && !error) {
         setSettings({
           readReceipts: data.message_read_receipts ?? true,
           onlineStatus: data.show_activity_status ?? true,
           messageRequests: data.message_requests_policy ?? "everyone",
           notifications: data.push_notifications ?? true,
         });
      }
    }
    loadSettings();
  }, [supabase]);

  const updateSetting = async (key: keyof typeof settings, value: boolean | string) => {
    // Optimistic UI update
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (!userId) return;
    
    // Map Javascript keys to DB column names
    const dbColumnMap: Record<string, string> = {
      readReceipts: 'message_read_receipts',
      onlineStatus: 'show_activity_status',
      messageRequests: 'message_requests_policy',
      notifications: 'push_notifications',
    };
    
    // Async background sync
    const { error } = await supabase
       .from('user_settings')
       .upsert({ user_id: userId, [dbColumnMap[key]]: value }, { onConflict: 'user_id' });
       
    if (error && error.code !== "PGRST204") {
       console.error("Failed to sync setting to Supabase", error);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto wac-scrollbar bg-[#050505] text-white selection:bg-[#b08d57]/30">
      
      {/* ── HEADER (Mobile Only) ───────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden items-center gap-3 px-4 py-3 sticky top-0 z-[60] bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.05]">
        <Link 
          href="/messages"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all -ml-2"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[18px] font-serif font-bold tracking-tight">Settings</h1>
      </div>

      <div className="max-w-6xl mx-auto pb-24 px-4 pt-6 md:pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 animate-in fade-in duration-500">
        
        {/* LEFT COLUMN: Header & Context */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-5">
           <div className="hidden md:block mb-2">
              <Link href="/messages" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-white/70 hover:text-white transition-all">
                 <ArrowLeft size={16} />
                 Back to Messages
              </Link>
           </div>
          <div>
            <h1 className="hidden md:block text-3xl font-serif font-black tracking-tight text-white mb-3">Messaging Settings</h1>
            <p className="text-[14px] text-white/50 leading-relaxed">
              Manage your message requests, read receipts, and notification preferences to control your inbox experience.
            </p>
          </div>
          <div className="hidden md:block bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mt-4">
            <div className="flex items-center gap-3 mb-3 text-[#b08d57]">
               <Shield size={18} />
               <h3 className="text-[13px] uppercase tracking-widest font-bold">Privacy First</h3>
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed">
               For your safety, WAC prevents unsolicited messages from spam accounts. Customize who can send you requests here.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings Panels */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-8">
        
        {/* PRIVACY SECTION */}
        <section>
          <h2 className="text-[13px] font-bold text-[#b08d57] uppercase tracking-wider mb-4 px-1">Privacy & Safety</h2>
          
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {/* Read Receipts Toggle */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-full text-white/50 shrink-0">
                  <EyeOff size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white mb-1">Read Receipts</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed pr-6">Let others know when you have read their messages. If turned off, you won't be able to see read receipts from others.</p>
                </div>
              </div>
              <WacToggle 
                checked={settings.readReceipts}
                onChange={() => updateSetting("readReceipts", !settings.readReceipts)}
              />
            </div>

            {/* Online Status Toggle */}
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/5 rounded-full text-white/50 shrink-0">
                  <SwitchCamera size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white mb-1">Show Activity Status</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed pr-6">Allow accounts you follow and anyone you message to see when you were last active on WAC components.</p>
                </div>
              </div>
              <WacToggle 
                checked={settings.onlineStatus}
                onChange={() => updateSetting("onlineStatus", !settings.onlineStatus)}
              />
            </div>
            
            {/* Blocked Accounts Link */}
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-full text-red-400/80 shrink-0">
                  <UserX size={18} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-white">Blocked Accounts</h3>
              </div>
            </button>
          </div>
        </section>

        {/* CONTROLS SECTION */}
        <section>
          <h2 className="text-[13px] font-bold text-[#b08d57] uppercase tracking-wider mb-4 px-1">Message Requests</h2>
          
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {/* Radio Selection Group */}
            <div className="p-2">
              <button 
                onClick={() => updateSetting("messageRequests", "everyone")}
                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-white/[0.03] transition-colors text-left"
              >
                <div>
                  <h3 className="text-[15px] font-medium text-white mb-0.5">Everyone on WAC</h3>
                  <p className="text-[13px] text-white/40">Anyone can send you a message request.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${settings.messageRequests === 'everyone' ? 'border-[#b08d57] bg-[#b08d57]/20' : 'border-white/20'}`}>
                  {settings.messageRequests === 'everyone' && <div className="w-2.5 h-2.5 rounded-full bg-[#b08d57]" />}
                </div>
              </button>
              
              <button 
                onClick={() => updateSetting("messageRequests", "followers")}
                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-white/[0.03] transition-colors text-left"
              >
                <div>
                  <h3 className="text-[15px] font-medium text-white mb-0.5">Followers Only</h3>
                  <p className="text-[13px] text-white/40">Only accounts you follow or who follow you.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${settings.messageRequests === 'followers' ? 'border-[#b08d57] bg-[#b08d57]/20' : 'border-white/20'}`}>
                  {settings.messageRequests === 'followers' && <div className="w-2.5 h-2.5 rounded-full bg-[#b08d57]" />}
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section>
          <h2 className="text-[13px] font-bold text-[#b08d57] uppercase tracking-wider mb-4 px-1">Notifications</h2>
          
          <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-full text-white/50 shrink-0">
                  <Bell size={18} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-white">Push Notifications</h3>
              </div>
              <WacToggle 
                checked={settings.notifications}
                onChange={() => updateSetting("notifications", !settings.notifications)}
              />
            </div>
          </div>
        </section>

        </div>
      </div>
    </div>
  );
}
