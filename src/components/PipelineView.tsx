/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Layers, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award,
  X,
  Phone,
  Mail,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Client, Business, formatPrice } from "../types";

interface PipelineViewProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onAddClient: (client: Omit<Client, "id" | "totalBookings" | "totalSpent">) => void;
  selectedBusiness: Business;
}

const STAGES = [
  {
    id: "მუშაობის პროცესში",
    label: "მუშაობის პროცესში",
    color: "amber",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    headerColor: "bg-amber-500 text-white",
    borderColor: "border-amber-100 dark:border-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-400",
    icon: ArrowLeftRight
  },
  {
    id: "წარმატებული გარიგება",
    label: "წარმატებული გარიგება",
    color: "emerald",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    headerColor: "bg-emerald-500 text-white",
    borderColor: "border-emerald-100 dark:border-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2
  },
  {
    id: "წარუმატებლად დახურული",
    label: "წარუმატებლად დახურული",
    color: "rose",
    bgColor: "bg-rose-500/10 border-rose-500/20",
    headerColor: "bg-rose-500 text-white",
    borderColor: "border-rose-100 dark:border-rose-900/30",
    textClass: "text-rose-700 dark:text-rose-400",
    icon: AlertCircle
  },
  {
    id: "უსტატუსო",
    label: "უსტატუსო / ახალი",
    color: "slate",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    headerColor: "bg-slate-500 text-white",
    borderColor: "border-slate-100 dark:border-slate-800/30",
    textClass: "text-slate-700 dark:text-slate-400",
    icon: HelpCircle
  }
];

