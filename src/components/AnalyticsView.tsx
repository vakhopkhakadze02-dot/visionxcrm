/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  Download, 
  Upload, 
  TrendingUp, 
  DollarSign, 
  Euro, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  Clock,
  User,
  Calendar,
  Briefcase,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Booking, Client, Service, Staff, Business, formatPrice } from "../types";
import KPIDetailsModal from "./KPIDetailsModal";

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
  const [activeDetailTab, setActiveDetailTab] = useState<"revenue" | "avg_ticket" | "completed" | "canceled" | null>(null);
  const [detailSearchQuery, setDetailSearchQuery] = useState("");
  const [detailBookingFilter, setDetailBookingFilter] = useState<"all" | "დასრულებული" | "მოლოდინში">("all");
  const [selectedKPI, setSelectedKPI] = useState<"today_bookings" | "today_revenue" | "today_pending" | "total_revenue" | "cancelled_bookings" | "completed_bookings" | "total_bookings" | null>(null);

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

  // Compute Employee Bookings for Recharts Bar Chart, sorted by total bookings descending
  const staffBookingsChartData = staff.map(st => {
    const staffBookings = businessBookings.filter(b => b.staffId === st.id);
    const completed = staffBookings.filter(b => b.status === "დასრულებული").length;
    const pending = staffBookings.filter(b => b.status === "მოლოდინში").length;
    const canceled = staffBookings.filter(b => b.status === "გაუქმებული").length;
    return {
      name: st.name,
      "ჯამური ჯავშნები": staffBookings.length,
      "დასრულებული": completed,
      "მოლოდინში": pending,
      "გაუქმებული": canceled,
    };
  }).sort((a, b) => b["ჯამური ჯავშნები"] - a["ჯამური ჯავშნები"]);

  // Compute Daily Revenue over the last 30 days for Recharts Line Chart
  const dailyRevenue30Days = useMemo(() => {
    const referenceDate = new Date(); // Use current date (which is in 2026)
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(referenceDate.getDate() - i);
      const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const dayNum = d.getDate();
      const monthNames = ["იან", "ებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
      const monthLabel = monthNames[d.getMonth()];
      const label = `${dayNum} ${monthLabel}`;
      
      days.push({
        date: dateString,
        label: label
      });
    }

    return days.map(day => {
      const dayCompleted = businessBookings.filter(b => b.date === day.date && b.status === "დასრულებული");
      const dayEarnings = dayCompleted.reduce((sum, b) => sum + b.price, 0);
      const dayCount = dayCompleted.length;
      return {
        date: day.date,
        label: day.label,
        "შემოსავალი": dayEarnings,
        "ჯავშნები": dayCount
      };
    });
  }, [businessBookings]);

  // Filtered detail list of bookings based on active detail tab and search query
  const filteredDetailBookings = useMemo(() => {
    let list = [...businessBookings];
    if (activeDetailTab === "revenue") {
      list = list.filter(b => b.status === "დასრულებული");
    } else if (activeDetailTab === "canceled") {
      list = list.filter(b => b.status === "გაუქმებული");
    } else if (activeDetailTab === "completed") {
      if (detailBookingFilter !== "all") {
        list = list.filter(b => b.status === detailBookingFilter);
      }
    } else {
      return []; // Not applicable for average ticket
    }

    if (!detailSearchQuery.trim()) return list;

    const query = detailSearchQuery.toLowerCase();
    return list.filter(b => {
      const clientName = clients.find(c => c.id === b.clientId)?.name.toLowerCase() || "";
      const serviceName = services.find(s => s.id === b.serviceId)?.name.toLowerCase() || "";
      const staffName = staff.find(st => st.id === b.staffId)?.name.toLowerCase() || "";
      return clientName.includes(query) || serviceName.includes(query) || staffName.includes(query);
    });
  }, [businessBookings, activeDetailTab, detailBookingFilter, detailSearchQuery, clients, services, staff]);

  // Services with their average check pricing
  const serviceAverages = useMemo(() => {
    if (activeDetailTab !== "avg_ticket") return [];
    return services.map(s => {
      const sBookings = completedBookings.filter(b => b.serviceId === s.id);
      const sTotal = sBookings.reduce((sum, b) => sum + b.price, 0);
      const sAvg = sBookings.length > 0 ? Math.round(sTotal / sBookings.length) : 0;
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        count: sBookings.length,
        avgPrice: sAvg
      };
    }).filter(item => item.count > 0).sort((a, b) => b.avgPrice - a.avgPrice);
  }, [services, completedBookings, activeDetailTab]);

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

  // CSV Export for Clients (Customers)
  const handleExportClientsCSV = () => {
    const currencySign = selectedBusiness.currency === "USD" ? "$" : selectedBusiness.currency === "EUR" ? "€" : "₾";
    const headers = ["სახელი", "ტელეფონი", "ელ-ფოსტა", "ჯავშნების რაოდენობა", `ჯამური დანახარჯი (${currencySign})`, "შენიშვნა"];
    const rows = clients.map(c => [
      c.name,
      c.phone,
      c.email || "",
      c.totalBookings,
      c.totalSpent,
      c.notes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `visionx_clients_${selectedBusiness.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg("კლიენტების სია წარმატებით იქნა ექსპორტირებული CSV ფაილში!");
    setErrorMsg("");
  };

  // CSV Export for Bookings
  const handleExportBookingsCSV = () => {
    const businessBookings = bookings.filter(b => b.businessId === selectedBusiness.id);
    const currencySign = selectedBusiness.currency === "USD" ? "$" : selectedBusiness.currency === "EUR" ? "€" : "₾";
    const headers = ["ჯავშნის ID", "კლიენტის სახელი", "სერვისი", "თანამშრომელი", "თარიღი", "დრო", `ფასი (${currencySign})`, "სტატუსი", "შენიშვნა"];
    
    const rows = businessBookings.map(b => {
      const clientName = clients.find(c => c.id === b.clientId)?.name || "უცნობი კლიენტი";
      const serviceName = services.find(s => s.id === b.serviceId)?.name || "უცნობი სერვისი";
      const staffName = staff.find(st => st.id === b.staffId)?.name || "უცნობი თანამშრომელი";
      return [
        b.id,
        clientName,
        serviceName,
        staffName,
        b.date,
        b.time,
        b.price,
        b.status,
        b.notes || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `visionx_bookings_${selectedBusiness.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg("ჯავშნების სია წარმატებით იქნა ექსპორტირებული CSV ფაილში!");
    setErrorMsg("");
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <button
          onClick={() => {
            setSelectedKPI("total_revenue");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left w-full cursor-pointer group"
          id="analytics-card-total-revenue"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
            {selectedBusiness.currency === "USD" ? (
              <DollarSign className="w-5 h-5" />
            ) : selectedBusiness.currency === "EUR" ? (
              <Euro className="w-5 h-5" />
            ) : (
              <span className="text-base font-black select-none leading-none">₾</span>
            )}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">
              ჯამური შემოსავალი
            </span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">
              {formatPrice(totalRevenue, selectedBusiness.currency)}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* Avg Ticket */}
        <button
          onClick={() => {
            setSelectedKPI("completed_bookings");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left w-full cursor-pointer group"
          id="analytics-card-avg-ticket"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-900/30 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">
              საშუალო ჩეკი
            </span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">
              {formatPrice(avgBookingPrice, selectedBusiness.currency)}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* Completed Ratio */}
        <button
          onClick={() => {
            setSelectedKPI("completed_bookings");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left w-full cursor-pointer group"
          id="analytics-card-completed-bookings"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">
              დასრულებული ჯავშნები
            </span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">
              {completedCount} / {totalBookingsCount}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* Canceled */}
        <button
          onClick={() => {
            setSelectedKPI("cancelled_bookings");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] hover:border-rose-300 dark:hover:border-rose-700 transition-all text-left w-full cursor-pointer group"
          id="analytics-card-cancelled-bookings"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">
              გაუქმებული ჯავშნები
            </span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">
              {canceledCount}
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue trend over last 7 days (Custom gorgeous HTML/CSS bars) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="font-bold text-sm text-slate-800 font-display">
              ყოველდღიური შემოსავლის ტრენდი
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              ბოლო 7 დღის ფინანსური მონაცემები ({selectedBusiness.currency === "USD" ? "$" : selectedBusiness.currency === "EUR" ? "€" : "₾"})
            </p>
          </div>

          {/* Scrollable Container for Narrow Viewports */}
          <div className="w-full overflow-x-auto scrollbar-thin mt-6">
            {/* Bar Grid with min-width to prevent squeezing */}
            <div className="h-56 min-w-[450px] flex items-end justify-between gap-2.5 px-2 relative border-b border-slate-100 pb-2">
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
                      <span className="font-bold block">{formatPrice(d.earnings, selectedBusiness.currency)}</span>
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

      {/* Recharts Line Chart: 30-Day Daily Revenue Trends */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            შემოსავლების დინამიკა (ბოლო 30 დღე)
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            ყოველდღიური შემოსავლის ტრენდი და დასრულებული ჯავშნების რაოდენობა ბოლო 30 დღის განმავლობაში
          </p>
        </div>

        {dailyRevenue30Days.length === 0 || dailyRevenue30Days.every(d => d["შემოსავალი"] === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">მონაცემები არასაკმარისია</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ბოლო 30 დღის განმავლობაში დასრულებული ჯავშნები არ ფიქსირდება.</p>
          </div>
        ) : (
          <div className="h-80 w-full mt-4 text-[11px] font-medium font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyRevenue30Days}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="label" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const revenue = payload.find(p => p.name === "შემოსავალი")?.value;
                      const count = payload.find(p => p.name === "ჯავშნები")?.value;
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5 backdrop-blur-xs">
                          <p className="font-bold font-display text-[11px] border-b border-slate-800 pb-1 mb-1">{label}</p>
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-slate-400">შემოსავალი:</span>
                            </div>
                            <span className="font-mono font-bold text-slate-200">{formatPrice(Number(revenue), selectedBusiness.currency)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="text-slate-400">ჯავშნები:</span>
                            </div>
                            <span className="font-mono font-bold text-slate-200">{count}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                />
                <Line 
                  type="monotone"
                  dataKey="შემოსავალი" 
                  name="შემოსავალი"
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 2, strokeWidth: 1 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone"
                  dataKey="ჯავშნები" 
                  name="ჯავშნები"
                  stroke="#6366f1" 
                  strokeWidth={1.5}
                  dot={{ r: 1 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recharts Bar Chart: Bookings per Staff Member */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-colors">
        <div className="mb-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-display flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            აქტივობა სპეციალისტების მიხედვით
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
            ჯავშნების განაწილება სპეციალისტების მიხედვით (ჯამური, დასრულებული და გაუქმებული)
          </p>
        </div>

        {staffBookingsChartData.length === 0 || staffBookingsChartData.every(d => d["ჯამური ჯავშნები"] === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <User className="w-6 h-6" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">მონაცემები არასაკმარისია</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ჯავშნები ჯერ არ არის დარეგისტრირებული.</p>
          </div>
        ) : (
          <div className="h-80 w-full mt-4 text-[11px] font-medium font-sans">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={staffBookingsChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1.5 backdrop-blur-xs">
                          <p className="font-bold font-display text-[11px] border-b border-slate-800 pb-1 mb-1">{label}</p>
                          {payload.map((pld: any) => (
                            <div key={pld.name} className="flex items-center justify-between gap-6">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.fill }} />
                                <span className="text-slate-400">{pld.name}:</span>
                              </div>
                              <span className="font-mono font-bold text-slate-200">{pld.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                />
                <Bar 
                  dataKey="ჯამური ჯავშნები" 
                  name="ჯამური ჯავშნები"
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="დასრულებული" 
                  name="დასრულებული"
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="გაუქმებული" 
                  name="გაუქმებული"
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        )}
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
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
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
                  <td className="p-4 text-right font-extrabold text-slate-800">{formatPrice(st.revenue, selectedBusiness.currency)}</td>
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
                      <span className="text-base font-extrabold text-indigo-600 block mt-0.5">{formatPrice(staffStatsInfo?.revenue || 0, selectedBusiness.currency)}</span>
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
                                  {formatPrice(job.price, selectedBusiness.currency)}
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

      {/* Metrics Detail Modal */}
      <AnimatePresence>
        {activeDetailTab && (() => {
          let modalTitle = "";
          let themeColor = "indigo";
          
          if (activeDetailTab === "revenue") {
            modalTitle = "შემოსავლების დეტალური ანგარიში";
            themeColor = "emerald";
          } else if (activeDetailTab === "avg_ticket") {
            modalTitle = "საშუალო ჩეკის ანალიტიკა";
            themeColor = "violet";
          } else if (activeDetailTab === "completed") {
            modalTitle = "დასრულებული ჯავშნების რეესტრი";
            themeColor = "blue";
          } else if (activeDetailTab === "canceled") {
            modalTitle = "გაუქმებული ჯავშნების ანალიზი";
            themeColor = "rose";
          }

          const highestPrice = completedBookings.length > 0 ? Math.max(...completedBookings.map(b => b.price)) : 0;
          const lowestPrice = completedBookings.length > 0 ? Math.min(...completedBookings.map(b => b.price)) : 0;
          const lostRevenue = businessBookings.filter(b => b.status === "გაუქმებული").reduce((sum, b) => sum + b.price, 0);
          const cancellationRate = totalBookingsCount > 0 ? Math.round((canceledCount / totalBookingsCount) * 100) : 0;
          const completionRate = totalBookingsCount > 0 ? Math.round((completedCount / totalBookingsCount) * 100) : 0;
          const pendingCount = businessBookings.filter(b => b.status === "მოლოდინში").length;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop with Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveDetailTab(null)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[85vh] transition-colors font-sans"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs border ${
                      themeColor === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                      themeColor === "violet" ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30" :
                      themeColor === "blue" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30" :
                      "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                    }`}>
                      {activeDetailTab === "revenue" && (
                        selectedBusiness.currency === "USD" ? (
                          <DollarSign className="w-5 h-5" />
                        ) : selectedBusiness.currency === "EUR" ? (
                          <Euro className="w-5 h-5" />
                        ) : (
                          <span className="text-base font-black select-none leading-none">₾</span>
                        )
                      )}
                      {activeDetailTab === "avg_ticket" && <TrendingUp className="w-5 h-5" />}
                      {activeDetailTab === "completed" && <CheckCircle className="w-5 h-5" />}
                      {activeDetailTab === "canceled" && <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display leading-tight">
                        {modalTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
                        {selectedBusiness.name} • დეტალური მონაცემები
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveDetailTab(null)}
                    className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Highlights Mini Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {activeDetailTab === "revenue" && (
                      <>
                        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">ჯამური შემოსავალი</span>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1.5">{formatPrice(totalRevenue, selectedBusiness.currency)}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">ჯავშნები (სულ)</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">{completedCount}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">უდიდესი ჯავშანი</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">{formatPrice(highestPrice, selectedBusiness.currency)}</span>
                        </div>
                      </>
                    )}

                    {activeDetailTab === "avg_ticket" && (
                      <>
                        <div className="bg-violet-50/20 dark:bg-violet-950/10 border border-violet-100/50 dark:border-violet-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">საშუალო ჩეკი</span>
                          <span className="text-base font-extrabold text-violet-600 dark:text-violet-400 block mt-1.5">{formatPrice(avgBookingPrice, selectedBusiness.currency)}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">დასრულებული ჯავშნები</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">{completedCount}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">უდიდესი / უმცირესი</span>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block mt-2">{formatPrice(highestPrice, selectedBusiness.currency)} / {formatPrice(lowestPrice, selectedBusiness.currency)}</span>
                        </div>
                      </>
                    )}

                    {activeDetailTab === "completed" && (
                      <>
                        <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">სულ რეგისტრირებული</span>
                          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 block mt-1.5">{totalBookingsCount}</span>
                        </div>
                        <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">დასრულებული</span>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1.5">{completedCount} ({completionRate}%)</span>
                        </div>
                        <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">მოლოდინში</span>
                          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 block mt-1.5">{pendingCount}</span>
                        </div>
                      </>
                    )}

                    {activeDetailTab === "canceled" && (
                      <>
                        <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">გაუქმებული ჯავშნები</span>
                          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 block mt-1.5">{canceledCount}</span>
                        </div>
                        <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">გაცდენილი შემოსავალი</span>
                          <span className="text-base font-extrabold text-rose-700 dark:text-rose-400 block mt-1.5">{formatPrice(lostRevenue, selectedBusiness.currency)}</span>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block leading-none">გაუქმების კოეფიციენტი</span>
                          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 block mt-1.5">{cancellationRate}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Specific content depending on active tab */}
                  {activeDetailTab === "avg_ticket" ? (
                    /* Average ticket shows service by service pricing details */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider leading-none">
                          მომსახურებების საშუალო ღირებულება
                        </h5>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">სულ {serviceAverages.length} აქტიური მომსახურება</span>
                      </div>
                      
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto scrollbar-thin">
                          <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                                <th className="p-3">მომსახურების დასახელება</th>
                                <th className="p-3 text-center">შესრულებული რაოდენობა</th>
                                <th className="p-3 text-right">საშუალო ჩეკი</th>
                                <th className="p-3 text-right">შედარება ჯამურთან ({formatPrice(avgBookingPrice, selectedBusiness.currency)})</th>
                              </tr>
                            </thead>
                            <tbody>
                              {serviceAverages.map(s => {
                                const diff = s.avgPrice - avgBookingPrice;
                                return (
                                  <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{s.category}</div>
                                    </td>
                                    <td className="p-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                                      {s.count}
                                    </td>
                                    <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                                      {formatPrice(s.avgPrice, selectedBusiness.currency)}
                                    </td>
                                    <td className="p-3 text-right font-bold">
                                      {diff === 0 ? (
                                        <span className="text-slate-400 dark:text-slate-500 font-medium">ზუსტი საშუალო</span>
                                      ) : diff > 0 ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5 font-mono">
                                          +{formatPrice(diff, selectedBusiness.currency)} ▲
                                        </span>
                                      ) : (
                                        <span className="text-rose-600 dark:text-rose-400 flex items-center justify-end gap-0.5 font-mono">
                                          {formatPrice(diff, selectedBusiness.currency)} ▼
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Other tabs show booking list with search and filters */
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5 leading-none">
                          <span>ჯავშნების სია ({filteredDetailBookings.length})</span>
                        </h5>

                        {/* Search and completed filter tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                          {activeDetailTab === "completed" && (
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => setDetailBookingFilter("all")}
                                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${detailBookingFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                ყველა
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailBookingFilter("დასრულებული")}
                                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${detailBookingFilter === "დასრულებული" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                დასრულებული
                              </button>
                              <button
                                type="button"
                                onClick={() => setDetailBookingFilter("მოლოდინში")}
                                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${detailBookingFilter === "მოლოდინში" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                მოლოდინში
                              </button>
                            </div>
                          )}

                          {/* Quick Search */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              placeholder="ძებნა (კლიენტი, მომსახურება...)"
                              value={detailSearchQuery}
                              onChange={(e) => setDetailSearchQuery(e.target.value)}
                              className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 min-w-[200px]"
                            />
                          </div>
                        </div>
                      </div>

                      {filteredDetailBookings.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                          <CheckCircle className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">მონაცემები არასაკმარისია ან ძიებამ შედეგი ვერ გამოიღო</p>
                        </div>
                      ) : (
                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">კლიენტი</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">მომსახურება</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">სპეციალისტი</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">თარიღი და დრო</th>
                                {activeDetailTab === "canceled" && <th className="p-3 bg-slate-50 dark:bg-slate-950">გაუქმების მიზეზი</th>}
                                <th className="p-3 text-right bg-slate-50 dark:bg-slate-950">თანხა</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDetailBookings.map(job => (
                                <tr key={job.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                                    <div className="flex items-center gap-1.5">
                                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{clients.find(c => c.id === job.clientId)?.name || "კლიენტი"}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                                    {services.find(s => s.id === job.serviceId)?.name || "სერვისი"}
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                                    {staff.find(st => st.id === job.staffId)?.name || "თანამშრომელი"}
                                  </td>
                                  <td className="p-3 text-slate-500 dark:text-slate-400 font-medium">
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
                                  {activeDetailTab === "canceled" && (
                                    <td className="p-3 text-slate-500 dark:text-slate-400 italic max-w-[150px] truncate">
                                      {job.notes || "მიზეზი მითითებული არ არის"}
                                    </td>
                                  )}
                                  <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                                    {formatPrice(job.price, selectedBusiness.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveDetailTab(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
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
                მონაცემების ექსპორტი (Export)
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                ჩამოტვირთეთ თქვენი ბიზნესის მონაცემები სხვადასხვა ფორმატში ლოკალური მენეჯმენტისთვის ან გარე დამუშავებისთვის.
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleExportData}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                სრული ბაზის ექსპორტი (.JSON)
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportClientsCSV}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  კლიენტები (.CSV)
                </button>
                <button
                  onClick={handleExportBookingsCSV}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  ჯავშნები (.CSV)
                </button>
              </div>
            </div>
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

      <KPIDetailsModal
        isOpen={selectedKPI !== null}
        onClose={() => setSelectedKPI(null)}
        selectedBusiness={selectedBusiness}
        kpiType={selectedKPI}
        bookings={bookings}
        clients={clients}
        services={services}
        staff={staff}
      />
    </div>
  );
}
