/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Bell, BellOff, BellRing, Check, CheckCheck, Clock, Sparkles, Trash2, User, X } from "lucide-react";
import { Booking, Client, Service, Staff } from "../types";

interface LocalNotification {
  id: string;
  bookingId: string;
  title: string;
  message: string;
  time: string;
  date: string;
  clientName: string;
  serviceName: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
  selectedBusinessId: string;
}

export default function NotificationCenter({
  bookings,
  clients,
  services,
  staff,
  selectedBusinessId
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<LocalNotification[]>(() => {
    const saved = localStorage.getItem("vxcrm_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifiedIds, setNotifiedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("vxcrm_notified_booking_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<LocalNotification | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("vxcrm_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("vxcrm_notified_booking_ids", JSON.stringify(notifiedIds));
  }, [notifiedIds]);

  // Request browser Notification permissions
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const resp = await Notification.requestPermission();
      setPermission(resp);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper resolvers
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "კლიენტი";
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "სერვისი";

  // Notification sound effect using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12); // A5

      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by user gesture:", e);
    }
  };

  // Trigger Notification helper
  const triggerNotification = (booking: Booking, isMock = false) => {
    const clientName = getClientName(booking.clientId);
    const serviceName = getServiceName(booking.serviceId);
    
    const title = "🔔 შეხსენება ჯავშანზე";
    const message = `${clientName}-ს ჩაწერილი აქვს სერვისი "${serviceName}" ${booking.time}-ზე (1 საათში).`;

    const newNotification: LocalNotification = {
      id: `notif_${Date.now()}_${booking.id}`,
      bookingId: booking.id,
      title,
      message,
      time: booking.time,
      date: booking.date,
      clientName,
      serviceName,
      isRead: false,
      createdAt: new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })
    };

    // Add to list
    setNotifications(prev => [newNotification, ...prev]);

    // Track notified ID to prevent duplicates
    if (!isMock) {
      setNotifiedIds(prev => [...prev, booking.id]);
    }

    // Trigger UI Toast
    setToast(newNotification);
    playBeep();

    // Trigger Browser Native Notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico"
        });
      } catch (err) {
        console.error("Browser notification failed to trigger", err);
      }
    }
  };

  // Check bookings periodically
  useEffect(() => {
    const checkBookings = () => {
      const now = new Date();
      
      // We will parse the todayStr as YYYY-MM-DD
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      // Filter only pending bookings of the selected business for today
      const todayBookings = bookings.filter(
        b => b.date === todayStr && b.status === "მოლოდინში" && b.businessId === selectedBusinessId
      );

      todayBookings.forEach(booking => {
        // Prevent repeating notifications
        if (notifiedIds.includes(booking.id)) return;

        try {
          const [hours, mins] = booking.time.split(":").map(Number);
          const bookingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
          
          // Calculate difference in milliseconds and minutes
          const diffMs = bookingTime.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          // Trigger reminder if the booking starts in exactly 1 hour (between 0 and 60 minutes)
          // Specifically, standard trigger is if booking is 1 hour away (e.g. 50 to 60 minutes, or simply <= 60 mins and > 0 mins)
          if (diffMins > 0 && diffMins <= 60) {
            triggerNotification(booking);
          }
        } catch (e) {
          console.error("Error evaluating booking time difference:", e);
        }
      });
    };

    // Run check immediately and then every 30 seconds
    checkBookings();
    const interval = setInterval(checkBookings, 30000);
    return () => clearInterval(interval);
  }, [bookings, notifiedIds, selectedBusinessId, clients, services]);

  // Auto-clear Toast banner after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Actions
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mock test trigger function
  const triggerMockReminder = () => {
    // Generate a beautiful dummy booking
    const randomBooking: Booking = {
      id: `mock_${Date.now()}`,
      businessId: selectedBusinessId,
      clientId: clients[0]?.id || "cli_1",
      serviceId: services[0]?.id || "ser_1",
      staffId: staff[0]?.id || "stf_1",
      date: new Date().toISOString().split("T")[0],
      time: new Date(Date.now() + 55 * 60000).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }),
      price: 45,
      status: "მოლოდინში"
    };

    triggerNotification(randomBooking, true);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
        title="შეხსენებები / შეტყობინებები"
        id="notification-bell-btn"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-wiggle" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                შეხსენებები
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">
                  {unreadCount} ახალი
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              {permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  title="ჩართეთ ბრაუზერის შეტყობინებები"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  ჩართვა
                </button>
              )}
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                    title="ყველას წაკითხულად მონიშვნა"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="ყველას წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                  <BellOff className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                  შეტყობინებები არ არის
                </h4>
                <p className="text-[10px] text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">
                  ჯავშნამდე 1 საათით ადრე აქ გამოჩნდება შეხსენებები.
                </p>
                <button
                  onClick={triggerMockReminder}
                  className="mt-2 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs inline-block"
                >
                  ტესტირება (Mock Reminder)
                </button>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex gap-3 relative group ${
                    n.isRead ? "bg-white dark:bg-slate-900" : "bg-indigo-50/20 dark:bg-indigo-950/10"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="space-y-1 flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {n.title}
                      </h4>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
                        {n.createdAt}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {n.date} {n.time}
                      </span>
                    </div>
                  </div>

                  <div className="absolute right-2 top-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button
                        onClick={() => {
                          setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-600 hover:text-emerald-700 rounded transition-colors cursor-pointer"
                        title="წაკითხულად მონიშვნა"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer test utility */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={triggerMockReminder}
                className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
              >
                + ტესტირების შეხსენების გამოწვევა
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen Toast (Banner) System */}
      {toast && (
        <div className="fixed bottom-5 right-5 w-[340px] sm:w-[380px] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[9999] border border-slate-800 flex items-start gap-3.5 animate-slide-left pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40 shrink-0 text-indigo-400">
            <BellRing className="w-5 h-5 animate-wiggle" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-bold text-xs text-slate-100 tracking-tight">
              {toast.title}
            </h4>
            <p className="text-[11px] text-slate-300 font-medium leading-normal pr-4">
              {toast.message}
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                {toast.time}
              </span>
              <button
                onClick={() => {
                  setNotifications(prev => prev.map(notif => notif.id === toast.id ? { ...notif, isRead: true } : notif));
                  setToast(null);
                }}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                წავიკითხე
              </button>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
