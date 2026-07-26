/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Phone, 
  Mail, 
  FileText, 
  Trash2, 
  Edit2, 
  Wallet, 
  CalendarRange, 
  Download, 
  FileSpreadsheet,
  Building,
  Share2,
  Paperclip,
  MessageSquare,
  Send,
  Upload,
  Globe,
  Facebook,
  MessageCircle,
  Clock
} from "lucide-react";
import { Client, CommunicationItem, FileAttachment, formatPrice, CurrencyCode } from "../types";
import ConfirmModal from "./ConfirmModal";
import { buildCsv, downloadCsv } from "../csv";
import { newId } from "../ids";

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
  currency?: CurrencyCode;
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
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Communication / History modal state
  const [activeCommClient, setActiveCommClient] = useState<Client | null>(null);
  const [commType, setCommType] = useState<CommunicationItem["type"]>("call");
  const [commSummary, setCommSummary] = useState("");

  // CSV Export for Clients
  const handleExportCSV = () => {
    const currencySign = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾";
    const headers = ["სახელი", "კომპანია", "წყარო", "ტელეფონი", "ელ-ფოსტა", "ჯავშნები", `ჯამური დანახარჯი (${currencySign})`, "შენიშვნა"];
    const rows = clients.map(c => [
      c.name,
      c.company || "",
      c.source || "Direct",
      c.phone,
      c.email || "",
      c.totalBookings,
      c.totalSpent,
      c.notes || ""
    ]);

    downloadCsv("visionx_crm_leads_clients.csv", buildCsv(headers, rows));
  };

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState<Client["source"]>("Facebook");
  const [notes, setNotes] = useState("");
  const [tag, setTag] = useState<string>("მუშაობის პროცესში");

  const handleOpenAdd = () => {
    setError(null);
    setEditingClient(null);
    setName("");
    setPhone("");
    setEmail("");
    setCompany("");
    setSource("Facebook");
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
    setCompany(client.company || "");
    setSource(client.source || "Facebook");
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
        company: company.trim() || undefined,
        source: source || "Direct",
        notes: notes.trim() || undefined,
        tag: tag || undefined
      });
    } else {
      onAddClient({
        name,
        phone,
        email,
        company: company.trim() || undefined,
        source: source || "Direct",
        notes: notes.trim() || undefined,
        tag: tag || undefined
      });
    }
    setShowModal(false);
  };

  const handleAddCommunicationLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommClient || !commSummary.trim()) return;

    const newLog: CommunicationItem = {
      id: newId("comm"),
      type: commType,
      date: new Date().toLocaleString("ka-GE"),
      summary: commSummary.trim(),
      author: "ოპერატორი"
    };

    const updatedClient: Client = {
      ...activeCommClient,
      communications: [newLog, ...(activeCommClient.communications || [])]
    };

    onEditClient(updatedClient);
    setActiveCommClient(updatedClient);
    setCommSummary("");
  };

  // Filter clients based on search query, tag, and source
  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(query) ||
        c.phone.includes(searchQuery) ||
        (c.company && c.company.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query));
      const matchesTag = selectedTagFilter === "all" || c.tag === selectedTagFilter;
      const matchesSource = selectedSourceFilter === "all" || c.source === selectedSourceFilter;
      return matchesSearch && matchesTag && matchesSource;
    });
  }, [clients, searchQuery, selectedTagFilter, selectedSourceFilter]);

  return (
    <div className="space-y-5">
      {/* Top action section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            კლიენტები & ლიდები (Contacts DB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            მართეთ მომხმარებლები, ლიდის წყაროები (FB, WhatsApp, Web), კომუნიკაციის ისტორია და ფაილები
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            title="ექსპორტი CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>ექსპორტი (.CSV)</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ახალი ლიდი / კლიენტი</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="მოძებნეთ კლიენტი, კომპანია, ტელეფონი ან მეილი..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
          />
        </div>

        {/* Source & Tag Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lead Source Filter */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="all">ყველა წყარო (Sources)</option>
            <option value="Facebook">Facebook Ads</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Instagram">Instagram</option>
            <option value="Direct">Direct / პირდაპირი</option>
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="წარმატებული გარიგება">წარმატებული</option>
            <option value="მუშაობის პროცესში">მიმდინარე</option>
            <option value="წარუმატებლად დახურული">წარუმატებელი</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-xs font-semibold">
            შესაბამისი კლიენტი / ლიდი ვერ მოიძებნა
          </p>
          <button
            onClick={handleOpenAdd}
            className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg"
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
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {client.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-tight">
                        {client.name}
                      </h3>
                      {client.company && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span>{client.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          {client.source || "Facebook"}
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
                  
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded cursor-pointer"
                      title="რედაქტირება"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-1 hover:bg-rose-50 text-rose-400 rounded cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
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
                </div>
              </div>

              {/* Action Toolbar for Communication & History */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                <button
                  onClick={() => setActiveCommClient(client)}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>კომუნიკაციის ისტორია ({client.communications?.length || 0})</span>
                </button>

                <div className="text-[10px] text-slate-400 font-mono font-bold">
                  {formatPrice(client.totalSpent, currency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Communication Log Modal */}
      {activeCommClient && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  კომუნიკაციის ისტორია - {activeCommClient.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">{activeCommClient.phone}</p>
              </div>
              <button 
                onClick={() => setActiveCommClient(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Add New Log */}
              <form onSubmit={handleAddCommunicationLog} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">+ ახალი ჩანაწერი</span>
                <div className="flex gap-2">
                  <select
                    value={commType}
                    onChange={(e) => setCommType(e.target.value as any)}
                    className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="call">📞 ზარი</option>
                    <option value="sms">📱 SMS</option>
                    <option value="email">📧 Email</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="facebook">Facebook</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="ჩანაწერი (მაგ: დავურეკეთ, შევუთანხმდით პრეზენტაციაზე...)"
                    value={commSummary}
                    onChange={(e) => setCommSummary(e.target.value)}
                    className="flex-1 px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                  >
                    დამატება
                  </button>
                </div>
              </form>

              {/* History List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">წინა კომუნიკაციები</span>
                {(!activeCommClient.communications || activeCommClient.communications.length === 0) ? (
                  <p className="text-slate-400 text-center italic py-4">ისტორია ცარიელია</p>
                ) : (
                  activeCommClient.communications.map(log => (
                    <div key={log.id} className="p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span className="uppercase text-indigo-600 dark:text-indigo-400">{log.type}</span>
                        <span>{log.date}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">{log.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {editingClient ? "მომხმარებლის რედაქტირება" : "ახალი კლიენტის / ლიდის დამატება"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-slate-800 dark:text-slate-200">
              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  სახელი და გვარი *
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ტელეფონი *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+995 599 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    კომპანია
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: შპს ვექტორი"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ელ-ფოსტა
                  </label>
                  <input
                    type="email"
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    ლიდის წყარო (Source)
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
                  >
                    <option value="Facebook">Facebook Ads</option>
                    <option value="Website">Website</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Direct">Direct / პირდაპირი</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  CRM სტატუსი
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="მუშაობის პროცესში">მიმდინარე (In Progress)</option>
                  <option value="წარმატებული გარიგება">წარმატებული (Won)</option>
                  <option value="წარუმატებლად დახურული">წარუმატებელი (Lost)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  შენიშვნა
                </label>
                <textarea
                  rows={2}
                  placeholder="სასურველი პრეფერენციები..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 rounded-lg font-semibold"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-bold"
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
        message={clientToDelete ? `ნამდვილად გსურთ კლიენტის (${clientToDelete.name}) წაშლა?` : ""}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
