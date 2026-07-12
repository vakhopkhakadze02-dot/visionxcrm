/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, TrendingUp, Clock, CalendarDays, Edit2, CheckCircle, XCircle, Trash2, User, Sparkles } from "lucide-react";
import { Booking, Client, Service, Staff, Business } from "../types";

interface DashboardProps {
  selectedBusiness: Business;
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
  onOpenNewBooking: () => void;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onUpdateBookingStatus: (id: string, status: "დასრულებული" | "მოლოდინში" | "გაუქმებული") => void;
}

// Translate dates into beautiful Georgian string
export function getGeorgianDate(dateStr: string = "2026-07-12"): string {
  const days = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
  const months = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];
  
  try {
    const d = new Date(dateStr);
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const monthName = months[d.getMonth()];
    const yearNum = d.getFullYear();
    
    return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
  } catch (e) {
    return "კვირა, 12 ივლისი 2026";
  }
}

export default function Dashboard({
  selectedBusiness,
  bookings,
  clients,
  services,
  staff,
  onOpenNewBooking,
  onEditBooking,
  onDeleteBooking,
  onUpdateBookingStatus
}: DashboardProps) {
  
  // Filter bookings for today (2026-07-12) and current business
  const todayStr = "2026-07-12";
  const businessBookings = bookings.filter(b => b.businessId === selectedBusiness.id);
  const todayBookings = businessBookings.filter(b => b.date === todayStr);

  // Stats calculations
  const todayBookingsCount = todayBookings.length;
  
  // Revenue is only from completed or pending (un-canceled) today bookings
  const todayRevenue = todayBookings
    .filter(b => b.status !== "გაუქმებული")
    .reduce((sum, b) => sum + b.price, 0);

  const pendingCount = todayBookings.filter(b => b.status === "მოლოდინში").length;

  // Helper resolvers
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "უცნობი კლიენტი";
  const getClientPhone = (id: string) => clients.find(c => c.id === id)?.phone || "ტელეფონი უცნობია";
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "სერვისი";
  const getServiceDuration = (id: string) => services.find(s => s.id === id)?.duration || 30;
  const getStaffName = (id: string) => staff.find(st => st.id === id)?.name || "სპეციალისტი";

  return (
    <div className="space-y-5">
      {/* Top Welcome Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 tracking-tight flex items-center gap-2">
            გამარჯობა, {selectedBusiness.ownerName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            {getGeorgianDate(todayStr)}
          </p>
        </div>
        <button
          onClick={onOpenNewBooking}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 shadow-sm self-start sm:self-auto"
          id="btn-new-booking"
        >
          <CalendarDays className="w-4 h-4" />
          <span>+ ახალი ჯავშანი</span>
        </button>
      </div>

      {/* Statistics Cards (High Density Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              დღევანდელი ჯავშნები
            </span>
            <span className="text-2xl font-bold text-slate-900 font-display block leading-none">
              {todayBookingsCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50/80 flex items-center justify-center border border-indigo-100 shrink-0">
            <Calendar className="w-4.5 h-4.5 text-indigo-600" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              დღევანდელი შემოსავალი
            </span>
            <span className="text-2xl font-bold text-slate-900 font-display block leading-none">
              {todayRevenue}₾
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0">
            <TrendingUp className="w-4.5 h-4.5 text-teal-600" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              მოლოდინში
            </span>
            <span className="text-2xl font-bold text-slate-900 font-display block leading-none">
              {pendingCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
            <Clock className="w-4.5 h-4.5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Today's Bookings Main Panel (High Density Table Style) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-display font-bold text-slate-800 text-sm">
            დღევანდელი ჯავშნები
          </h2>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            სულ {todayBookingsCount}
          </span>
        </div>

        <div className="p-4">
          {todayBookingsCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150">
                <CalendarDays className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-400 text-xs font-semibold">
                დღეს ჯავშნები არ არის
              </p>
              <button
                onClick={onOpenNewBooking}
                className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                + ჯავშნის დამატება
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="p-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-lg transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left Info Column */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0 text-center min-w-[64px]">
                      <span className="text-xs font-bold text-indigo-600 block leading-none">
                        {booking.time}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 font-bold block uppercase tracking-wider">
                        საათი
                      </span>
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{getClientName(booking.clientId)}</span>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono shrink-0">
                          ({getClientPhone(booking.clientId)})
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap">
                        <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700">{getServiceName(booking.serviceId)}</span> 
                        <span className="text-slate-300">|</span>
                        <span>{getServiceDuration(booking.serviceId)} წუთი</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-extrabold text-slate-800">{booking.price}₾</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] text-slate-400">
                          სპეციალისტი: <span className="text-slate-600 font-bold">{getStaffName(booking.staffId)}</span>
                        </span>
                      </p>
                      {booking.notes && (
                        <p className="text-[10px] text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded inline-block max-w-md truncate font-medium">
                          შენიშვნა: {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Status / Controls Column */}
                  <div className="flex items-center justify-end gap-3 shrink-0 self-end sm:self-auto">
                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                      booking.status === "დასრულებული"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : booking.status === "გაუქმებული"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {booking.status}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5">
                      {booking.status === "მოლოდინში" && (
                        <>
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, "დასრულებული")}
                            title="დასრულებულად მონიშვნა"
                            className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded transition-colors border border-transparent hover:border-emerald-100"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(booking.id, "გაუქმებული")}
                            title="ჯავშნის გაუქმება"
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded transition-colors border border-transparent hover:border-rose-100"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => onEditBooking(booking)}
                        title="რედაქტირება"
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors border border-transparent hover:border-slate-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("ნამდვილად გსურთ ამ ჯავშნის წაშლა?")) {
                            onDeleteBooking(booking.id);
                          }
                        }}
                        title="წაშლა"
                        className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
