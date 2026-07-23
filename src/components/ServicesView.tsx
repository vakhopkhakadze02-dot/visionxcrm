/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Scissors, Clock, DollarSign, Euro, Coins, Tag, Trash2, Edit2, Layers } from "lucide-react";
import { Service, formatPrice } from "../types";
import ConfirmModal from "./ConfirmModal";

interface ServicesViewProps {
  services: Service[];
  onAddService: (service: Omit<Service, "id">) => void;
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  currency?: "GEL" | "USD" | "EUR";
}

export default function ServicesView({
  services,
  onAddService,
  onEditService,
  onDeleteService,
  currency = "GEL"
}: ServicesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ყველა");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(10);
  const [duration, setDuration] = useState<number>(30);
  const [category, setCategory] = useState("თმის მოვლა");

  // Get distinct categories
  const categories = ["ყველა", ...Array.from(new Set(services.map(s => s.category)))];

  const handleOpenAdd = () => {
    setError(null);
    setEditingService(null);
    setName("");
    setPrice(30);
    setDuration(45);
    setCategory("თმის მოვლა");
    setShowModal(true);
  };

  const handleOpenEdit = (service: Service) => {
    setError(null);
    setEditingService(service);
    setName(service.name);
    setPrice(service.price);
    setDuration(service.duration);
    setCategory(service.category);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("გთხოვთ მიუთითოთ სერვისის სახელი");
      return;
    }

    if (editingService) {
      onEditService({
        ...editingService,
        name,
        price: Number(price),
        duration: Number(duration),
        category
      });
    } else {
      onAddService({
        name,
        price: Number(price),
        duration: Number(duration),
        category,
        color: "violet"
      });
    }
    setShowModal(false);
  };

  const filteredServices = selectedCategory === "ყველა"
    ? services
    : services.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-5">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 tracking-tight">
            მომსახურების კატალოგი
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">
            აკონტროლეთ თქვენი ბიზნესის სერვისების ფასები, ხანგრძლივობა და კატეგორიები
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ ახალი სერვისი</span>
        </button>
      </div>

      {/* Category Pills Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border shrink-0 ${
              selectedCategory === cat
                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div 
            key={service.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-350 transition-all duration-150 flex flex-col justify-between shadow-xs relative group"
          >
            <div className="space-y-3.5">
              {/* Card Title & Category Tag */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block">
                    {service.category}
                  </span>
                  <h3 className="font-bold text-slate-800 text-xs leading-tight pt-1 truncate">
                    {service.name}
                  </h3>
                </div>
                
                {/* Actions Row */}
                <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleOpenEdit(service)}
                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors"
                    title="რედაქტირება"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(service)}
                    className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Service Details row */}
              <div className="grid grid-cols-2 gap-3 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                      ხანგრძლივობა
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {service.duration} წთ
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0 font-bold text-[13px]">
                    {currency === "USD" ? (
                      <DollarSign className="w-3.5 h-3.5" />
                    ) : currency === "EUR" ? (
                      <Euro className="w-3.5 h-3.5" />
                    ) : (
                      <span className="leading-none select-none">₾</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">
                      ფასი
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">
                      {formatPrice(service.price, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                {editingService ? "მომსახურების რედაქტირება" : "ახალი მომსახურების დამატება"}
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
                  მომსახურების დასახელება <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: მოდური თმის შეჭრა"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ფასი ({currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾"}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ხანგრძლივობა (წუთი) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  კატეგორია <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: თმის მოვლა, ფრჩხილები"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  {editingService ? "შენახვა" : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={serviceToDelete !== null}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => {
          if (serviceToDelete) {
            onDeleteService(serviceToDelete.id);
          }
        }}
        title="სერვისის წაშლა"
        message={serviceToDelete ? `ნამდვილად გსურთ სერვისის (${serviceToDelete.name}) წაშლა? წაიშლება სერვისთან დაკავშირებული ყველა ჯავშანი.` : ""}
        confirmText="წაშლა"
        cancelText="გაუქმება"
        variant="danger"
      />
    </div>
  );
}
