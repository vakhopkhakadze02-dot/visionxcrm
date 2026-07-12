/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BarChart3, 
  Download, 
  Upload, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Clock,
  User,
  Calendar,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Booking, Client, Service, Staff, Business } from "../types";

interface AnalyticsViewProps {
  selectedBusiness: Business;
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
  onImportData: (data: {
    bookings: Booking[];
    clients: Client[];
    services: Service[];
    staff: Staff[];
  }) => void;
}

export default function AnalyticsView({
  selectedBusiness,
  bookings,
  clients,
  services,
  staff,
  onImportData
}: AnalyticsViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedStaffIdForDetails, setSelectedStaffIdForDetails] = useState<string | null>(null);

  // Scoped to current business
  const businessBookings = bookings.filter(b => b.businessId === selectedBusiness.id);
  const completedBookings = businessBookings.filter(b => b.status === "დასრულებული");
  
  // Total metrics
  const totalBookingsCount = businessBookings.length;
  const completedCount = completedBookings.length;
  const canceledCount = businessBookings.filter(b => b.status === "გაუქმებული").length;

  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
  const avgBookingPrice = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  // Let's compute daily revenue over the last 7 days of July 2026 (July 6 to July 12)
  const last7Days = [
    { date: "2026-07-06", label: "06 ივლ", day: "ორშ" },
    { date: "2026-07-07", label: "07 ივლ", day: "სამ" },
    { date: "2026-07-08", label: "08 ივლ", day: "ოთხ" },
    { date: "2026-07-09", label: "09 ივლ", day: "ხუთ" },
    { date: "2026-07-10", label: "10 ივლ", day: "პარ" },
    { date: "2026-07-11", label: "11 ივლ", day: "შაბ" },
    { date: "2026-07-12", label: "12 ივლ", day: "კვი" }
  ];

  const dailyRevenueData = last7Days.map(day => {
    const dayCompleted = businessBookings.filter(b => b.date === day.date && b.status === "დასრულებული");
    const dayEarnings = dayCompleted.reduce((sum, b) => sum + b.price, 0);
    const dayCount = dayCompleted.length;
    return {
      ...day,
      earnings: dayEarnings,
      count: dayCount
    };
  });

  const maxEarnings = Math.max(...dailyRevenueData.map(d => d.earnings), 50); // prevent division by zero

  // Compute Service Popularity Share
  const categoryStats = services.map(s => {
    const serviceBookings = businessBookings.filter(b => b.serviceId === s.id);
    const count = serviceBookings.length;
    const revenue = serviceBookings.filter(b => b.status === "დასრულებული").reduce((sum, b) => sum + b.price, 0);
    return {
      name: s.name,
      category: s.category,
      count,
      revenue
    };
  }).filter(stat => stat.count > 0);

  const totalCategoryBookings = categoryStats.reduce((sum, s) => sum + s.count, 0);

  // Compute Employee Performance Rankings
  const staffStats = staff.map(st => {
    const staffBookings = businessBookings.filter(b => b.staffId === st.id);
    const staffCompleted = staffBookings.filter(b => b.status === "დასრულებული");
    const revenue = staffCompleted.reduce((sum, b) => sum + b.price, 0);
    return {
      id: st.id,
      name: st.name,
      role: st.role,
      bookingsCount: staffBookings.length,
      completedCount: staffCompleted.length,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // JSON Export CRM Backup
  const handleExportData = () => {
    const dbBackup = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      businessName: selectedBusiness.name,
      businessId: selectedBusiness.id,
      data: {
        bookings,
        clients,
        services,
        staff
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbBackup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `visionxcrm_backup_${selectedBusiness.name.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Drag & Drop / Click JSON Import
  const processImportFile = (file: File) => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setErrorMsg("გთხოვთ ატვირთოთ მხოლოდ .json ფორმატის ფაილი");
      setSuccessMsg("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json && json.data && json.data.bookings && json.data.clients && json.data.services && json.data.staff) {
          onImportData({
            bookings: json.data.bookings,
            clients: json.data.clients,
            services: json.data.services,
            staff: json.data.staff
          });
          setSuccessMsg("მონაცემები წარმატებით იქნა იმპორტირებული!");
          setErrorMsg("");
        } else {
          setErrorMsg("ფაილის სტრუქტურა არასწორია. გამოიყენეთ მხოლოდ VisionX CRM-ის ექსპორტირებული ფაილი.");
          setSuccessMsg("");
        }
      } catch (err) {
        setErrorMsg("ფაილის წაკითხვისას დაფიქსირდა შეცდომა.");
        setSuccessMsg("");
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImportFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-800 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-600" />
          ფინანსები და ანალიტიკა
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          აკონტროლეთ ბიზნესის ზრდა, გაყიდვები, სპეციალისტების ეფექტურობა და მართეთ მონაცემები
        </p>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ჯამური შემოსავალი
            </span>
            <span className="text-xl font-bold text-slate-800 block">
              {totalRevenue}₾
            </span>
          </div>
        </div>

        {/* Avg Ticket */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              საშუალო ჩეკი
            </span>
            <span className="text-xl font-bold text-slate-800 block">
              {avgBookingPrice}₾
            </span>
          </div>
        </div>

        {/* Completed Ratio */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              დასრულებული ჯავშნები
            </span>
            <span className="text-xl font-bold text-slate-800 block">
              {completedCount} / {totalBookingsCount}
            </span>
          </div>
        </div>

        {/* Canceled */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              გაუქმებული ჯავშნები
            </span>
            <span className="text-xl font-bold text-slate-800 block">
              {canceledCount}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue trend over last 7 days (Custom gorgeous HTML/CSS bars) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 font-display">
              ყოველდღიური შემოსავლის ტრენდი
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              ბოლო 7 დღის ფინანსური მონაცემები (₾)
            </p>
          </div>

          {/* Bar Grid */}
          <div className="h-56 mt-6 flex items-end justify-between gap-2.5 px-2 relative border-b border-slate-100 pb-2">
            {/* Background horizontal lines */}
            <div className="absolute inset-x-0 top-0 border-t border-slate-100/50 h-0 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/4 border-t border-slate-100/50 h-0 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-t border-slate-100/50 h-0 pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-t border-slate-100/50 h-0 pointer-events-none" />

            {dailyRevenueData.map((d, index) => {
              const barHeightPercent = Math.min(100, Math.max(5, (d.earnings / maxEarnings) * 100));
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative z-10">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md text-center pointer-events-none min-w-[70px]">
                    <span className="font-bold block">{d.earnings}₾</span>
                    <span className="text-[9px] text-slate-300 block font-normal">{d.count} ჯავშანი</span>
                  </div>

                  {/* Active Bar */}
                  <div 
                    style={{ height: `${barHeightPercent}%` }}
                    className="w-full max-w-[36px] bg-violet-600 hover:bg-violet-500 rounded-t-lg transition-all duration-300 shadow-sm relative overflow-hidden"
                  >
                    {/* Visual gradient gloss overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20" />
                  </div>

                  {/* Labels */}
                  <span className="text-[10px] font-bold text-slate-700 mt-2 block">
                    {d.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Popular Services Split progress bars */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800 font-display">
              მომსახურებების რეიტინგი
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              აქტიური ჯავშნების პროცენტული განაწილება
            </p>
          </div>

          <div className="space-y-4 mt-6 flex-1">
            {categoryStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                <p className="text-slate-400 text-xs font-semibold">მონაცემები არასაკმარისია</p>
              </div>
            ) : (
              categoryStats.slice(0, 4).map((stat, idx) => {
                const sharePercent = totalCategoryBookings > 0 
                  ? Math.round((stat.count / totalCategoryBookings) * 100) 
                  : 0;

                const progressColor = idx === 0 ? "bg-violet-500" : idx === 1 ? "bg-blue-500" : idx === 2 ? "bg-emerald-500" : "bg-amber-500";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 truncate max-w-[180px]">{stat.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{stat.count} ჯავშანი ({sharePercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${sharePercent}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Staff Performance & Ranks Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm font-display">
            სპეციალისტების ეფექტურობა
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            დააწკაპუნეთ სახელს დეტალების სანახავად
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/20">
                <th className="p-4">სახელი და გვარი</th>
                <th className="p-4">პოზიცია</th>
                <th className="p-4 text-center">ჯავშნები (სულ)</th>
                <th className="p-4 text-center">დასრულებული</th>
                <th className="p-4 text-right">გენერირებული შემოსავალი</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((st, idx) => (
                <tr key={st.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-[9px] text-slate-500 font-extrabold flex items-center justify-center border border-slate-200">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={() => setSelectedStaffIdForDetails(st.id)}
                      className="hover:text-indigo-600 font-bold transition-colors cursor-pointer text-left flex items-center gap-1.5 group decoration-indigo-200 hover:underline"
                    >
                      {st.name}
                      <span className="text-[9px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-all ml-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        დეტალები
                      </span>
                    </button>
                  </td>
                  <td className="p-4 text-slate-500 font-medium">{st.role}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{st.bookingsCount}</td>
                  <td className="p-4 text-center font-bold text-emerald-600">{st.completedCount}</td>
                  <td className="p-4 text-right font-extrabold text-slate-800">{st.revenue}₾</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialist Completed Jobs Modal */}
      <AnimatePresence>
        {selectedStaffIdForDetails && (() => {
          const selectedStaff = staff.find(s => s.id === selectedStaffIdForDetails);
          const staffStatsInfo = staffStats.find(s => s.id === selectedStaffIdForDetails);
          const staffJobs = businessBookings
            .filter(b => b.staffId === selectedStaffIdForDetails && b.status === "დასრულებული")
            .sort((a, b) => {
              const dateDiff = b.date.localeCompare(a.date);
              return dateDiff !== 0 ? dateDiff : b.time.localeCompare(a.time);
            });

          if (!selectedStaff) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStaffIdForDetails(null)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${selectedStaff.avatarColor || "bg-indigo-600 text-white"} flex items-center justify-center font-bold text-sm shadow-xs border border-white/25`}>
                      {selectedStaff.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm font-display leading-tight">
                        {selectedStaff.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold leading-none mt-0.5">
                        {selectedStaff.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStaffIdForDetails(null)}
                    className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Quick stats on the modal */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">სულ ჯავშნები</span>
                      <span className="text-base font-extrabold text-slate-800 block mt-0.5">{staffStatsInfo?.bookingsCount || 0}</span>
                    </div>
                    <div className="bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-600/80 font-bold uppercase tracking-wider block">დასრულებული (საქმეები)</span>
                      <span className="text-base font-extrabold text-emerald-600 block mt-0.5">{staffStatsInfo?.completedCount || 0}</span>
                    </div>
                    <div className="bg-indigo-50/20 border border-indigo-100/50 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-indigo-600/80 font-bold uppercase tracking-wider block">შემოსავალი</span>
                      <span className="text-base font-extrabold text-indigo-600 block mt-0.5">{staffStatsInfo?.revenue || 0}₾</span>
                    </div>
                  </div>

                  {/* List of Done Jobs */}
                  <div className="space-y-2.5">
                    <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      შესრულებული საქმეები ({staffJobs.length})
                    </h5>

                    {staffJobs.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5">
                        <CheckCircle className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-slate-400 text-xs font-semibold">დასრულებული საქმეები ჯერ არ ფიქსირდება</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                              <th className="p-3">კლიენტი</th>
                              <th className="p-3">მომსახურება</th>
                              <th className="p-3">თარიღი და დრო</th>
                              <th className="p-3 text-right">თანხა</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffJobs.map(job => (
                              <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                                <td className="p-3 font-semibold text-slate-700">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{clients.find(c => c.id === job.clientId)?.name || "კლიენტი"}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 font-medium">
                                  {services.find(s => s.id === job.serviceId)?.name || "სერვისი"}
                                </td>
                                <td className="p-3 text-slate-500 font-medium">
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      {job.date}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-0.5">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {job.time}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-extrabold text-slate-800">
                                  {job.price}₾
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button
                    onClick={() => setSelectedStaffIdForDetails(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    დახურვა
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Database Backup & Restore Module (მონაცემების მართვა) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-sm text-slate-800 font-display flex items-center gap-2">
            <FileSpreadsheet className="w-4.5 h-4.5 text-violet-600" />
            მონაცემების მართვა და რეზერვაცია (CRM Backups)
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            მოახდინეთ მთელი ბაზის ექსპორტი ან იმპორტი ლოკალური მენეჯმენტისთვის
          </p>
        </div>

        {/* Feedback lines */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Export Box */}
          <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">
                ბაზის ექსპორტი (Backup)
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                ჩამოტვირთეთ თქვენი ბიზნესის სრული მონაცემები (კლიენტები, სერვისები, თანამშრომლები და ჯავშნები) უსაფრთხო .json ფაილის სახით.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="w-full sm:w-auto self-start bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              CRM ბაზის ექსპორტი (.JSON)
            </button>
          </div>

          {/* Import Box */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`p-4 border-2 border-dashed rounded-2xl flex flex-col justify-between space-y-4 transition-all ${
              dragActive 
                ? "border-violet-400 bg-violet-50/30" 
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">
                ბაზის იმპორტი (Restore)
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                ატვირთეთ ადრე ექსპორტირებული .json ბაზის ფაილი მონაცემების აღსადგენად. გაფრთხილება: მიმდინარე მონაცემები ჩანაცვლდება.
              </p>
            </div>
            
            <div className="relative">
              <input
                type="file"
                id="import-file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="import-file"
                className="w-full sm:w-auto self-start bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <Upload className="w-4 h-4" />
                ფაილის არჩევა ან ჩაგდება
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
