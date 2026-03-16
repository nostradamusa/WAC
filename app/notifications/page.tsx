"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  X
} from "lucide-react";

// Mock data for initial UI
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "calendar_invite",
    title: "Global Albanian Summit 2026",
    message: "World Albanian Congress invited you to RSVP to this event.",
    time: "10m ago",
    read: false,
    actorName: "WAC Official",
    actorAvatar: "/images/wac-logo.jpg",
    actionRequired: true,
    link: "/events",
    actorProfileLink: "/directory",
    rsvpStatus: null as 'yes' | 'no' | null
  },
  {
    id: 2,
    type: "tag",
    title: "You were mentioned in a post",
    message: "Check out this amazing presentation by @YourName at the Tirana tech conference!",
    time: "1h ago",
    read: false,
    actorName: "Teuta Hoxha",
    actorAvatar: "https://i.pravatar.cc/150?img=11",
    actionRequired: false,
    link: "/community",
    actorProfileLink: "/directory",
    rsvpStatus: null as 'yes' | 'no' | null
  },
  {
    id: 3,
    type: "like",
    title: "Someone liked your post",
    message: "\"I'm excited to announce my new project...\"",
    time: "3h ago",
    read: true,
    actorName: "Drilon Rama",
    actorAvatar: "https://i.pravatar.cc/150?img=33",
    actionRequired: false,
    link: "/community",
    actorProfileLink: "/directory",
    rsvpStatus: null as 'yes' | 'no' | null
  },
  {
    id: 4,
    type: "comment",
    title: "Someone commented on your article",
    message: "\"This is exactly the kind of insight we need for the diaspora.\"",
    time: "1d ago",
    read: true,
    actorName: "Elira M",
    actorAvatar: "https://i.pravatar.cc/150?img=47",
    actionRequired: false,
    link: "/community",
    actorProfileLink: "/directory",
    rsvpStatus: null as 'yes' | 'no' | null
  }
];

export default function NotificationsPage() {
  const router = useRouter();
  const { currentActor } = useActor();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (e: React.MouseEvent, id: number) => {
     e.stopPropagation();
     setNotifications(notifications.filter(n => n.id !== id));
  }

  const handleNotificationClick = (notification: typeof MOCK_NOTIFICATIONS[0]) => {
    if (!notification.read) {
       setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
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

  const handleRSVP = (e: React.MouseEvent, id: number, status: 'yes' | 'no') => {
    e.stopPropagation();
    setNotifications(notifications.map(n => 
       n.id === id ? { ...n, rsvpStatus: status, read: true } : n
    ));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'calendar_invite': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'tag': return <AtSign className="w-4 h-4 text-[var(--accent)]" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-purple-400" />;
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
         {notifications.length === 0 ? (
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
                        : 'bg-white/[0.03] border-[var(--accent)]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
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
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 shrink-0 hover:opacity-80 transition"
                        title="View Profile"
                     >
                        <img src={notification.actorAvatar} alt={notification.actorName} className="w-full h-full object-cover" />
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
                           {notification.rsvpStatus === 'yes' ? (
                              <button disabled className="text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full flex items-center justify-center gap-1 whitespace-nowrap w-[96px] h-[30px] cursor-default">
                                 <Check size={14} strokeWidth={2.5}/> Attending
                              </button>
                           ) : notification.rsvpStatus === 'no' ? (
                              <button disabled className="text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center gap-1 whitespace-nowrap w-[96px] h-[30px] cursor-default">
                                 <X size={14} strokeWidth={2.5}/> Declined
                              </button>
                           ) : (
                              <>
                                 <button 
                                    onClick={(e) => handleRSVP(e, notification.id, 'yes')}
                                    className="text-xs font-bold bg-[var(--accent)] text-black border border-transparent rounded-full hover:bg-[#F3E5AB] transition shadow-md shadow-[var(--accent)]/10 whitespace-nowrap w-[96px] h-[30px] flex items-center justify-center"
                                 >
                                    RSVP Yes
                                 </button>
                                 <button 
                                    onClick={(e) => handleRSVP(e, notification.id, 'no')}
                                    className="text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-full transition whitespace-nowrap w-[96px] h-[30px] flex items-center justify-center"
                                 >
                                    Decline
                                 </button>
                              </>
                           )}
                        </div>
                     )}
                     
                     <span className="text-[9px] sm:text-[10px] text-[var(--accent)] opacity-70 font-medium mt-1 block tracking-wider">
                        {notification.time}
                     </span>
                  </div>

                  {/* Actions / Remove */}
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => removeNotification(e, notification.id)}
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
