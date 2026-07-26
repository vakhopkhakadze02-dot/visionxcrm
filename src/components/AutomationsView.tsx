/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Zap, 
  Plus, 
  Play, 
  CheckCircle2, 
  Bot, 
  Mail, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  Settings2,
  Trash2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { WorkflowAutomation, Business } from "../types";
import ConfirmModal from "./ConfirmModal";

interface AutomationsViewProps {
  workflows: WorkflowAutomation[];
  selectedBusiness: Business;
  onAddWorkflow: (rule: Omit<WorkflowAutomation, "id" | "executionCount">) => void;
  onToggleWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunWorkflowTest: (id: string) => void;
}

export default function AutomationsView({
  workflows,
  selectedBusiness,
  onAddWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow,
  onRunWorkflowTest
}: AutomationsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowAutomation | null>(null);
  const [title, setTitle] = useState("");
  const [triggerEvent, setTriggerEvent] = useState<WorkflowAutomation["triggerEvent"]>("new_lead");
  const [actionType, setActionType] = useState<WorkflowAutomation["actionType"]>("send_sms");

  const triggerLabels: Record<WorkflowAutomation["triggerEvent"], string> = {
    new_lead: "ახალი ლიდის შემოსვლისას",
    status_change: "ლიდის სტატუსის შეცვლისას",
    overdue_task: "ვადაგადაცილებული დავალებისას",
    booking_created: "ახალი ჯავშნის დარეგისტრირებისას"
  };

  const actionLabels: Record<WorkflowAutomation["actionType"], string> = {
    send_sms: "ავტომატური SMS შეტყობინება",
    send_email: "ავტომატური Email მისალოცი",
    assign_staff: "ლიდის თანამშრომელზე გადანაწილება",
    create_followup: "Follow-up შეხსენების შექმნა 24სთ-ში"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddWorkflow({
      businessId: selectedBusiness.id,
      title,
      triggerEvent,
      triggerLabel: triggerLabels[triggerEvent],
      actionType,
      actionLabel: actionLabels[actionType],
      enabled: true
    });

    setTitle("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            ავტომატიზაციები & Workflow-ები
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
            დააყენეთ ავტომატური Follow-up წესები, SMS/Email ტრიგერები და ლიდების გადანაწილება
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ ახალი ავტომატიზაციის წესი</span>
        </button>
      </div>

      {/* Grid of Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
              wf.enabled
                ? "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                : "border-slate-200/60 dark:border-slate-800/60 opacity-60 bg-slate-50/50"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    wf.enabled ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                      {wf.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      შესრულებულია {wf.executionCount}-ჯერ
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleWorkflow(wf.id)}
                    className="cursor-pointer transition-transform active:scale-95"
                    title={wf.enabled ? "დეაქტივაცია" : "აქტივაცია"}
                  >
                    {wf.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setWorkflowToDelete(wf)}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-400 hover:text-rose-600 rounded cursor-pointer"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Trigger -> Action Box */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">როდის (Trigger):</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{wf.triggerLabel}</span>
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">რა მოხდეს (Action):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{wf.actionLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                wf.enabled 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                {wf.enabled ? "● აქტიურია" : "○ გამორთულია"}
              </span>

              <button
                onClick={() => onRunWorkflowTest(wf.id)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>ტესტირება</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-xs">
                <Zap className="w-4 h-4 text-amber-500" />
                ახალი ავტომატიზაციის წესის დამატება
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 dark:text-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  წესის დასახელება
                </label>
                <input
                  type="text"
                  required
                  placeholder="მაგ: მისალმების SMS ახალ ლიდს"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ტრიგერი (როდის?)
                </label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 font-semibold"
                >
                  <option value="new_lead">📥 ახალი ლიდის შემოსვლისას</option>
                  <option value="status_change">🔄 ლიდის სტატუსის შეცვლისას</option>
                  <option value="overdue_task">⚠️ ვადაგადაცილებული დავალებისას</option>
                  <option value="booking_created">📅 ახალი ჯავშნის დარეგისტრირებისას</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  მოქმედება (რა გაკეთდეს?)
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 font-semibold"
                >
                  <option value="send_sms">📱 ავტომატური SMS შეტყობინება</option>
                  <option value="send_email">📧 ავტომატური Email მისალოცი</option>
                  <option value="assign_staff">👤 ლიდის თანამშრომელზე გადანაწილება</option>
                  <option value="create_followup">⏰ Follow-up შეხსენების შექმნა 24სთ-ში</option>
                </select>
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
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={workflowToDelete !== null}
        onClose={() => setWorkflowToDelete(null)}
        onConfirm={() => {
          if (workflowToDelete) {
            onDeleteWorkflow(workflowToDelete.id);
          }
        }}
        title="ავტომატიზაციის წაშლა"
        message={workflowToDelete ? `ნამდვილად გსურთ ავტომატიზაციის (${workflowToDelete.title}) წაშლა?` : ""}
        confirmText="წაშლა"
        variant="danger"
      />
    </div>
  );
}
