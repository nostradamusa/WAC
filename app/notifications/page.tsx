"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { 
  Bell, 
  Calendar, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  AtSign,
  ChevronLeft,
  Check,
  X,
  Briefcase,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

type UnifiedNotification = {
  id: string;
  sourceType: "notification" | "connection_request" | "entity_invite";
  type: string; // "rsvp", "reply", "mention", "connection", "invite"
  title: string;
  message: string;
  time: string;
  timestamp: Date;
  read: boolean;
  actorName: string;
  actorAvatar: string | null;
  actionRequired: boolean;
  link?: string;
  actorProfileLink?: string;
  raw: any;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { currentActor } = useActor();
  
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setUserEmail(data.session.user.email ?? null);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchAll = async () => {
    if (!userId) return;

    try {
      // 1. Fetch DB Notifications
      const { data: dbNotifs } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!actor_id(full_name, avatar_url, username)
        `)
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      // 2. Fetch Connection Requests
      const { data: connReqs } = await supabase
        .from("connection_requests")
        .select(`
          *,
          requester:profiles!requester_id(full_name, avatar_url, username)
        `)
        .eq("recipient_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // 3. Fetch Entity Invites
      const { data: invites } = userEmail ? await supabase
        .from("entity_invites")
        .select("*")
        .eq("email", userEmail)
        .eq("status", "pending")
        .order("created_at", { ascending: false }) : { data: [] };

      const unified: UnifiedNotification[] = [];

      if (dbNotifs) {
        for (const n of dbNotifs) {
          let title = "New Notification";
          let message = "";
          let link = "/";
          
          if (n.type === "rsvp") {
            title = "New Event RSVP";
            message = `RSVP'd ${n.metadata?.status ?? "attending"} to ${n.metadata?.event_title ?? "your event"}`;
            link = `/events/${n.entity_id}`;
          } else if (n.type === "reply") {
            title = "New Reply";
            message = "Replied to your post";
            link = `/post/${n.entity_id}`;
          }

          unified.push({
            id: `notif_${n.id}`,
            sourceType: "notification",
            type: n.type,
            title,
            message,
            time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
            timestamp: new Date(n.created_at),
            read: n.is_read,
            actorName: n.actor?.full_name || "WAC Member",
            actorAvatar: n.actor?.avatar_url || null,
            actionRequired: false,
            link,
            actorProfileLink: n.actor?.username ? `/people/${n.actor.username}` : undefined,
            raw: n
          });
        }
      }

      if (connReqs) {
        for (const req of connReqs) {
          unified.push({
            id: `conn_${req.id}`,
            sourceType: "connection_request",
            type: "connection",
            title: "Connection Request",
            message: "wants to connect with you",
            time: formatDistanceToNow(new Date(req.created_at), { addSuffix: true }),
            timestamp: new Date(req.created_at),
            read: false,
            actorName: req.requester?.full_name || "WAC Member",
            actorAvatar: req.requester?.avatar_url || null,
            actionRequired: true,
            actorProfileLink: req.requester?.username ? `/people/${req.requester.username}` : undefined,
            raw: req
          });
        }
      }

      if (invites) {
        for (const invite of invites) {
          unified.push({
            id: `inv_${invite.id}`,
            sourceType: "entity_invite",
            type: "invite",
            title: `${invite.entity_type === "organization" ? "Organization" : "Business"} Invite`,
            message: `Invited you to join as a ${invite.role}`,
            time: formatDistanceToNow(new Date(invite.created_at), { addSuffix: true }),
            timestamp: new Date(invite.created_at),
            read: false,
            actorName: "WAC Admin",
            actorAvatar: null,
            actionRequired: true,
            raw: invite
          });
        }
      }

      unified.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(unified);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchAll();
  }, [userId, userEmail]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const dbNotifs = notifications.filter(n => n.sourceType === "notification" && !n.read);
    setNotifications(notifications.map(n => n.sourceType === "notification" ? { ...n, read: true } : n));
    
    if (dbNotifs.length > 0) {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", dbNotifs.map(n => n.raw.id));
    }
  };

  const removeNotification = async (e: React.MouseEvent, item: UnifiedNotification) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== item.id));

    if (item.sourceType === "notification") {
      await supabase.from("notifications").delete().eq("id", item.raw.id);
    }
  }

  const handleNotificationClick = async (notification: UnifiedNotification) => {
    if (!notification.read && notification.sourceType === "notification") {
       setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
       await supabase.from("notifications").update({ is_read: true }).eq("id", notification.raw.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleAvatarClick = (e: React.MouseEvent, link?: string) => {
    e.stopPropagation();
    if (link) {
      router.push(link);
    }
  };

  const handleAction = async (e: React.MouseEvent, item: UnifiedNotification, action: 'accept' | 'decline') => {
    e.stopPropagation();
    
    // Optimistic UI
    setNotifications(notifications.filter(n => n.id !== item.id));

    if (item.sourceType === "connection_request") {
      const status = action === 'accept' ? 'accepted' : 'rejected';
      await supabase.from("connection_requests").update({ status }).eq("id", item.raw.id);
      if (action === "accept") toast.success("Connection accepted");
    } else if (item.sourceType === "entity_invite") {
      const status = action === 'accept' ? 'accepted' : 'declined';
      await supabase.from("entity_invites").update({ status }).eq("id", item.raw.id);
      
      if (action === "accept") {
        // We'd add them to group_members or business_members, etc.
        // For simplicity in UI logic:
        toast.success("Invite accepted! Check your settings.");
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'calendar_invite': 
      case 'rsvp': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'reply':
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'tag': 
      case 'mention': return <AtSign className="w-4 h-4 text-[var(--accent)]" />;
      case 'connection': return <UserPlus className="w-4 h-4 text-purple-400" />;
      case 'invite': return <Users className="w-4 h-4 text-teal-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pt-14 md:pt-28 pb-4 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 sticky top-[56px] md:top-[90px] z-40 bg-[var(--background)]/95 backdrop-blur-xl py-4 border-b border-white/5 md:border-none md:bg-transparent -mx-4 px-4 sm:mx-0 sm:px-0">
         <div className="flex items-center gap-3">
            <Link href="/" className="md:hidden p-2 -ml-2 rounded-full hover:bg-white/5 transition">
               <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold font-serif flex items-center gap-3">
               Alerts
               {unreadCount > 0 && (
                  <span className="bg-[var(--accent)] text-black text-xs font-bold py-0.5 px-2 rounded-full hidden sm:inline-block">
                     {unreadCount} New
                  </span>
               )}
            </h1>
         </div>
         
         <div className="flex items-center gap-4">
            {unreadCount > 0 && (
               <button 
                  onClick={markAllRead}
                  className="text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)]/10 px-3 py-1.5 rounded-full transition"
               >
                  Mark all read
               </button>
            )}
         </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
         {loading ? (
           <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div></div>
         ) : notifications.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
               <Bell className="w-12 h-12 mb-4 opacity-50" strokeWidth={1} />
               <p>You're all caught up!</p>
            </div>
         ) : (
            notifications.map((notification) => (
               <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                     cursor-pointer group relative flex gap-3 p-3 rounded-2xl border transition-all duration-300
                     ${notification.read 
                        ? 'bg-transparent border-transparent hover:bg-white/[0.02]' 
                        : 'bg-white/[0.03] border-[var(--accent)]/20 shadow-[0_0_15px_rgba(176,141,87,0.05)]'
                     }
                  `}
               >
                  {/* Unread indicator dot (Mobile) */}
                  {!notification.read && (
                     <div className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] sm:hidden"></div>
                  )}

                  {/* Avatar & Icon Column */}
                  <div className="relative shrink-0 mt-1 pl-2 sm:pl-0">
                     <div 
                        onClick={(e) => handleAvatarClick(e, notification.actorProfileLink)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 shrink-0 hover:opacity-80 transition ${notification.actorAvatar ? "" : "bg-white/5 flex items-center justify-center text-[var(--accent)] font-bold text-xs"}`}
                        title="View Profile"
                     >
                        {notification.actorAvatar ? (
                          <img src={notification.actorAvatar} alt={notification.actorName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{notification.actorName.charAt(0)}</span>
                        )}
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1A1A1A] border-2 border-[var(--background)] flex items-center justify-center shadow-sm pointer-events-none">
                        {getIcon(notification.type)}
                     </div>
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 pr-6">
                     <div className="flex justify-between items-start gap-2 mb-0.5">
                        <h3 className={`text-sm pr-4 ${notification.read ? 'font-medium text-white/90' : 'font-bold text-white'}`}>
                           {notification.title}
                        </h3>
                     </div>
                     
                     <p className="text-xs text-white/60 line-clamp-2 leading-snug mb-1.5 pointer-events-none">
                        <span className="font-semibold text-white/80 mr-1">{notification.actorName}</span>
                        {notification.message}
                     </p>

                     {notification.actionRequired && (
                        <div className="flex gap-2 mt-2">
                           <button 
                              onClick={(e) => handleAction(e, notification, 'accept')}
                              className="text-xs font-bold bg-[var(--accent)] text-black border border-transparent rounded-full hover:bg-[#F3E5AB] transition shadow-md shadow-[var(--accent)]/10 whitespace-nowrap px-4 py-1.5 flex items-center justify-center"
                           >
                              Accept
                           </button>
                           <button 
                              onClick={(e) => handleAction(e, notification, 'decline')}
                              className="text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-full transition whitespace-nowrap px-4 py-1.5 flex items-center justify-center"
                           >
                              Decline
                           </button>
                        </div>
                     )}
                     
                     <span className="text-[9px] sm:text-[10px] text-[var(--accent)] opacity-70 font-medium mt-1 block tracking-wider">
                        {notification.time}
                     </span>
                  </div>

                  {/* Actions / Remove */}
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => removeNotification(e, notification)}
                        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-red-400 transition text-white/40"
                        title="Remove notification"
                     >
                        <X size={14} />
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>

    </div>
  );
}
