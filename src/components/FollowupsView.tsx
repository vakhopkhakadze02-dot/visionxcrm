/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Trash2, 
  User, 
  AlertCircle, 
  Edit2, 
  ChevronRight,
  PhoneCall,
  Notebook,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Followup, Client } from "../types";
import ConfirmModal from "./ConfirmModal";

interface FollowupsViewProps {
  followups: Followup[];
  clients: Client[];
  onAddFollowup: (followup: Omit<Followup, "id" | "businessId">) => void;
  onUpdateFollowupStatus: (id: string, status: Followup["status"]) => void;
  onDeleteFollowup: (id: string) => void;
  onEditFollowup: (followup: Followup) => void;
}

export default function FollowupsView({
  followups,
  clients,
  onAddFollowup,
  onUpdateFollowupStatus,
  onDeleteFollowup,
  onEditFollowup
}: FollowupsViewProps) {
  // Local states
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [followupToDelete, setFollowupToDelete] = useState<Followup | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>("manual");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("12:00");
  const [type, setType] = useState<"call" | "message">("call");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  // Edit states
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editType, setEditType] = useState<"call" | "message">("call");
  const [editTopic, setEditTopic] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Date constants
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  // Handle client selection change in form
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === "manual") {
      setClientName("");
      setClientPhone("");
    } else {
      const found = clients.find(c => c.id === clientId);
      if (found) {
        setClientName(found.name);
        setClientPhone(found.phone);
      }
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!clientName.trim() || !clientPhone.trim() || !topic.trim()) {
      setAddError("გთხოვთ შეავსოთ აუცილებელი ველები (კლიენტის სახელი, ტელეფონი, თემა)!");
      return;
    }

    onAddFollowup({
      clientId: selectedClientId === "manual" ? undefined : selectedClientId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date,
      time,
      type,
      topic: topic.trim(),
      status: "მოლოდინში",
      notes: notes.trim() || undefined
    });

    // Reset form
    setSelectedClientId("manual");
    setClientName("");
    setClientPhone("");
    setTopic("");
    setNotes("");
    setShowAddForm(false);
  };

  // Start edit handler
  const startEdit = (item: Followup) => {
    setEditError(null);
    setEditingId(item.id);
    setEditClientName(item.clientName);
    setEditClientPhone(item.clientPhone);
    setEditDate(item.date);
    setEditTime(item.time);
    setEditType(item.type);
    setEditTopic(item.topic);
    setEditNotes(item.notes || "");
  };

  // Save edit handler
  const saveEdit = (id: string) => {
    setEditError(null);
    if (!editClientName.trim() || !editClientPhone.trim() || !editTopic.trim()) {
      setEditError("გთხოვთ შეავსოთ აუცილებელი ველები!");
      return;
    }

    const original = followups.find(f => f.id === id);
    if (original) {
      onEditFollowup({
        ...original,
        clientName: editClientName.trim(),
        clientPhone: editClientPhone.trim(),
        date: editDate,
        time: editTime,
        type: editType,
        topic: editTopic.trim(),
        notes: editNotes.trim() || undefined
      });
    }
    setEditingId(null);
  };

  // Filtered followups
  const filteredFollowups = useMemo(() => {
    return followups.filter(item => {
      const matchSearch = 
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.clientPhone.includes(searchQuery) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchType = typeFilter === "all" || item.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    }).sort((a, b) => {
      // Sort by status pending first, then by date and time
      if (a.status === "მოლოდინში" && b.status !== "მოლოდინში") return -1;
      if (a.status !== "მოლოდინში" && b.status === "მოლოდინში") return 1;
      
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [followups, searchQuery, statusFilter, typeFilter]);

  // Stats computation
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let todayCount = 0;
    let tomorrowCount = 0;

    followups.forEach(item => {
      if (item.status === "მოლოდინში") {
        pending++;
        if (item.date === todayStr) todayCount++;
        if (item.date === tomorrowStr) tomorrowCount++;
      } else if (item.status === "დასრულებული") {
        completed++;
      }
    });

    return { pending, completed, todayCount, tomorrowCount };
  }, [followups, todayStr, tomorrowStr]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display flex items-center gap-2">
            <Notebook className="w-6 h-6 text-indigo-500" />
            საკონტაქტო დავალებები
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ჩაინიშნეთ და დაგეგმეთ კლიენტებთან ზარები ან შეტყობინებები სასურველ დროსა და თემაზე.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setAddError(null);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all duration-150 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          {showAddForm ? (
            <>
              <X className="w-4 h-4" />
              დახურვა
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              დავალების ჩაწერა
            </>
          )}
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-200/40 dark:border-amber-900/40">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">მოლოდინშია</div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 border border-indigo-200/40 dark:border-indigo-900/40">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">დღეს ჩასატარებელი</div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
              {stats.todayCount}
            </div>
          </div>
        </div>

        {/* Card 3: Tomorrow */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/20 text-teal-500 border border-teal-200/40 dark:border-teal-900/40">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ხვალ ჩასატარებელი</div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
              {stats.tomorrowCount}
            </div>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-200/40 dark:border-emerald-900/40">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">განხორციელებული</div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-down Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  ახალი დავალების დამატება
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-800 dark:text-slate-100">
                {addError && (
                  <div className="md:col-span-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span>{addError}</span>
                  </div>
                )}
                
                {/* Selection from client database */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    შეარჩიეთ კლიენტი ბაზიდან
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value="manual">-- ხელით ჩაწერა (ახალი კლიენტი) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    კლიენტის სახელი *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      disabled={selectedClientId !== "manual"}
                      placeholder="მაგ: გიორგი შავაძე"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Client Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    მობილურის ნომერი *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      disabled={selectedClientId !== "manual"}
                      placeholder="მაგ: 595123456"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    თარიღი *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    საათი *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    კომუნიკაციის ფორმა *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType("call")}
                      className={`py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        type === "call"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      დარეკვა
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("message")}
                      className={`py-2 px-3 border rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        type === "message"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      მიწერა
                    </button>
                  </div>
                </div>

                {/* Topic of calling */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    რა თემაზე უნდა დაუკავშირდეთ? (თემა) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="მაგ: ხვალინდელი ვიზიტის დადასტურება, შეთავაზება ახალ პროდუქტზე"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    დამატებითი შენიშვნა
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: სთხოვა რომ 14:00-მდე არ დავურეკოთ"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Submit button row */}
                <div className="md:col-span-3 pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold shadow-xs cursor-pointer"
                  >
                    დაგეგმვა
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editError && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span>{editError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ძებნა სახელით, ნომრით ან თემით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">სტატუსი:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="მოლოდინში">მოლოდინში</option>
            <option value="დასრულებული">განხორციელებული</option>
            <option value="გაუქმებული">გაუქმებული</option>
          </select>
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">ტიპი:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">ყველა ტიპი</option>
            <option value="call">☎️ დარეკვა</option>
            <option value="message">💬 მიწერა</option>
          </select>
        </div>
      </div>

      {/* Main Table / Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {filteredFollowups.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Notebook className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">დაგეგმილი კომუნიკაციები ვერ მოიძებნა</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">დააჭირეთ "დავალების ჩაწერა" ღილაკს ახალი დავალების დასაგეგმად.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="w-full border-collapse text-left hidden md:table">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-200/60 dark:border-slate-800/60">
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">კომუნიკაცია</th>
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">კლიენტი / ნომერი</th>
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">დრო და თარიღი</th>
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">დავალება / თემა</th>
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">სტატუსი</th>
                  <th className="py-3.5 px-5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">ქმედებები</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredFollowups.map((item) => {
                  const isEditing = editingId === item.id;
                  
                  // Row styling based on date and status
                  const isToday = item.date === todayStr && item.status === "მოლოდინში";
                  const isOverdue = item.date < todayStr && item.status === "მოლოდინში";

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors ${
                        isToday ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                      } ${
                        isOverdue ? "bg-rose-50/10 dark:bg-rose-950/5 text-rose-950 dark:text-rose-200" : ""
                      }`}
                    >
                      {/* Column 1: Type icon and communication label */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as "call" | "message")}
                            className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100"
                          >
                            <option value="call">☎️ ზარი</option>
                            <option value="message">💬 მიწერა</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {item.type === "call" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10.5px] font-bold rounded-lg border border-amber-200/20">
                                <Phone className="w-3 h-3 text-amber-500" />
                                დარეკვა
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-[10.5px] font-bold rounded-lg border border-teal-200/20">
                                <MessageSquare className="w-3 h-3 text-teal-500" />
                                მიწერა
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 2: Client name & phone */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editClientName}
                              onChange={(e) => setEditClientName(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-40 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                            <input
                              type="text"
                              value={editClientPhone}
                              onChange={(e) => setEditClientPhone(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-40 block bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                              {item.clientName}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5 select-all">
                              {item.clientPhone}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Date & time */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs block bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs block bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.date === todayStr ? "დღეს" : item.date === tomorrowStr ? "ხვალ" : item.date}</span>
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{item.time} საათზე</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 4: Topic & notes */}
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <div className="space-y-1 w-64">
                            <input
                              type="text"
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-xs w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="შენიშვნა"
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        ) : (
                          <div className="max-w-xs lg:max-w-sm">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {item.topic}
                            </div>
                            {item.notes && (
                              <p className="text-[10.5px] text-indigo-600 dark:text-indigo-400 italic mt-0.5 leading-normal">
                                💬 შენიშვნა: {item.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Status badge */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {item.status === "მოლოდინში" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/30">
                            მოლოდინში
                          </span>
                        ) : item.status === "დასრულებული" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30">
                            ✓ განხორციელდა
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            გაუქმდა
                          </span>
                        )}
                      </td>

                      {/* Column 6: Action buttons */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              შენახვა
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditError(null);
                              }}
                              className="p-1 px-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              გაუქმება
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {/* Call / Message Native Action Links */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/30">
                              <a
                                href={`tel:${item.clientPhone}`}
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-amber-600 hover:text-amber-500 rounded-md transition-colors"
                                title="დარეკვა ტელეფონით"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${item.clientPhone.replace(/\+/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-teal-600 hover:text-teal-500 rounded-md transition-colors"
                                title="მიწერა WhatsApp-ში"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Status controls */}
                            {item.status === "მოლოდინში" && (
                              <>
                                <button
                                  onClick={() => onUpdateFollowupStatus(item.id, "დასრულებული")}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg border border-emerald-200/30 transition-all flex items-center gap-1 text-[10.5px] font-bold cursor-pointer"
                                  title="დასრულებულად მონიშვნა"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  განხორციელდა
                                </button>
                                <button
                                  onClick={() => onUpdateFollowupStatus(item.id, "გაუქმებული")}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                                  title="გაუქმება"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Edit / Delete */}
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                              title="რედაქტირება"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setFollowupToDelete(item)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                              title="წაშლა"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Responsive List View */}
            <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {filteredFollowups.map((item) => {
                const isEditing = editingId === item.id;
                const isToday = item.date === todayStr && item.status === "მოლოდინში";
                const isOverdue = item.date < todayStr && item.status === "მოლოდინში";

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 space-y-3 ${
                      isToday ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                    } ${
                      isOverdue ? "bg-rose-50/10 dark:bg-rose-950/5" : ""
                    }`}
                  >
                    {/* Header: client, status and type badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editClientName}
                              onChange={(e) => setEditClientName(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                            <input
                              type="text"
                              value={editClientPhone}
                              onChange={(e) => setEditClientPhone(e.target.value)}
                              className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-full block bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        ) : (
                          <>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {item.clientName}
                            </h4>
                            <p className="text-[10.5px] text-slate-400 font-mono mt-0.5 select-all">
                              {item.clientPhone}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Type badge */}
                        {item.type === "call" ? (
                          <span className="p-1 px-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded-md">
                            ☎️ ზარი
                          </span>
                        ) : (
                          <span className="p-1 px-1.5 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-[9px] font-bold rounded-md">
                            💬 მიწერა
                          </span>
                        )}

                        {/* Status badge */}
                        {item.status === "მოლოდინში" ? (
                          <span className="p-1 px-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded-md">
                            მოლოდინში
                          </span>
                        ) : item.status === "დასრულებული" ? (
                          <span className="p-1 px-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold rounded-md">
                            დასრულდა
                          </span>
                        ) : (
                          <span className="p-1 px-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded-md">
                            გაუქმდა
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Topic and notes info */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 space-y-1">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="შენიშვნა"
                            className="px-2 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-xs w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.topic}
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                              შენიშვნა: {item.notes}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Date and actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/40">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 text-[10.5px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date === todayStr ? "დღეს" : item.date === tomorrowStr ? "ხვალ" : item.date}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.time} საათზე</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2">
                        {/* Native calling triggers */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                          <a
                            href={`tel:${item.clientPhone}`}
                            className="p-1 text-amber-600 hover:text-amber-500 rounded"
                            title="დარეკვა"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${item.clientPhone.replace(/\+/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-teal-600 hover:text-teal-500 rounded"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Status updates */}
                        {item.status === "მოლოდინში" && !isEditing && (
                          <>
                            <button
                              onClick={() => onUpdateFollowupStatus(item.id, "დასრულებული")}
                              className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              განხორციელდა
                            </button>
                            <button
                              onClick={() => onUpdateFollowupStatus(item.id, "გაუქმებული")}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] transition-colors"
                              title="გაუქმება"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              შენახვა
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditError(null);
                              }}
                              className="p-1 px-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              გაუქმება
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 rounded-lg"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setFollowupToDelete(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-red-600 text-slate-400 rounded-lg"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Helpful Hint Card */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-200/50 dark:border-indigo-900/40 rounded-2xl p-4 flex gap-3 text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed font-sans">
        <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-indigo-900 dark:text-indigo-300 mb-0.5">როგორ მუშაობს სწრაფი ზარი და შეტყობინება?</span>
          <span>
            თითოეული დავალების გვერდით განთავსებულია სწრაფი მოქმედებების ღილაკები. 
            ტელეფონის ღილაკზე ☎️ დაჭერით მობილურიდან პირდაპირ განხორციელდება ზარი, ხოლო WhatsApp 💬 ღილაკით მყისიერად გადახვალთ კლიენტის პირად ჩატში. 
            კავშირის დასრულების შემდეგ მონიშნეთ დავალება როგორც <strong className="text-emerald-700 dark:text-emerald-400">"განხორციელდა"</strong>.
          </span>
        </div>
      </div>

      <ConfirmModal
        isOpen={followupToDelete !== null}
        onClose={() => setFollowupToDelete(null)}
        onConfirm={() => {
          if (followupToDelete) {
            onDeleteFollowup(followupToDelete.id);
          }
        }}
        title="დავალების წაშლა"
        message={followupToDelete ? `ნამდვილად გსურთ წაშალოთ ეს შეხსენება კლიენტისთვის: ${followupToDelete.clientName}?` : ""}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
