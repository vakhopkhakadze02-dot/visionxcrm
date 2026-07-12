/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, User, Sparkles, UserSquare2, Calendar, Clock, DollarSign, MessageSquare } from "lucide-react";
import { Booking, Client, Service, Staff } from "../types";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, "id"> & { id?: string }) => void;
  bookingToEdit?: Booking | null;
  clients: Client[];
  services: Service[];
  staff: Staff[];
  selectedBusinessId: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  bookingToEdit,
  clients,
  services,
  staff,
  selectedBusinessId
}: BookingModalProps) {
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("2026-07-12");
  const [time, setTime] = useState("12:00");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<"დასრულებული" | "მოლოდინში" | "გაუქმებული">("მოლოდინში");
  const [notes, setNotes] = useState("");

  // Update form fields if editing a booking
  useEffect(() => {
    if (bookingToEdit) {
      setClientId(bookingToEdit.clientId);
      setServiceId(bookingToEdit.serviceId);
      setStaffId(bookingToEdit.staffId);
      setDate(bookingToEdit.date);
      setTime(bookingToEdit.time);
      setPrice(bookingToEdit.price);
      setStatus(bookingToEdit.status);
      setNotes(bookingToEdit.notes || "");
    } else {
      // Set defaults for new booking
      setClientId(clients[0]?.id || "");
      setServiceId(services[0]?.id || "");
      setStaffId(staff[0]?.id || "");
      setDate("2026-07-12");
      setTime("12:00");
      setPrice(services[0]?.price || 0);
      setStatus("მოლოდინში");
      setNotes("");
    }
  }, [bookingToEdit, isOpen, clients, services, staff]);

  // Dynamically update default price when service changes (only for new bookings)
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setServiceId(sId);
    if (!bookingToEdit) {
      const selectedService = services.find(s => s.id === sId);
      if (selectedService) {
        setPrice(selectedService.price);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !serviceId || !staffId || !date || !time) {
      alert("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
      return;
    }

    onSave({
      ...(bookingToEdit && { id: bookingToEdit.id }),
      businessId: selectedBusinessId,
      clientId,
      serviceId,
      staffId,
      date,
      time,
      price: Number(price),
      status,
      notes: notes.trim() || undefined
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-250 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-xs text-slate-800">
              {bookingToEdit ? "ჯავშნის რედაქტირება" : "ახალი ჯავშნის გაფორმება"}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
              შეიყვანეთ დეტალები მომხმარებლის დასაჯავშნად
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Client Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                კლიენტი <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-800"
              >
                <option value="" disabled>აირჩიეთ კლიენტი</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                სერვისი <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={serviceId}
                onChange={handleServiceChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-800"
              >
                <option value="" disabled>აირჩიეთ მომსახურება</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.price}₾)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <UserSquare2 className="w-3.5 h-3.5 text-indigo-500" />
                თანამშრომელი <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs text-slate-800"
              >
                <option value="" disabled>აირჩიეთ თანამშრომელი</option>
                {staff.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Editable */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                ფასი (₾) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Date and Time Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                თარიღი <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                დრო <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 bg-white"
              />
            </div>
          </div>

          {/* Status Select (Only visible when editing or custom status needed) */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
              სტატუსი
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["მოლოდინში", "დასრულებული", "გაუქმებული"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 text-[11px] font-bold rounded-lg border transition-all duration-150 ${
                    status === s
                      ? s === "დასრულებული"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold"
                        : s === "გაუქმებული"
                        ? "bg-rose-50 border-rose-300 text-rose-700 font-extrabold"
                        : "bg-amber-50 border-amber-300 text-amber-700 font-extrabold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              კომენტარი / შენიშვნა
            </label>
            <textarea
              rows={3}
              placeholder="დაწერეთ დამატებითი დეტალები ჯავშნის შესახებ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-all font-semibold"
          >
            გაუქმება
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-bold"
          >
            {bookingToEdit ? "ცვლილების შენახვა" : "ჯავშნის გაფორმება"}
          </button>
        </div>
      </div>
    </div>
  );
}
