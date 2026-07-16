/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Layers, ArrowLeftRight, CheckCircle2, AlertCircle, HelpCircle, TrendingUp, DollarSign, Users, Award } from "lucide-react";
import { Client } from "../types";

interface PipelineViewProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onAddClient: (client: Omit<Client, "id" | "totalBookings" | "totalSpent">) => void;
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

export default function PipelineView({ clients, onEditClient, onAddClient }: PipelineViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientStage, setNewClientStage] = useState("მუშაობის პროცესში");

  // Filter clients based on search query
  const searchedClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group clients by stage
  const groupedClients: Record<string, Client[]> = {
    "მუშაობის პროცესში": [],
    "წარმატებული გარიგება": [],
    "წარუმატებლად დახურული": [],
    "უსტატუსო": []
  };

  searchedClients.forEach(client => {
    const stage = client.tag || "უსტატუსო";
    if (groupedClients[stage]) {
      groupedClients[stage].push(client);
    } else {
      groupedClients["უსტატუსო"].push(client);
    }
  });

  // Calculate statistics
  const totalClientsCount = clients.length;
  const wonClientsCount = clients.filter(c => c.tag === "წარმატებული გარიგება").length;
  const progressClientsCount = clients.filter(c => c.tag === "მუშაობის პროცესში" || !c.tag).length;
  const lostClientsCount = clients.filter(c => c.tag === "წარუმატებლად დახურული").length;
  const successRate = totalClientsCount > 0 ? Math.round((wonClientsCount / totalClientsCount) * 100) : 0;

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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">სულ ბაზაში</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{totalClientsCount} კლიენტი</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/30">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">წარმატებული</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{wonClientsCount} გარიგება</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center border border-amber-100/50 dark:border-amber-900/30">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">მუშაობის პროცესში</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{progressClientsCount} აქტიური</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center border border-emerald-500/20">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{successRate}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">კონვერსიის რეიტინგი</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{successRate}% წარმატება</span>
          </div>
        </div>
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
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">{totalSpentInStage} ₾</span>
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
                          <span className="font-bold text-slate-700 dark:text-slate-300">{client.totalSpent}₾</span>
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
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                კლიენტის დამატება CRM ფილტრში
              </h3>
              <button 
                onClick={() => setShowQuickAdd(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickAddClient} className="p-4 space-y-3.5 text-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  კლიენტის სახელი და გვარი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: გიორგი ბერიძე"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ტელეფონი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: +995 599 123 456"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  საწყისი CRM სტატუსი (თეგი)
                </label>
                <select
                  value={newClientStage}
                  onChange={(e) => setNewClientStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white text-slate-800"
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
                  className="px-3 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold"
                >
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
