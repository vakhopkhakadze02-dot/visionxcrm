/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Sparkles, 
  UserSquare2, 
  BarChart3, 
  LogOut, 
  ChevronDown, 
  Plus, 
  Building2,
  Check,
  Sun,
  Moon,
  Mail,
  Notebook,
  Layers
} from "lucide-react";
import { Business } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  businesses: Business[];
  selectedBusiness: Business;
  onSelectBusiness: (business: Business) => void;
  onAddBusiness: (name: string, owner: string, category: string) => void;
  onLogout: () => void;
  isSupabaseSynced?: boolean;
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onAddBusiness,
  onLogout,
  isSupabaseSynced = false,
  isOpen,
  onClose,
  theme,
  onToggleTheme
}: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBusName, setNewBusName] = useState("");
  const [newBusOwner, setNewBusOwner] = useState("");
  const [newBusCategory, setNewBusCategory] = useState("სილამაზის სალონი");

  // Miniature Starburst Logo SVG
  const MiniLogo = () => (
    <svg viewBox="0 0 200 200" className="w-7 h-7 shrink-0 shadow-sm">
      {[
        { angle: 0, color: "#84cc16" },   // Lime Green
        { angle: 30, color: "#ffffff" },  // White
        { angle: 60, color: "#1d4ed8" },  // Royal Blue
        { angle: 90, color: "#ffffff" },  // White
        { angle: 120, color: "#84cc16" }, // Lime Green
        { angle: 150, color: "#ffffff" }, // White
        { angle: 180, color: "#1d4ed8" }, // Royal Blue
        { angle: 210, color: "#ffffff" }, // White
        { angle: 240, color: "#84cc16" }, // Lime Green
        { angle: 270, color: "#1d4ed8" }, // Royal Blue
        { angle: 300, color: "#ffffff" }, // White
        { angle: 330, color: "#84cc16" }, // Lime Green
      ].map((spoke, idx) => (
        <g key={idx} transform={`rotate(${spoke.angle} 100 100)`}>
          <rect
            x="92"
            y="25"
            width="16"
            height="55"
            rx="8"
            fill={spoke.color}
          />
        </g>
      ))}
      <circle cx="100" cy="100" r="32" fill="#0f172a" />
    </svg>
  );

  const menuItems = [
    { id: "dashboard", label: "მთავარი", icon: LayoutDashboard },
    { id: "calendar", label: "კალენდარი", icon: Calendar },
    { id: "clients", label: "კლიენტები", icon: Users },
    { id: "pipeline", label: "CRM მილსადენი", icon: Layers },
    { id: "services", label: "სერვისები", icon: Sparkles },
    { id: "staff", label: "თანამშრომლები", icon: UserSquare2 },
    { id: "notifications", label: "შეტყობინებები", icon: Mail },
    { id: "followups", label: "ზარები / შეხსენებები", icon: Notebook },
    { id: "analytics", label: "ფინანსები", icon: BarChart3 }
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBusName && newBusOwner) {
      onAddBusiness(newBusName, newBusOwner, newBusCategory);
      setNewBusName("");
      setNewBusOwner("");
      setShowAddModal(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`w-64 bg-[#0f172a] text-slate-300 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      {/* Brand & Business Selector */}
      <div className="p-5 border-b border-slate-800/80 relative">
        <div className="flex items-center gap-2.5 mb-4 px-1">
          <MiniLogo />
          <span className="text-lg font-bold text-white tracking-tight font-display">
            VisionX<span className="text-indigo-400 font-medium">CRM</span>
          </span>
        </div>

        <div 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg cursor-pointer transition-all duration-200 border border-slate-700/40 flex items-center justify-between"
          id="business-dropdown-trigger"
        >
          <div className="flex flex-col text-left overflow-hidden">
            <span className="font-bold text-white text-xs tracking-tight truncate leading-tight">
              {selectedBusiness.name}
            </span>
            <span className="text-[10px] text-slate-400 truncate mt-0.5">
              {selectedBusiness.ownerName}
            </span>
            <div className="mt-1">
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold inline-block">
                {selectedBusiness.role || "მფლობელი"}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
        </div>

        {/* Business Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute left-4 right-4 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-30 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 px-3 py-1 font-bold">
              ჩემი ბიზნესები ({businesses.length})
            </div>
            <div className="max-h-48 overflow-y-auto">
              {businesses.map((bus) => (
                <button
                  key={bus.id}
                  onClick={() => {
                    onSelectBusiness(bus);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors ${
                    selectedBusiness.id === bus.id ? "text-indigo-300 font-bold bg-indigo-500/10" : "text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span className="truncate">{bus.name}</span>
                  </div>
                  {selectedBusiness.id === bus.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>
            
            <div className="border-t border-slate-700 mt-1.5 pt-1.5 px-2">
              <button
                onClick={() => {
                  setShowAddModal(true);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-semibold"
              >
                <Plus className="w-3 h-3" />
                ახალი ბიზნესი
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-indigo-600/15 text-white shadow-sm shadow-indigo-600/5 border-l-2 border-indigo-500 pl-2.5"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
              id={`nav-link-${item.id}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Item */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={onLogout}
          className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-semibold text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all duration-150"
          id="logout-button"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
          <span>გასვლა</span>
        </button>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0"
          title={theme === "dark" ? "დღის რეჟიმი" : "ღამის რეჟიმი"}
          id="theme-toggle-button"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>

      {/* Add Business Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                ახალი ბიზნესის დამატება
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-semibold p-1"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ბიზნესის სახელი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: სალონი ჰარმონია"
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  მფლობელის სახელი
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: ნინო კაპანაძე"
                  value={newBusOwner}
                  onChange={(e) => setNewBusOwner(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  სფერო / კატეგორია
                </label>
                <select
                  value={newBusCategory}
                  onChange={(e) => setNewBusCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs bg-white text-slate-800"
                >
                  <option value="სილამაზის სალონი">სილამაზის სალონი</option>
                  <option value="სტომატოლოგიური კლინიკა">სტომატოლოგიური კლინიკა</option>
                  <option value="ავტოტექმომსახურება">ავტოტექმომსახურება</option>
                  <option value="ესთეტიკის ცენტრი">ესთეტიკის ცენტრი</option>
                  <option value="სავარჯიშო დარბაზი">სავარჯიშო დარბაზი</option>
                  <option value="სხვა">სხვა მომსახურება</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold"
                >
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
