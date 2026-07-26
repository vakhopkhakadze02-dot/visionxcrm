/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, User, Sparkles, UserSquare2, Calendar, Clock, DollarSign, Euro, MessageSquare } from "lucide-react";
import { Booking, Client, Service, Staff, formatPrice, CurrencyCode } from "../types";
import { minutesSinceMidnight } from "../dates";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Omit<Booking, "id"> & { id?: string }, shouldSendSms?: boolean) => void;
  onAddClient?: (client: Omit<Client, "id" | "totalBookings" | "totalSpent">) => Promise<Client>;
  bookingToEdit?: Booking | null;
  clients: Client[];
  services: Service[];
  /** Existing bookings, used to reject double-booking a staff member. */
  bookings: Booking[];
  staff: Staff[];
  selectedBusinessId: string;
  defaultDate?: string;
  currency?: CurrencyCode;
}

export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  onAddClient,
  bookingToEdit,
  clients,
  services,
  bookings,
  staff,
  selectedBusinessId,
  defaultDate,
  currency = "GEL"
}: BookingModalProps) {
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(defaultDate || "2026-07-12");
  const [time, setTime] = useState("12:00");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<"დასრულებული" | "მოლოდინში" | "გაუქმებული">("მოლოდინში");
  const [notes, setNotes] = useState("");
  const [sendSms, setSendSms] = useState(true);

  const selectedClient = clients.find(c => c.id === clientId);
  const clientPhone = selectedClient?.phone || "";

  // Quick Client Add states
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Populate the form when the modal opens, or when switching between add and
  // edit. Deliberately not keyed on clients/services/staff: those arrays change
  // identity whenever any record changes, and adding a client from inside this
  // modal used to re-run the effect and wipe everything just typed.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (bookingToEdit) {
      setClientId(bookingToEdit.clientId);
      setServiceId(bookingToEdit.serviceId);
      setStaffId(bookingToEdit.staffId);
      setDate(bookingToEdit.date);
      setTime(bookingToEdit.time);
      setPrice(bookingToEdit.price);
      setStatus(bookingToEdit.status);
      setNotes(bookingToEdit.notes || "");
      setSendSms(true);
      setShowQuickAdd(false);
    } else {
      // Set defaults for new booking
      setClientId(clients[0]?.id || "");
      setServiceId(services[0]?.id || "");
      setStaffId(staff[0]?.id || "");
      setDate(defaultDate || "2026-07-12");
      setTime("12:00");
      setPrice(services[0]?.price || 0);
      setStatus("მოლოდინში");
      setNotes("");
      setSendSms(true);
      setShowQuickAdd(false);
    }
  }, [bookingToEdit, isOpen, defaultDate]);

  const handleQuickAddClient = async () => {
    setError(null);
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setError("გთხოვთ მიუთითოთ კლიენტის სახელი და ტელეფონის ნომერი");
      return;
    }

    if (onAddClient) {
      try {
        const newlyCreated = await onAddClient({
          name: newClientName.trim(),
          phone: newClientPhone.trim(),
          email: "",
          notes: newClientNotes.trim() || undefined
        });
        
        if (newlyCreated && newlyCreated.id) {
          setClientId(newlyCreated.id);
          setShowQuickAdd(false);
          setNewClientName("");
          setNewClientPhone("");
          setNewClientNotes("");
          setError(null);
        }
      } catch (err) {
        console.error("Error during quick client creation:", err);
        setError("კლიენტის დამატება ვერ მოხერხდა");
      }
    }
  };

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

  /**
   * The booking that would overlap this one, if any.
   *
   * A slot runs from its start time for the service's duration, so two bookings
   * clash when those windows intersect for the same staff member on the same
   * day. Cancelled bookings are ignored, as is the booking being edited.
   */
  const conflictingBooking = (): Booking | null => {
    const start = minutesSinceMidnight(time);
    const duration = services.find(s => s.id === serviceId)?.duration ?? 0;
    if (start === null || duration <= 0) return null;
    const end = start + duration;

    return (
      bookings.find(b => {
        if (b.id === bookingToEdit?.id) return false;
        if (b.staffId !== staffId || b.date !== date) return false;
        if (b.status === "გაუქმებული") return false;

        const otherStart = minutesSinceMidnight(b.time);
        if (otherStart === null) return false;
        const otherDuration = services.find(s => s.id === b.serviceId)?.duration ?? 0;
        return otherStart < end && start < otherStart + otherDuration;
      }) ?? null
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clientId || !serviceId || !staffId || !date || !time) {
      setError("გთხოვთ შეავსოთ ყველა აუცილებელი ველი");
      return;
    }

    const clash = conflictingBooking();
    if (clash) {
      const staffName = staff.find(s => s.id === staffId)?.name || "თანამშრომელი";
      const clashClient = clients.find(c => c.id === clash.clientId)?.name || "სხვა კლიენტი";
      const clashService = services.find(s => s.id === clash.serviceId);
      setError(
        `${staffName} ამ დროს დაკავებულია: ${clash.time}${clashService ? ` (${clashService.duration} წუთი)` : ""} — ${clashClient}. აირჩიეთ სხვა დრო ან თანამშრომელი.`
      );
      return;
    }

    const selectedClient = clients.find(c => c.id === clientId);
    const clientPhone = selectedClient?.phone || "";

    let shouldTriggerSms = false;
    if (sendSms && clientPhone) {
      shouldTriggerSms = true;
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
    }, shouldTriggerSms);
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
        <form id="booking-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {/* Client Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  კლიენტი <span className="text-rose-500">*</span>
                </label>
                {onAddClient && !bookingToEdit && (
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {showQuickAdd ? "დახურვა" : "+ ახალი"}
                  </button>
                )}
              </div>
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
                    {s.name} ({formatPrice(s.price, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Client Add Panel */}
          {showQuickAdd && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3.5 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <h4 className="font-bold text-[11px] uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  ახალი კლიენტის სწრაფი შექმნა
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setNewClientName("");
                    setNewClientPhone("");
                    setNewClientNotes("");
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    სახელი და გვარი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={showQuickAdd}
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="მაგ: გიორგი კალანდაძე"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    ტელეფონის ნომერი <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required={showQuickAdd}
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="მაგ: 599 12 34 56"
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  კომენტარი / შენიშვნა
                </label>
                <textarea
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="მაგ: დამატებითი კომენტარი ან შენიშვნა"
                  rows={2}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAdd(false);
                    setNewClientName("");
                    setNewClientPhone("");
                    setNewClientNotes("");
                  }}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddClient}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  კლიენტის დამატება
                </button>
              </div>
            </div>
          )}

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
                {currency === "USD" ? (
                  <DollarSign className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : currency === "EUR" ? (
                  <Euro className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 text-indigo-500 font-bold leading-none select-none text-[13px] flex items-center justify-center shrink-0">₾</span>
                )}
                ფასი ({currency === "USD" ? "$" : currency === "EUR" ? "€" : "₾"}) <span className="text-rose-500">*</span>
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

          {/* Notification Checkbox */}
          <div className="p-3.5 bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100/60 dark:border-slate-800/80 rounded-xl flex items-start gap-3">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="send-sms-notification"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="h-4.5 w-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 rounded cursor-pointer bg-white"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="send-sms-notification" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1.5 flex-wrap">
                გაიგზავნოს შეტყობინება ნომერზე
                {clientPhone ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-extrabold bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-slate-800">
                    {clientPhone}
                  </span>
                ) : (
                  <span className="text-rose-500 font-bold text-[11px] bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/40">
                    ტელეფონი არ არის მითითებული
                  </span>
                )}
              </label>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                ჯავშნის შენახვისას სისტემა გკითხავთ დასტურს და გააგზავნის დეტალურ შეტყობინებას ამ ნომერზე.
              </p>
            </div>
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
            type="submit"
            form="booking-form"
            className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all font-bold"
          >
            {bookingToEdit ? "ცვლილების შენახვა" : "ჯავშნის გაფორმება"}
          </button>
        </div>
      </div>
    </div>
  );
}
