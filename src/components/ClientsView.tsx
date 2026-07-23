/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, Plus, UserPlus, Phone, Mail, FileText, Trash2, Edit2, Wallet, CalendarRange, Download, FileSpreadsheet } from "lucide-react";
import { Client, formatPrice } from "../types";
import ConfirmModal from "./ConfirmModal";

export const tagStyles: Record<string, { bg: string, dot: string, label: string }> = {
  "წარმატებული გარიგება": {
    bg: "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    dot: "bg-emerald-500",
    label: "წარმატებული"
  },
  "მუშაობის პროცესში": {
    bg: "bg-amber-50 dark:bg-amber-950/25 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    dot: "bg-amber-500",
    label: "მიმდინარე"
  },
  "წარუმატებლად დახურული": {
    bg: "bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
    dot: "bg-rose-500",
    label: "წარუმატებელი"
  }
};

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, "id" | "totalBookings" | "totalSpent">) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  currency?: "GEL" | "USD" | "EUR";
}

export default function ClientsView({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  currency = "GEL"
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  // CSV Export for Clients
  const handleExportCSV = () => {
    const currencySign = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾";
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
    link.setAttribute("download", "visionx_clients_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tag, setTag] = useState<string>("მუშაობის პროცესში");

  const handleOpenAdd = () => {
    setError(null);
    setEditingClient(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setTag("მუშაობის პროცესში");
    setShowModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setError(null);
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email);
    setNotes(client.notes || "");
    setTag(client.tag || "მუშაობის პროცესში");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("გთხოვთ მიუთითოთ კლიენტის სახელი და ტელეფონი");
      return;
    }

    if (editingClient) {
      onEditClient({
        ...editingClient,
        name,
        phone,
        email,
        notes: notes.trim() || undefined,
        tag: tag || undefined
      });
    } else {
      onAddClient({
        name,
        phone,
        email,
        notes: notes.trim() || undefined,
        tag: tag || undefined
      });
    }
    setShowModal(false);
  };

  // Filter clients based on search query and tag filter (memoized for high load performance)
  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(query) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(query));
      const matchesTag = selectedTagFilter === "all" || c.tag === selectedTagFilter;
      return matchesSearch && matchesTag;
    });
  }, [clients, searchQuery, selectedTagFilter]);

  return (
    <div className="space-y-5">
      {/* Top action section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
            კლიენტების ბაზა
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            მართეთ თქვენი მომხმარებლების მონაცემები, კონტაქტები და ვიზიტების ისტორია
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            title="კლიენტების ექსპორტი CSV ფორმატში"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ექსპორტი (.CSV)</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ახალი კლიენტი</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="მოძებნეთ კლიენტი სახელით, ტელეფონით ან მეილით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mr-1">სტატუსის ფილტრი:</span>
          <button
            onClick={() => setSelectedTagFilter("all")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              selectedTagFilter === "all"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700"
                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            ყველა
          </button>
          <button
            onClick={() => setSelectedTagFilter("წარმატებული გარიგება")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedTagFilter === "წარმატებული გარიგება"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            წარმატებული
          </button>
          <button
            onClick={() => setSelectedTagFilter("მუშაობის პროცესში")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedTagFilter === "მუშაობის პროცესში"
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            მიმდინარე
          </button>
          <button
            onClick={() => setSelectedTagFilter("წარუმატებლად დახურული")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              selectedTagFilter === "წარუმატებლად დახურული"
                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            წარუმატებელი
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-150 dark:border-slate-800 mx-auto">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            შესაბამისი კლიენტი ვერ მოიძებნა
          </p>
          <button
            onClick={handleOpenAdd}
            className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            + ახალი კლიენტის დამატება
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-150 flex flex-col justify-between shadow-xs space-y-3 group relative"
            >
              {/* Client Info Card */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {client.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-tight">
                        {client.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                          ID: {client.id.replace("cli_", "#")}
                        </span>
                        {client.tag && tagStyles[client.tag] && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${tagStyles[client.tag].bg}`}>
                            <span className={`w-1 h-1 rounded-full ${tagStyles[client.tag].dot}`} />
                            {tagStyles[client.tag].label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action row visible on hover / subtle */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition-colors cursor-pointer"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 rounded transition-colors cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Contacts */}
                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-semibold font-mono">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-2 rounded-lg mt-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-snug line-clamp-2">
                        {client.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Statistics */}
              <div className="bg-slate-50 dark:bg-slate-950/55 border border-slate-150 dark:border-slate-850 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-center">
                <div className="border-r border-slate-200/50 dark:border-slate-800/55">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">
                    ჯავშნები
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1 mt-0.5">
                    <CalendarRange className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {client.totalBookings}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">
                    ჯამური ხარჯი
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-0.5 mt-0.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {formatPrice(client.totalSpent, currency)}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {editingClient ? "მომხმარებლის რედაქტირება" : "ახალი კლიენტის დამატება"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-slate-800 dark:text-slate-200">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  სახელი და გვარი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  ტელეფონის ნომერი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: +995 599 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  ელ-ფოსტა
                </label>
                <input
                  type="email"
                  placeholder="მაგ: info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  CRM სტატუსი (თეგი)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTag("წარმატებული გარიგება")}
                    className={`py-2 px-1 rounded-lg border text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      tag === "წარმატებული გარიგება"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-500 shadow-xs scale-[1.02] dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-850"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>წარმატებული</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTag("მუშაობის პროცესში")}
                    className={`py-2 px-1 rounded-lg border text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      tag === "მუშაობის პროცესში"
                        ? "bg-amber-50 text-amber-700 border-amber-500 shadow-xs scale-[1.02] dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-800"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-850"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>მიმდინარე</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTag("წარუმატებლად დახურული")}
                    className={`py-2 px-1 rounded-lg border text-[10px] sm:text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      tag === "წარუმატებლად დახურული"
                        ? "bg-rose-50 text-rose-700 border-rose-500 shadow-xs scale-[1.02] dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-800"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-850"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>წარუმატებელი</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  შენიშვნა / კომენტარი
                </label>
                <textarea
                  rows={3}
                  placeholder="სასურველი პრეფერენციები ან ალერგიული რეაქციები..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-semibold cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold cursor-pointer"
                >
                  {editingClient ? "შენახვა" : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={clientToDelete !== null}
        onClose={() => setClientToDelete(null)}
        onConfirm={() => {
          if (clientToDelete) {
            onDeleteClient(clientToDelete.id);
          }
        }}
        title="კლიენტის წაშლა"
        message={clientToDelete ? `ნამდვილად გსურთ კლიენტის (${clientToDelete.name}) წაშლა? წაიშლება კლიენტთან დაკავშირებული ყველა ჯავშანი და შეხსენება.` : ""}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
