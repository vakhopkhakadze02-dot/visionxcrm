/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  DollarSign, 
  Euro,
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  Filter, 
  ArrowUpDown, 
  SlidersHorizontal,
  ChevronDown,
  Percent,
  CheckCircle2,
  Phone,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Booking, Client, Service, Staff, Business, formatPrice } from "../types";

interface KPIDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBusiness: Business;
  kpiType: "today_bookings" | "today_revenue" | "today_pending" | "total_revenue" | "cancelled_bookings" | "completed_bookings" | "total_bookings" | null;
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
}

export default function KPIDetailsModal({
  isOpen,
  onClose,
  selectedBusiness,
  kpiType,
  bookings,
  clients,
  services,
  staff
}: KPIDetailsModalProps) {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "price_desc" | "price_asc" | "time">("date_desc");

  // Filtered list of business-specific bookings
  const businessBookings = useMemo(() => {
    return bookings.filter(b => b.businessId === selectedBusiness.id);
  }, [bookings, selectedBusiness.id]);

  const todayStr = "2026-07-12"; // System constant date for 'today'

  // Determine the base bookings to display based on KPI type
  const baseBookings = useMemo(() => {
    switch (kpiType) {
      case "today_bookings":
        return businessBookings.filter(b => b.date === todayStr);
      case "today_revenue":
        // Today's non-cancelled bookings contributing to revenue
        return businessBookings.filter(b => b.date === todayStr && b.status !== "გაუქმებული");
      case "today_pending":
        return businessBookings.filter(b => b.date === todayStr && b.status === "მოლოდინში");
      case "total_bookings":
        return businessBookings;
      case "total_revenue":
        // Bookings that are completed and have revenue
        return businessBookings.filter(b => b.status === "დასრულებული");
      case "completed_bookings":
        return businessBookings.filter(b => b.status === "დასრულებული");
      case "cancelled_bookings":
        return businessBookings.filter(b => b.status === "გაუქმებული");
      default:
        return businessBookings;
    }
  }, [businessBookings, kpiType, todayStr]);

  // Resolvers for names
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || "უცნობი კლიენტი";
  const getClientPhone = (id: string) => clients.find(c => c.id === id)?.phone || "უცნობია";
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "სერვისი";
  const getStaffName = (id: string) => staff.find(s => s.id === id)?.name || "სპეციალისტი";

  // Filter & sort base bookings
  const filteredBookings = useMemo(() => {
    let result = [...baseBookings];

    // Status filter (unless kpiType locks status)
    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }

    // Price range filter
    if (priceRangeFilter !== "all") {
      if (priceRangeFilter === "under_30") {
        result = result.filter(b => b.price < 30);
      } else if (priceRangeFilter === "30_100") {
        result = result.filter(b => b.price >= 30 && b.price <= 100);
      } else if (priceRangeFilter === "over_100") {
        result = result.filter(b => b.price > 100);
      }
    }

    // Staff filter
    if (staffFilter !== "all") {
      result = result.filter(b => b.staffId === staffFilter);
    }

    // Text search query (client, staff, service)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => {
        const clientName = getClientName(b.clientId).toLowerCase();
        const clientPhone = getClientPhone(b.clientId).toLowerCase();
        const serviceName = getServiceName(b.serviceId).toLowerCase();
        const staffName = getStaffName(b.staffId).toLowerCase();
        return (
          clientName.includes(query) ||
          clientPhone.includes(query) ||
          serviceName.includes(query) ||
          staffName.includes(query)
        );
      });
    }

    // Sort options
    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "date_asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "price_desc") {
        return b.price - a.price;
      } else if (sortBy === "price_asc") {
        return a.price - b.price;
      } else if (sortBy === "time") {
        return a.time.localeCompare(b.time);
      }
      return 0;
    });

    return result;
  }, [baseBookings, statusFilter, priceRangeFilter, staffFilter, searchQuery, sortBy, clients, services, staff]);

  // Modal visual metadata depending on KPI Type
  const kpiMeta = useMemo(() => {
    switch (kpiType) {
      case "today_bookings":
        return {
          title: "დღევანდელი ჯავშნების რეესტრი",
          subtitle: "დეტალური დღევანდელი ჯავშნები, დრო და სტატუსები",
          color: "indigo",
          icon: <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        };
      case "today_revenue":
        return {
          title: "დღევანდელი შემოსავლების ანალიზი",
          subtitle: "დღევანდელი გაყიდვები, მომსახურებები და შესრულებული ჩეკები",
          color: "emerald",
          icon: selectedBusiness.currency === "USD" ? (
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : selectedBusiness.currency === "EUR" ? (
            <Euro className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 leading-none select-none w-5 h-5 flex items-center justify-center">₾</span>
          )
        };
      case "today_pending":
        return {
          title: "დღევანდელი მოლოდინში მყოფი ჯავშნები",
          subtitle: "მომავალი დღევანდელი შეხვედრები, რომლებიც ელოდებიან დადასტურებას",
          color: "amber",
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        };
      case "total_bookings":
        return {
          title: "ჯავშნების სრული არქივი",
          subtitle: "ყველა დროის ჩაწერილი ჯავშნები, ფილტრები და ძიება",
          color: "indigo",
          icon: <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        };
      case "total_revenue":
        return {
          title: "ჯამური შემოსავლების ანალიტიკა",
          subtitle: "წარმატებით დასრულებული მომსახურებებიდან მიღებული თანხები",
          color: "emerald",
          icon: selectedBusiness.currency === "USD" ? (
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : selectedBusiness.currency === "EUR" ? (
            <Euro className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 leading-none select-none w-5 h-5 flex items-center justify-center">₾</span>
          )
        };
      case "completed_bookings":
        return {
          title: "დასრულებული მომსახურებების რეესტრი",
          subtitle: "წარმატებით გაწეული სერვისები და შესაბამისი ჩეკები",
          color: "teal",
          icon: <CheckCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        };
      case "cancelled_bookings":
        return {
          title: "გაუქმებული ჯავშნების ანალიზი",
          subtitle: "მომხმარებლების ან სპეციალისტების მიერ უარყოფილი ვიზიტები",
          color: "rose",
          icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        };
      default:
        return {
          title: "ანალიტიკური მონაცემები",
          subtitle: "დეტალური ფილტრაცია და რეესტრის ძიება",
          color: "indigo",
          icon: <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        };
    }
  }, [kpiType]);

  // Mini Statistics Calculations
  const statsSummary = useMemo(() => {
    const totalCount = filteredBookings.length;
    const totalSum = filteredBookings.reduce((sum, b) => sum + b.price, 0);
    const avgSum = totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
    
    // Status percentage distribution
    const completedVal = filteredBookings.filter(b => b.status === "დასრულებული").length;
    const pendingVal = filteredBookings.filter(b => b.status === "მოლოდინში").length;
    const cancelledVal = filteredBookings.filter(b => b.status === "გაუქმებული").length;

    const completedPct = totalCount > 0 ? Math.round((completedVal / totalCount) * 100) : 0;
    const pendingPct = totalCount > 0 ? Math.round((pendingVal / totalCount) * 100) : 0;
    const cancelledPct = totalCount > 0 ? Math.round((cancelledVal / totalCount) * 100) : 0;

    return {
      totalCount,
      totalSum,
      avgSum,
      completedVal,
      pendingVal,
      cancelledVal,
      completedPct,
      pendingPct,
      cancelledPct
    };
  }, [filteredBookings]);

  if (!isOpen || !kpiType) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Ambient Blur Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-4xl overflow-hidden relative z-10 flex flex-col max-h-[85vh] transition-colors duration-200"
          id="kpi-details-modal"
        >
          {/* Top Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800`}>
                {kpiMeta.icon}
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base leading-tight">
                  {kpiMeta.title}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
                  {kpiMeta.subtitle} • {selectedBusiness.name}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
              id="kpi-modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Filtering and Controls Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
            
            {/* Search Input */}
            <div className="relative md:col-span-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ძიება: კლიენტი, სპეციალისტი, სერვისი..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter 1: Status (Visible conditionally) */}
            <div className="relative md:col-span-2">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">სტატუსი</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={kpiType === "today_pending" || kpiType === "total_revenue" || kpiType === "completed_bookings" || kpiType === "cancelled_bookings"}
                className="w-full pl-[76px] pr-2 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="all">ყველა</option>
                <option value="დასრულებული">დასრულებული</option>
                <option value="მოლოდინში">მოლოდინში</option>
                <option value="გაუქმებული">გაუქმებული</option>
              </select>
            </div>

            {/* Filter 2: Price range */}
            <div className="relative md:col-span-2">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {selectedBusiness.currency === "USD" ? (
                  <DollarSign className="w-3.5 h-3.5" />
                ) : selectedBusiness.currency === "EUR" ? (
                  <Euro className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-bold leading-none select-none w-3.5 h-3.5 flex items-center justify-center">₾</span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider">ფასი</span>
              </div>
              <select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value)}
                className="w-full pl-[56px] pr-2 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                <option value="all">ყველა</option>
                <option value="under_30">
                  {selectedBusiness.currency === "USD" ? "$30-მდე" : selectedBusiness.currency === "EUR" ? "€30-მდე" : "30₾-მდე"}
                </option>
                <option value="30_100">
                  {selectedBusiness.currency === "USD" ? "$30 - $100" : selectedBusiness.currency === "EUR" ? "€30 - €100" : "30₾ - 100₾"}
                </option>
                <option value="over_100">
                  {selectedBusiness.currency === "USD" ? "$100+" : selectedBusiness.currency === "EUR" ? "€100+" : "100₾+"}
                </option>
              </select>
            </div>

            {/* Filter 3: Specialist */}
            <div className="relative md:col-span-2">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">სპეც.</span>
              </div>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full pl-[60px] pr-2 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                <option value="all">ყველა</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="relative md:col-span-2">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">სორტ.</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-[62px] pr-2 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                <option value="date_desc">უახლესი თარიღით</option>
                <option value="date_asc">ძველი თარიღით</option>
                <option value="price_desc">ფასი: კლებადობით</option>
                <option value="price_asc">ფასი: ზრდადობით</option>
                <option value="time">საათით</option>
              </select>
            </div>

          </div>

          {/* Main Body Layout */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30 dark:bg-slate-900/40">
            
            {/* Stats Summary Panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Stat 1: Total volume */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                  ჯამური რაოდენობა
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block leading-none">
                  {statsSummary.totalCount}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold mt-2.5 block">
                  ჩაწერილი რეესტრი
                </span>
              </div>

              {/* Stat 2: Total Revenue/Value */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                  ჯამური ღირებულება
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2 block leading-none">
                  {formatPrice(statsSummary.totalSum, selectedBusiness.currency)}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold mt-2.5 block">
                  თანხა რეესტრში
                </span>
              </div>

              {/* Stat 3: Avg Ticket */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                  საშუალო ჩეკი
                </span>
                <span className="text-xl md:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 block leading-none">
                  {formatPrice(statsSummary.avgSum, selectedBusiness.currency)}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold mt-2.5 block">
                  საშუალო მაჩვენებელი
                </span>
              </div>

              {/* Stat 4: Completion Rate */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-xl shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">
                  დასრულების კოეფიციენტი
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                    {statsSummary.completedPct}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">({statsSummary.completedVal})</span>
                </div>
                {/* Visual completion progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    style={{ width: `${statsSummary.completedPct}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>

            </div>

            {/* List of Bookings Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
              
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ჯავშნები ({filteredBookings.length})
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  ნაჩვენებია გაფილტრული სია
                </span>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <SlidersHorizontal className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      ჯავშნები ვერ მოიძებნა
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      შეცვალეთ ფილტრის პარამეტრები ან საძიებო სიტყვა შესაბამისი ჩანაწერების საპოვნელად
                    </p>
                  </div>
                  {(searchQuery || statusFilter !== "all" || priceRangeFilter !== "all" || staffFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setPriceRangeFilter("all");
                        setStaffFilter("all");
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                    >
                      ფილტრების გასუფთავება
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3">კლიენტი / კონტაქტი</th>
                        <th className="p-3">სერვისი</th>
                        <th className="p-3">სპეციალისტი</th>
                        <th className="p-3">თარიღი და დრო</th>
                        <th className="p-3 text-center">სტატუსი</th>
                        <th className="p-3 text-right">ფასი</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr 
                          key={b.id} 
                          className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors"
                        >
                          {/* Client column */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                {getClientName(b.clientId).charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100">
                                  {getClientName(b.clientId)}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5 font-mono">
                                  <Phone className="w-2.5 h-2.5" />
                                  {getClientPhone(b.clientId)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Service column */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {getServiceName(b.serviceId)}
                              </span>
                            </div>
                          </td>

                          {/* Specialist column */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-600 dark:text-slate-400">
                                {getStaffName(b.staffId)}
                              </span>
                            </div>
                          </td>

                          {/* Date and time column */}
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {b.date === todayStr ? "დღეს" : b.date}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1 mt-0.5 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {b.time}
                              </span>
                            </div>
                          </td>

                          {/* Status column */}
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
                              b.status === "დასრულებული"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                                : b.status === "გაუქმებული"
                                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/40"
                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
                            }`}>
                              {b.status}
                            </span>
                          </td>

                          {/* Price column */}
                          <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100 font-mono text-xs md:text-sm">
                            {formatPrice(b.price, selectedBusiness.currency)}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>

          {/* Footer controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              დახურვა
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
