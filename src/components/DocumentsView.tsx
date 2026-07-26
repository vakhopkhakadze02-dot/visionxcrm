/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  AlertCircle,
  Building,
  User,
  DollarSign,
  Send,
  Trash2,
  X
} from "lucide-react";
import { DocumentInvoice, Client, Business, formatPrice, CurrencyCode } from "../types";
import CurrencySelector from "./CurrencySelector";
import { toDateKey, dateKeyFromNow } from "../dates";
import ConfirmModal from "./ConfirmModal";

interface DocumentsViewProps {
  documents: DocumentInvoice[];
  clients: Client[];
  selectedBusiness: Business;
  onAddDocument: (doc: Omit<DocumentInvoice, "id" | "docNumber">) => void;
  onUpdateDocumentStatus: (id: string, status: DocumentInvoice["status"]) => void;
  onDeleteDocument: (id: string) => void;
}

export default function DocumentsView({
  documents,
  clients,
  selectedBusiness,
  onAddDocument,
  onUpdateDocumentStatus,
  onDeleteDocument
}: DocumentsViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "proposal" | "contract" | "invoice">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPrintDoc, setSelectedPrintDoc] = useState<DocumentInvoice | null>(null);

  // Form State
  const [clientId, setClientId] = useState("");
  const [docType, setDocType] = useState<"proposal" | "contract" | "invoice">("invoice");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [docCurrency, setDocCurrency] = useState<CurrencyCode>(selectedBusiness.currency || "GEL");
  const [docToDelete, setDocToDelete] = useState<DocumentInvoice | null>(null);
  const [items, setItems] = useState<{ name: string; qty: number; price: number }[]>([
    { name: "მომსახურების პაკეტი", qty: 1, price: 100 }
  ]);

  const filteredDocs = documents.filter(doc => {
    const matchesTab = activeTab === "all" || doc.docType === activeTab;
    const query = searchQuery.toLowerCase();
    const matchesSearch = doc.title.toLowerCase().includes(query) || 
      doc.clientName.toLowerCase().includes(query) ||
      doc.docNumber.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const handleAddItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    setItems(updated);
    // Recalculate total
    const total = updated.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
    setAmount(total);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    onAddDocument({
      businessId: selectedBusiness.id,
      clientId: client.id,
      clientName: client.name,
      docType,
      title: title || (docType === "invoice" ? "ინვოისი" : docType === "contract" ? "ხელშეკრულება" : "კომერციული შეთავაზება"),
      amount,
      date: toDateKey(),
      dueDate: dueDate || dateKeyFromNow(7),
      status: "გაგზავნილი",
      items,
      notes
    });

    setShowAddModal(false);
    setTitle("");
    setAmount(100);
    setNotes("");
    setItems([{ name: "მომსახურების პაკეტი", qty: 1, price: 100 }]);
  };

  const handlePrint = (doc: DocumentInvoice) => {
    setSelectedPrintDoc(doc);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            დოკუმენტები & ინვოისები
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
            შექმენით კომერციული შეთავაზებები, ხელშეკრულებები და ინვოისები PDF ექსპორტით
          </p>
        </div>
        <button
          onClick={() => {
            if (clients.length > 0) setClientId(clients[0].id);
            setShowAddModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ ახალი დოკუმენტი / ინვოისი</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            ყველა დოკუმენტი
          </button>
          <button
            onClick={() => setActiveTab("invoice")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "invoice"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            🧾 ინვოისები
          </button>
          <button
            onClick={() => setActiveTab("proposal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "proposal"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            📑 კომერციული შეთავაზებები
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              activeTab === "contract"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            📝 ხელშეკრულებები
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ძებნა (სათაური, კლიენტი, #)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
            დოკუმენტები ვერ მოიძებნა
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold px-3.5 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            + პირველი დოკუმენტის შექმნა
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">ნომერი</th>
                  <th className="p-3.5">ტიპი & სათაური</th>
                  <th className="p-3.5">კლიენტი</th>
                  <th className="p-3.5">თარიღი</th>
                  <th className="p-3.5 text-right">თანხა</th>
                  <th className="p-3.5 text-center">სტატუსი</th>
                  <th className="p-3.5 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-950/30 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {doc.docNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        {doc.docType === "invoice" ? "ინვოისი" : doc.docType === "contract" ? "ხელშეკრულება" : "შეთავაზება"}
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {doc.clientName}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {doc.date}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-slate-900 dark:text-slate-100 font-mono text-xs">
                      {formatPrice(doc.amount, selectedBusiness.currency)}
                    </td>
                    <td className="p-3.5 text-center">
                      <select
                        value={doc.status}
                        onChange={(e) => onUpdateDocumentStatus(doc.id, e.target.value as any)}
                        className={`text-[10px] font-extrabold px-2 py-1 rounded-md border cursor-pointer ${
                          doc.status === "გადახდილი"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                            : doc.status === "გაგზავნილი"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800"
                            : doc.status === "მოლოდინში"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
                        }`}
                      >
                        <option value="გაგზავნილი">გაგზავნილი</option>
                        <option value="გადახდილი">გადახდილი</option>
                        <option value="მოლოდინში">მოლოდინში</option>
                        <option value="გაუქმებული">გაუქმებული</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePrint(doc)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="ბეჭდვა / PDF ექსპორტი"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="წაშლა"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ახალი დოკუმენტი / ინვოისი
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 dark:text-slate-200 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  კლიენტი
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    დოკუმენტის ტიპი
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                  >
                    <option value="invoice">🧾 ინვოისი</option>
                    <option value="proposal">📑 კომერციული შეთავაზება</option>
                    <option value="contract">📝 ხელშეკრულება</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    სათაური
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: მომსახურების ინვოისი #102"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">მომსახურებები / პოზიციები</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    + პოზიციის დამატება
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="დასახელება"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="რაოდ"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                      className="w-16 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950 text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="ფასი"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                      className="w-20 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950 text-right font-mono"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs px-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ჯამური თანხა:</span>
                  <CurrencySelector 
                    currentCurrency={docCurrency} 
                    onSelectCurrency={setDocCurrency}
                    compact 
                  />
                </div>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {formatPrice(amount, docCurrency)}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  დამატებითი შენიშვნები / რეკვიზიტები
                </label>
                <textarea
                  rows={2}
                  placeholder="გადახდის ვადა, საბანკო რეკვიზიტები..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 dark:bg-slate-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg font-semibold"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  შექმნა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print View Container (Hidden except during window.print) */}
      {selectedPrintDoc && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-slate-900 font-sans z-[9999]">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedBusiness.name}</h1>
                <p className="text-xs text-slate-500">{selectedBusiness.address || "თბილისი, საქართველო"}</p>
                <p className="text-xs text-slate-500">{selectedBusiness.phone} | {selectedBusiness.email}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-extrabold uppercase tracking-wider text-indigo-600">
                  {selectedPrintDoc.docType === "invoice" ? "ინვოისი" : selectedPrintDoc.docType === "contract" ? "ხელშეკრულება" : "შეთავაზება"}
                </h2>
                <p className="text-xs font-mono font-bold text-slate-700">№ {selectedPrintDoc.docNumber}</p>
                <p className="text-xs text-slate-500">თარიღი: {selectedPrintDoc.date}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">მიმღები კლიენტი:</span>
              <p className="font-bold text-sm text-slate-900">{selectedPrintDoc.clientName}</p>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-2">აღწერა</th>
                  <th className="p-2 text-center">რაოდენობა</th>
                  <th className="p-2 text-right">ერთ. ფასი</th>
                  <th className="p-2 text-right">სულ</th>
                </tr>
              </thead>
              <tbody>
                {(selectedPrintDoc.items || [{ name: selectedPrintDoc.title, qty: 1, price: selectedPrintDoc.amount }]).map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-semibold">{it.name}</td>
                    <td className="p-2 text-center">{it.qty}</td>
                    <td className="p-2 text-right font-mono">{formatPrice(it.price, selectedBusiness.currency)}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatPrice(it.qty * it.price, selectedBusiness.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-xs text-slate-500">
                {selectedPrintDoc.notes && <p><b>შენიშვნა:</b> {selectedPrintDoc.notes}</p>}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-bold block">სულ გადასახდელი:</span>
                <span className="text-xl font-extrabold text-indigo-600 font-mono">
                  {formatPrice(selectedPrintDoc.amount, selectedBusiness.currency)}
                </span>
              </div>
            </div>

            <div className="pt-12 flex justify-between text-xs text-slate-400 border-t">
              <div>გამცემი: _________________</div>
              <div>მიმღები: _________________</div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={docToDelete !== null}
        onClose={() => setDocToDelete(null)}
        onConfirm={() => {
          if (docToDelete) {
            onDeleteDocument(docToDelete.id);
          }
        }}
        title="დოკუმენტის წაშლა"
        message={docToDelete ? `ნამდვილად გსურთ დოკუმენტის (${docToDelete.docNumber} — ${docToDelete.title}) წაშლა? ეს მოქმედება შეუქცევადია.` : ""}
        confirmText="წაშლა"
        variant="danger"
      />
    </div>
  );
}
