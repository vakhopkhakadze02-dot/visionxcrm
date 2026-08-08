/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, User, Mail, Phone, Award, Star, Trash2, Edit2, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { Staff } from "../types";
import ConfirmModal from "./ConfirmModal";

interface StaffViewProps {
  staff: Staff[];
  onAddStaff: (member: Omit<Staff, "id">) => void;
  onEditStaff: (member: Staff) => void;
  onDeleteStaff: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function StaffView({
  staff,
  onAddStaff,
  onEditStaff,
  onDeleteStaff,
  onToggleStatus
}: StaffViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number>(5.0);
  const [status, setStatus] = useState<"აქტიური" | "შვებულებაში">("აქტიური");

  const handleOpenAdd = () => {
    setError(null);
    setEditingMember(null);
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setRating(5.0);
    setStatus("აქტიური");
    setShowModal(true);
  };

  const handleOpenEdit = (member: Staff) => {
    setError(null);
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setEmail(member.email);
    setRating(member.rating);
    setStatus(member.status);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !role.trim()) {
      setError("გთხოვთ მიუთითოთ თანამშრომლის სახელი და პოზიცია");
      return;
    }

    if (editingMember) {
      onEditStaff({
        ...editingMember,
        name,
        role,
        phone,
        email,
        rating: Number(rating),
        status
      });
    } else {
      onAddStaff({
        name,
        role,
        phone,
        email,
        rating: Number(rating),
        status,
        avatarColor: "bg-indigo-600 text-white"
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 tracking-tight">
            თანამშრომლების მართვა
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            აკონტროლეთ პერსონალის სიები, სამუშაო სტატუსები, რეიტინგები და საკონტაქტო მონაცემები
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ ახალი თანამშრომელი</span>
        </button>
      </div>

      {/* Staff list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div 
            key={member.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-350 transition-all duration-150 flex flex-col justify-between shadow-xs relative group"
          >
            {/* Upper details */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${member.avatarColor || "bg-indigo-600 text-white"}`}>
                    {member.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-xs leading-tight truncate">
                      {member.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold pt-0.5 truncate">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Hover actions */}
                <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors"
                    title="რედაქტირება"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStaffToDelete(member)}
                    className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Staff contacts & ratings */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                
                {/* Rating display */}
                <div className="flex items-center gap-1 pt-1 border-t border-slate-50 mt-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <span className="font-bold text-slate-700 text-[11px]">
                    {member.rating.toFixed(1)}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    რეიტინგი
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status Trigger */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                member.status === "აქტიური"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-100"
              }`}>
                {member.status}
              </span>
              
              <button
                onClick={() => onToggleStatus(member.id)}
                className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-all font-bold"
              >
                სტატუსი
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-indigo-600" />
                {editingMember ? "თანამშრომლის რედაქტირება" : "ახალი თანამშრომლის დამატება"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-slate-800">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  სახელი და გვარი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: დავით კაპანაძე"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  პოზიცია / როლი <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: უფროსი სტილისტი"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ტელეფონი
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: +995 599 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    რეიტინგი (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    required
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ელ-ფოსტა
                </label>
                <input
                  type="email"
                  placeholder="მაგ: david@company.ge"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  სამუშაო სტატუსი
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 bg-white"
                >
                  <option value="აქტიური">აქტიური</option>
                  <option value="შვებულებაში">შვებულებაში</option>
                </select>
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
                  {editingMember ? "შენახვა" : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={staffToDelete !== null}
        onClose={() => setStaffToDelete(null)}
        onConfirm={() => {
          if (staffToDelete) {
            onDeleteStaff(staffToDelete.id);
          }
        }}
        title="თანამშრომლის წაშლა"
        message={staffToDelete ? `ნამდვილად გსურთ წაშალოთ სპეციალისტი: ${staffToDelete.name}? წაიშლება სპეციალისტთან დაკავშირებული ყველა ჯავშანი.` : ""}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
