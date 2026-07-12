/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Plus, UserPlus, Phone, Mail, FileText, Trash2, Edit2, Wallet, CalendarRange, Download, FileSpreadsheet } from "lucide-react";
import { Client } from "../types";

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, "id" | "totalBookings" | "totalSpent">) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientsView({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // CSV Export for Clients
  const handleExportCSV = () => {
    const headers = ["სახელი", "ტელეფონი", "ელ-ფოსტა", "ჯავშნების რაოდენობა", "ჯამური დანახარჯი (₾)", "შენიშვნა"];
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

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setShowModal(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setPhone(client.phone);
    setEmail(client.email);
    setNotes(client.notes || "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("გთხოვთ მიუთითოთ კლიენტის სახელი და ტელეფონი");
      return;
    }

    if (editingClient) {
      onEditClient({
        ...editingClient,
        name,
        phone,
        email,
        notes: notes.trim() || undefined
      });
    } else {
      onAddClient({
        name,
        phone,
        email,
        notes: notes.trim() || undefined
      });
    }
    setShowModal(false);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top action section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 tracking-tight">
            კლიენტების ბაზა
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            მართეთ თქვენი მომხმარებლების მონაცემები, კონტაქტები და ვიზიტების ისტორია
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            title="კლიენტების ექსპორტი CSV ფორმატში"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ექსპორტი (.CSV)</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ახალი კლიენტი</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="მოძებნეთ კლიენტი სახელით, ტელეფონით ან მეილით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150 mx-auto">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-slate-500 text-xs font-semibold">
            შესაბამისი კლიენტი ვერ მოიძებნა
          </p>
          <button
            onClick={handleOpenAdd}
            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            + ახალი კლიენტის დამატება
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div 
              key={client.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-350 transition-all duration-150 flex flex-col justify-between shadow-xs space-y-3 group relative"
            >
              {/* Client Info Card */}
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {client.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs leading-tight">
                        {client.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        ID: {client.id.replace("cli_", "#")}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action row visible on hover / subtle */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`ნამდვილად გსურთ კლიენტის (${client.name}) წაშლა?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors"
                      title="წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Contacts */}
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold font-mono">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.notes && (
                    <div className="flex items-start gap-2 bg-slate-50 border border-slate-150 p-2 rounded-lg mt-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 italic leading-snug line-clamp-2">
                        {client.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CRM Statistics */}
              <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-center">
                <div className="border-r border-slate-200/50">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                    ჯავშნები
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <CalendarRange className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {client.totalBookings}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                    ჯამური ხარჯი
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-0.5 mt-0.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {client.totalSpent}₾
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
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                {editingClient ? "მომხმარებლის რედაქტირება" : "ახალი კლიენტის დამატება"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  სახელი და გვარი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ტელეფონის ნომერი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: +995 599 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ელ-ფოსტა
                </label>
                <input
                  type="email"
                  placeholder="მაგ: info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  შენიშვნა / კომენტარი
                </label>
                <textarea
                  rows={3}
                  placeholder="სასურველი პრეფერენციები ან ალერგიული რეაქციები..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold"
                >
                  {editingClient ? "შენახვა" : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
