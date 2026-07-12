/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, User, Clock, CheckCircle } from "lucide-react";
import { Booking, Client, Service, Staff, Business } from "../types";
import { getGeorgianDate } from "./Dashboard";

interface CalendarViewProps {
  selectedBusiness: Business;
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
  onOpenNewBookingWithDate: (date: string) => void;
  onEditBooking: (booking: Booking) => void;
}

export default function CalendarView({
  selectedBusiness,
  bookings,
  clients,
  services,
  staff,
  onOpenNewBookingWithDate,
  onEditBooking
}: CalendarViewProps) {
  // Let's set initial view to July 2026 (based on 2026-07-12)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July is index 6
  const [selectedDate, setSelectedDate] = useState("2026-07-12");
  const [viewType, setViewType] = useState<"day" | "week" | "month" | "year">("month");

  const monthNamesGe = [
    "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
    "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
  ];

  const weekdaysGe = ["ორ", "სმ", "ოთ", "ხთ", "პრ", "შბ", "კვ"];
  const fullWeekdaysGe = [
    "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"
  ];

  // Filter bookings for current business
  const businessBookings = bookings.filter(b => b.businessId === selectedBusiness.id);

  // Calculate grid layout
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Monday=1, etc.
  // Let's adjust so Monday is first in Georgian culture (0 = Mon, 6 = Sun)
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Format month index to string '01'-'12'
  const padZero = (n: number) => n.toString().padStart(2, "0");

  const handleDayClick = (day: number) => {
    const formattedDate = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(day)}`;
    setSelectedDate(formattedDate);
  };

  // Navigation handlers based on active view type
  const handlePrev = () => {
    if (viewType === "month") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(prev => prev - 1);
      } else {
        setCurrentMonth(prev => prev - 1);
      }
    } else if (viewType === "year") {
      setCurrentYear(prev => prev - 1);
    } else if (viewType === "day") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();
      setSelectedDate(`${y}-${padZero(m + 1)}-${padZero(dateNum)}`);
      setCurrentYear(y);
      setCurrentMonth(m);
    } else if (viewType === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();
      setSelectedDate(`${y}-${padZero(m + 1)}-${padZero(dateNum)}`);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  };

  const handleNext = () => {
    if (viewType === "month") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(prev => prev + 1);
      } else {
        setCurrentMonth(prev => prev + 1);
      }
    } else if (viewType === "year") {
      setCurrentYear(prev => prev + 1);
    } else if (viewType === "day") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();
      setSelectedDate(`${y}-${padZero(m + 1)}-${padZero(dateNum)}`);
      setCurrentYear(y);
      setCurrentMonth(m);
    } else if (viewType === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();
      setSelectedDate(`${y}-${padZero(m + 1)}-${padZero(dateNum)}`);
      setCurrentYear(y);
      setCurrentMonth(m);
    }
  };

  // Compute selected week dates (Monday to Sunday) containing selectedDate
  const getWeekDates = () => {
    const selectedJSDate = new Date(selectedDate);
    const dayOfWeek = selectedJSDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(selectedJSDate);
    mondayDate.setDate(selectedJSDate.getDate() + diffToMonday);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dateNum = d.getDate();
      return `${y}-${padZero(m)}-${padZero(dateNum)}`;
    });
  };

  const weekDays = getWeekDates();

  const getWeekRangeLabel = () => {
    if (weekDays.length < 7) return "";
    const start = weekDays[0];
    const end = weekDays[6];
    
    const startParts = start.split("-");
    const endParts = end.split("-");
    
    const startDay = parseInt(startParts[2]);
    const startMonth = monthNamesGe[parseInt(startParts[1]) - 1];
    
    const endDay = parseInt(endParts[2]);
    const endMonth = monthNamesGe[parseInt(endParts[1]) - 1];
    
    if (startParts[1] === endParts[1]) {
      return `${startDay} - ${endDay} ${startMonth} ${startParts[0]}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startParts[0]}`;
  };

  // Get bookings for selected date
  const selectedDateBookings = businessBookings.filter(b => b.date === selectedDate);

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "კლიენტი";
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "სერვისი";
  const getStaffName = (id: string) => staff.find(st => st.id === id)?.name || "სპეციალისტი";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Calendar Container with Multi-View support */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-fit">
        
        {/* Calendar Switcher and Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex flex-col text-left">
            <span className="text-base font-bold font-display text-slate-900 leading-none">
              {viewType === "month" && `${monthNamesGe[currentMonth]} ${currentYear}`}
              {viewType === "year" && `${currentYear} წელი`}
              {viewType === "day" && getGeorgianDate(selectedDate)}
              {viewType === "week" && `კვირის გეგმა`}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
              {viewType === "week" ? getWeekRangeLabel() : "ჯავშნების კალენდარი"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher segment */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
              {(["day", "week", "month", "year"] as const).map((view) => {
                const label = view === "day" ? "დღე" : view === "week" ? "კვირა" : view === "month" ? "თვე" : "წელი";
                const isActive = viewType === view;
                return (
                  <button
                    key={view}
                    onClick={() => setViewType(view)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      isActive 
                        ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/20 font-extrabold" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-200 cursor-pointer"
                title="უკან"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  setCurrentYear(2026);
                  setCurrentMonth(6);
                  setSelectedDate("2026-07-12");
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                დღეს
              </button>
              <button 
                onClick={handleNext}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-200 cursor-pointer"
                title="წინ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Render View Specific Grid or Lists */}
        {viewType === "month" && (
          <>
            {/* Days of the Week Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 mb-2 py-1.5 border-y border-slate-150">
              {weekdaysGe.map((day, idx) => (
                <div key={idx} className="uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty cells for shifting starting day */}
              {Array.from({ length: adjustedFirstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 rounded-lg animate-fade-in" />
              ))}

              {/* Days numbers */}
              {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const fullDateStr = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(dayNum)}`;
                const isSelected = selectedDate === fullDateStr;
                const isToday = fullDateStr === "2026-07-12";
                
                // Filter bookings count for this specific day
                const dayBookings = businessBookings.filter(b => b.date === fullDateStr);
                const hasBookings = dayBookings.length > 0;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => handleDayClick(dayNum)}
                    className={`aspect-square rounded-lg p-1 flex flex-col justify-between items-center transition-all duration-150 relative border ${
                      isSelected 
                        ? "bg-indigo-600 border-indigo-600 text-white font-bold scale-[1.02] shadow-xs" 
                        : isToday
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                        : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/40 text-slate-700 font-semibold"
                    }`}
                  >
                    {/* Day number */}
                    <span className="text-xs">{dayNum}</span>

                    {/* Booking indicator count / dot */}
                    {hasBookings && (
                      <div className="flex items-center gap-0.5 justify-center w-full">
                        {dayBookings.length > 1 ? (
                          <span className={`text-[9px] px-1 rounded font-bold ${
                            isSelected ? "bg-white text-indigo-900" : "bg-indigo-100 text-indigo-800"
                          }`}>
                            {dayBookings.length}
                          </span>
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-indigo-500"
                          }`} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewType === "day" && (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((slot) => {
              const slotBookings = businessBookings.filter(b => {
                if (b.date !== selectedDate) return false;
                const bHour = b.time.split(":")[0].padStart(2, "0");
                const slotHour = slot.split(":")[0];
                return bHour === slotHour;
              });

              return (
                <div key={slot} className="flex gap-4 items-start border-b border-slate-50 pb-3 last:border-0">
                  <div className="w-12 text-xs font-bold text-slate-400 font-mono mt-1 shrink-0">
                    {slot}
                  </div>
                  <div className="flex-1 space-y-2">
                    {slotBookings.length === 0 ? (
                      <button
                        onClick={() => onOpenNewBookingWithDate(selectedDate)}
                        className="w-full text-left py-2 px-3 border border-dashed border-slate-250 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/5 transition-all text-[11px] font-bold text-slate-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>თავისუფალია (დამატება {slot}-ზე)</span>
                      </button>
                    ) : (
                      slotBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => onEditBooking(b)}
                          className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-3 group text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-850 font-mono">{b.time}</span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                b.status === "დასრულებული"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : b.status === "გაუქმებული"
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-750 mt-1 truncate">
                              {getClientName(b.clientId)} — <span className="font-semibold text-slate-500">{getServiceName(b.serviceId)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                              სპეციალისტი: <span className="font-bold text-slate-550">{getStaffName(b.staffId)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-slate-800 block">{b.price}₾</span>
                            <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">რედაქტირება</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewType === "week" && (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {weekDays.map((dateStr, idx) => {
              const dayBookings = businessBookings.filter(b => b.date === dateStr);
              const dateParts = dateStr.split("-");
              const dayNum = parseInt(dateParts[2]);
              const monthGe = monthNamesGe[parseInt(dateParts[1]) - 1];
              const isSelected = selectedDate === dateStr;

              return (
                <div 
                  key={dateStr} 
                  className={`p-3.5 border rounded-xl transition-all ${
                    isSelected 
                      ? "bg-slate-50/80 border-indigo-200 ring-1 ring-indigo-100" 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <button
                      onClick={() => setSelectedDate(dateStr)}
                      className="flex items-center gap-1.5 text-left group cursor-pointer"
                    >
                      <span className={`text-xs font-bold ${isSelected ? "text-indigo-600 font-extrabold" : "text-slate-700 hover:text-indigo-600"}`}>
                        {fullWeekdaysGe[idx]}, {dayNum} {monthGe}
                      </span>
                      {dateStr === "2026-07-12" && (
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">დღეს</span>
                      )}
                    </button>
                    <button
                      onClick={() => onOpenNewBookingWithDate(dateStr)}
                      className="p-1 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded transition-colors"
                      title="ჯავშნის დამატება"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {dayBookings.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic py-1 pl-1 text-left">
                      არ არის ჯავშნები
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {dayBookings.map(b => (
                        <div
                          key={b.id}
                          onClick={() => onEditBooking(b)}
                          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-150 rounded-lg transition-all cursor-pointer flex justify-between items-center text-[10px] group shadow-2xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-800 font-mono">{b.time}</span>
                              <span className="text-[8px] text-slate-400 truncate">
                                {getStaffName(b.staffId).split(" ")[0]}
                              </span>
                            </div>
                            <div className="font-bold text-slate-700 truncate mt-0.5">
                              {getClientName(b.clientId)}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {getServiceName(b.serviceId)}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-1">
                            <span className="font-extrabold text-slate-800 block">{b.price}₾</span>
                            <span className={`inline-block text-[7px] font-bold px-1 rounded-sm mt-0.5 ${
                              b.status === "დასრულებული" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewType === "year" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {Array.from({ length: 12 }).map((_, mIdx) => {
              const daysInMonth = new Date(currentYear, mIdx + 1, 0).getDate();
              const fDay = new Date(currentYear, mIdx, 1).getDay();
              const adjFDay = fDay === 0 ? 6 : fDay - 1;

              return (
                <button
                  key={mIdx}
                  onClick={() => {
                    setCurrentMonth(mIdx);
                    setViewType("month");
                  }}
                  className={`p-2.5 bg-white border rounded-xl hover:border-indigo-400 hover:shadow-2xs transition-all text-left flex flex-col cursor-pointer group ${
                    currentMonth === mIdx ? "border-indigo-300 ring-1 ring-indigo-50/50" : "border-slate-100"
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-800 font-display group-hover:text-indigo-600 transition-colors">
                    {monthNamesGe[mIdx]}
                  </span>
                  
                  <div className="grid grid-cols-7 gap-0.5 mt-2 w-full text-[6px] text-slate-350 font-bold text-center select-none pointer-events-none">
                    {["ო", "ს", "ო", "ხ", "პ", "შ", "კ"].map((wd, i) => (
                      <div key={i} className="opacity-75">{wd}</div>
                    ))}
                    {Array.from({ length: adjFDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dNum = i + 1;
                      const formattedDate = `${currentYear}-${padZero(mIdx + 1)}-${padZero(dNum)}`;
                      const hasBookings = businessBookings.some(b => b.date === formattedDate);
                      const isToday = formattedDate === "2026-07-12";

                      return (
                        <div 
                          key={i} 
                          className={`aspect-square rounded-[1px] flex items-center justify-center font-bold ${
                            isToday 
                              ? "bg-indigo-600 text-white" 
                              : hasBookings 
                              ? "bg-indigo-100 text-indigo-700" 
                              : "text-slate-400"
                          }`}
                        >
                          {dNum}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Selected Date Bookings Detail Panel */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col min-h-[420px]">
        {/* Detail Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex flex-col text-left">
            <h3 className="font-bold text-slate-800 font-display text-xs truncate">
              {getGeorgianDate(selectedDate)}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold mt-0.5">
              არჩეული დღის ჯავშნები
            </span>
          </div>
          <button
            onClick={() => onOpenNewBookingWithDate(selectedDate)}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 rounded-lg transition-all font-bold flex items-center justify-center gap-1 text-[11px] border border-indigo-100"
            title="ჯავშნის დამატება ამ დღეს"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>დამატება</span>
          </button>
        </div>

        {/* Bookings List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {selectedDateBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">
                <CalendarDays className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-slate-400 text-[11px] font-semibold">
                ამ დღეს ჯავშნები არ ფიქსირდება
              </p>
              <button
                onClick={() => onOpenNewBookingWithDate(selectedDate)}
                className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
              >
                + ჯავშნის ჩაწერა
              </button>
            </div>
          ) : (
            selectedDateBookings.map((b) => (
              <div 
                key={b.id}
                onClick={() => onEditBooking(b)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition-all cursor-pointer flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800">{b.time}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    b.status === "დასრულებული"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : b.status === "გაუქმებული"
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {b.status}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{getClientName(b.clientId)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold pl-5">
                    {getServiceName(b.serviceId)} — <span className="font-bold text-slate-800">{b.price}₾</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5">
                    სპეციალისტი: <span className="text-slate-500 font-bold">{getStaffName(b.staffId)}</span>
                  </div>
                </div>

                {b.notes && (
                  <div className="text-[10px] italic text-slate-500 bg-white border border-slate-150 p-1.5 rounded leading-normal">
                    {b.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