export default function PipelineView({ clients, onEditClient, onAddClient, selectedBusiness }: PipelineViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientStage, setNewClientStage] = useState("მუშაობის პროცესში");

  const [activeDetailTab, setActiveDetailTab] = useState<"total" | "won" | "progress" | "conversion" | null>(null);
  const [detailSearchQuery, setDetailSearchQuery] = useState("");

  // Filtered clients for detail modal
  const filteredDetailClients = useMemo(() => {
    if (!activeDetailTab || activeDetailTab === "conversion") return [];
    
    let list = [...clients];
    if (activeDetailTab === "won") {
      list = list.filter(c => c.tag === "წარმატებული გარიგება");
    } else if (activeDetailTab === "progress") {
      list = list.filter(c => c.tag === "მუშაობის პროცესში" || !c.tag);
    }

    if (!detailSearchQuery.trim()) return list;

    const query = detailSearchQuery.toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(detailSearchQuery) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }, [clients, activeDetailTab, detailSearchQuery]);

  // Filter clients based on search query (memoized for optimal load handling)
  const searchedClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  // Group clients by stage (memoized)
  const groupedClients = useMemo(() => {
    const groups: Record<string, Client[]> = {
      "მუშაობის პროცესში": [],
      "წარმატებული გარიგება": [],
      "წარუმატებლად დახურული": [],
      "უსტატუსო": []
    };

    searchedClients.forEach(client => {
      const stage = client.tag || "უსტატუსო";
      if (groups[stage]) {
        groups[stage].push(client);
      } else {
        groups["უსტატუსო"].push(client);
      }
    });
    return groups;
  }, [searchedClients]);

  // Calculate statistics (memoized)
  const { totalClientsCount, wonClientsCount, progressClientsCount, lostClientsCount, successRate } = useMemo(() => {
    const total = clients.length;
    const won = clients.filter(c => c.tag === "წარმატებული გარიგება").length;
    const progress = clients.filter(c => c.tag === "მუშაობის პროცესში" || !c.tag).length;
    const lost = clients.filter(c => c.tag === "წარუმატებლად დახურული").length;
    const rate = total > 0 ? Math.round((won / total) * 100) : 0;
    return {
      totalClientsCount: total,
      wonClientsCount: won,
      progressClientsCount: progress,
      lostClientsCount: lost,
      successRate: rate
    };
  }, [clients]);

  const handleMoveStage = (client: Client, newStage: string) => {
    onEditClient({
      ...client,
      tag: newStage === "უსტატუსო" ? undefined : newStage
    });
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    onAddClient({
      name: newClientName,
      phone: newClientPhone,
      email: "",
      notes: "დამატებულია CRM ფილტრიდან",
      tag: newClientStage === "უსტატუსო" ? undefined : newClientStage
    });

    setNewClientName("");
    setNewClientPhone("");
    setShowQuickAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            CRM ფილტრი
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
            თვალი ადევნეთ კლიენტების სტატუსებს, გაფილტრეთ CRM თეგებით და მართეთ გარიგებები
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            + კლიენტის სტატუსით დამატება
          </button>
        </div>
      </div>

      {/* CRM Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients Card */}
        <button
          onClick={() => {
            setActiveDetailTab("total");
            setDetailSearchQuery("");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-left w-full cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors shrink-0">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">სულ ბაზაში</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">{totalClientsCount} კლიენტი</span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* Won Clients Card */}
        <button
          onClick={() => {
            setActiveDetailTab("won");
            setDetailSearchQuery("");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left w-full cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors shrink-0">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">წარმატებული</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">{wonClientsCount} გარიგება</span>
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* In Progress Clients Card */}
        <button
          onClick={() => {
            setActiveDetailTab("progress");
            setDetailSearchQuery("");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left w-full cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-100/50 dark:border-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">მუშაობის პროცესში</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block mt-1.5 leading-none">{progressClientsCount} აქტიური</span>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              დეტალურად &rarr;
            </span>
          </div>
        </button>

        {/* Conversion Rating Card */}
        <button
          onClick={() => {
            setActiveDetailTab("conversion");
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-350 dark:hover:border-indigo-700 transition-all text-left w-full cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{successRate}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">კონვერსიის რეიტინგი</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block mt-1.5 leading-none">{successRate}% წარმატება</span>
            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5 mt-2">
              ანალიზი &rarr;
            </span>
          </div>
        </button>
      </div>

      {/* Pipeline Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="მოძებნეთ კლიენტი სახელით ან ტელეფონით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {STAGES.map(stage => {
          const stageClients = groupedClients[stage.id] || [];
          const totalSpentInStage = stageClients.reduce((sum, c) => sum + c.totalSpent, 0);
          const StageIcon = stage.icon;

          return (
            <div 
              key={stage.id}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 space-y-3 shadow-xs min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${stage.id === "წარმატებული გარიგება" ? "bg-emerald-500" : stage.id === "მუშაობის პროცესში" ? "bg-amber-500" : stage.id === "წარუმატებლად დახურული" ? "bg-rose-500" : "bg-slate-400"}`} />
                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {stage.label}
                  </h3>
                  <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold px-1.5 py-0.5 rounded-full">
                    {stageClients.length}
                  </span>
                </div>
                
                {/* Stage Revenue indicator */}
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">ჯამური ხარჯი</span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{formatPrice(totalSpentInStage, selectedBusiness.currency)}</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-0.5">
                {stageClients.length === 0 ? (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800/50 rounded-xl py-8 text-center text-slate-400 dark:text-slate-600">
                    <StageIcon className="w-5 h-5 mx-auto opacity-30 mb-1" />
                    <span className="text-[10px] font-semibold block">ეტაპი ცარიელია</span>
                  </div>
                ) : (
                  stageClients.map(client => (
                    <div 
                      key={client.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-150 shadow-xs space-y-3 group"
                    >
                      {/* Card Top Info */}
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate leading-tight">
                          {client.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5 font-mono">
                          {client.phone}
                        </span>
                      </div>

                      {/* Small Stats block */}
                      <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-950/40 p-1.5 rounded-lg text-center border border-slate-100 dark:border-slate-900 text-[10px]">
                        <div className="border-r border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-slate-400 block font-bold text-[8px] uppercase">ჯავშნები</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{client.totalBookings}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[8px] uppercase">ხარჯი</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{formatPrice(client.totalSpent, selectedBusiness.currency)}</span>
                        </div>
                      </div>

                      {/* Pipeline Quick Transition pills */}
                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2">
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">ეტაპის შეცვლა:</span>
                        <div className="flex gap-1">
                          {STAGES.filter(s => s.id !== stage.id).map(targetStage => (
                            <button
                              key={targetStage.id}
                              onClick={() => handleMoveStage(client, targetStage.id)}
                              className={`flex-1 text-[9px] font-extrabold py-1 px-1 rounded border hover:scale-[1.03] transition-all cursor-pointer ${
                                targetStage.id === "წარმატებული გარიგება" 
                                  ? "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                  : targetStage.id === "მუშაობის პროცესში"
                                  ? "bg-amber-50 hover:bg-amber-100/80 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                  : targetStage.id === "წარუმატებლად დახურული"
                                  ? "bg-rose-50 hover:bg-rose-100/80 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}
                              title={`გადაყვანა სტატუსზე: ${targetStage.label}`}
                            >
                              {targetStage.id === "წარმატებული გარიგება" ? "მწვანე" : targetStage.id === "მუშაობის პროცესში" ? "ყვითელი" : targetStage.id === "წარუმატებლად დახურული" ? "წითელი" : "ახალი"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Client Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-sm w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                კლიენტის დამატება CRM ფილტრში
              </h3>
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickAddClient} className="p-4 space-y-3.5 text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  კლიენტის სახელი და გვარი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: +995 599 123 456"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  საწყისი CRM სტატუსი (თეგი)
                </label>
                <select
                  value={newClientStage}
                  onChange={(e) => setNewClientStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="მუშაობის პროცესში">🟡 მუშაობის პროცესში</option>
                  <option value="წარმატებული გარიგება">🟢 წარმატებული გარიგება</option>
                  <option value="წარუმატებლად დახურული">🔴 წარუმატებლად დახურული</option>
                  <option value="უსტატუსო">⚪ უსტატუსო / ახალი</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-semibold cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold cursor-pointer"
                >
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics Detail Modal */}
      <AnimatePresence>
        {activeDetailTab && (() => {
          let modalTitle = "";
          let themeColor = "indigo";
          
          if (activeDetailTab === "total") {
            modalTitle = "კლიენტების სრული რეესტრი";
            themeColor = "indigo";
          } else if (activeDetailTab === "won") {
            modalTitle = "წარმატებული გარიგებები";
            themeColor = "emerald";
          } else if (activeDetailTab === "progress") {
            modalTitle = "აქტიური კლიენტები მუშაობის პროცესში";
            themeColor = "amber";
          } else if (activeDetailTab === "conversion") {
            modalTitle = "კონვერსიის რეიტინგის ანალიზი";
            themeColor = "emerald";
          }

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
                      themeColor === "indigo" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" :
                      themeColor === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                      "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                    }`}>
                      {activeDetailTab === "total" && <Users className="w-5 h-5" />}
                      {activeDetailTab === "won" && <Award className="w-5 h-5" />}
                      {activeDetailTab === "progress" && <TrendingUp className="w-5 h-5" />}
                      {activeDetailTab === "conversion" && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display leading-tight">
                        {modalTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-none mt-1">
                        CRM დეტალური ანგარიში • {clients.length} კლიენტი
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
                <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
                  {activeDetailTab === "conversion" ? (
                    /* Conversion Tab */
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">სულ ბაზაში</span>
                          <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100 block mt-2">{totalClientsCount}</span>
                        </div>
                        <div className="bg-emerald-50/20 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100/30 dark:border-emerald-900/30 text-center">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">წარმატებული</span>
                          <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-2">{wonClientsCount}</span>
                        </div>
                        <div className="bg-amber-50/20 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100/30 dark:border-amber-900/30 text-center">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block">აქტიური</span>
                          <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 block mt-2">{progressClientsCount}</span>
                        </div>
                        <div className="bg-rose-50/20 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100/30 dark:border-rose-900/30 text-center">
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block">ჩაშლილი</span>
                          <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 block mt-2">{lostClientsCount}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                        <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">კონვერსიის დიაგრამა</h5>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-950/30">
                                წარმატებული გარიგების კოეფიციენტი
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                {successRate}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-200 dark:bg-slate-800">
                            <div style={{ width: `${successRate}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 rounded-full" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          კონვერსიის რეიტინგი გვიჩვენებს, თუ კლიენტების რა პროცენტი გადავიდა წარმატებულ სტატუსზე. მაღალი რეიტინგი მიანიშნებს თქვენი სერვისების ხარისხსა და კლიენტებთან წარმატებულ კომუნიკაციაზე.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Table showing list of clients */
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h5 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider leading-none">
                          კლიენტების სია ({filteredDetailClients.length})
                        </h5>
                        
                        {/* Search Inside Modal */}
                        <div className="relative min-w-[240px]">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="ძებნა (სახელი, ტელეფონი...)"
                            value={detailSearchQuery}
                            onChange={(e) => setDetailSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[10px] bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200"
                          />
                        </div>
                      </div>

                      {filteredDetailClients.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5">
                          <Users className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold">კლიენტები ვერ მოიძებნა</p>
                        </div>
                      ) : (
                        <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
                          <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">კლიენტი</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950">ტელეფონი</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950 text-center">ჯავშნები</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950 text-right">ჯამური ხარჯი</th>
                                <th className="p-3 bg-slate-50 dark:bg-slate-950 text-right">ამჟამინდელი თეგი</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredDetailClients.map(client => (
                                <tr key={client.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                                    <div className="flex items-center gap-2">
                                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-100">{client.name}</div>
                                        {client.email && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{client.email}</div>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold font-mono">
                                    {client.phone}
                                  </td>
                                  <td className="p-3 text-center text-slate-600 dark:text-slate-400 font-bold">
                                    {client.totalBookings}
                                  </td>
                                  <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100">
                                    {formatPrice(client.totalSpent, selectedBusiness.currency)}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                      client.tag === "წარმატებული გარიგება" ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100" :
                                      client.tag === "მუშაობის პროცესში" ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100" :
                                      client.tag === "წარუმატებლად დახურული" ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100" :
                                      "bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200"
                                    }`}>
                                      {client.tag || "ახალი / უსტატუსო"}
                                    </span>
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
    </div>
  );
}
