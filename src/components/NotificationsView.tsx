/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  Trash2,
  Settings,
  History,
  ShieldCheck
} from "lucide-react";
import { Booking, Client, Service, Staff, NotificationLog, NotificationSettings } from "../types";

interface NotificationsViewProps {
  bookings: Booking[];
  clients: Client[];
  services: Service[];
  staff: Staff[];
  selectedBusinessId: string;
  logs: NotificationLog[];
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => void;
  onClearLogs: () => void;
  onSendTestNotification: (logId: string) => Promise<boolean>;
}

export default function NotificationsView({
  bookings,
  clients,
  services,
  staff,
  selectedBusinessId,
  logs,
  settings,
  onSaveSettings,
  onClearLogs,
  onSendTestNotification
}: NotificationsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "settings">("logs");

  // Settings States
  const [smsEnabled, setSmsEnabled] = useState(settings.smsEnabled);
  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [smsTemplate, setSmsTemplate] = useState(settings.smsTemplate);
  const [emailTemplate, setEmailTemplate] = useState(settings.emailTemplate);

  // Keep state synced with props when settings change (e.g. business switched)
  useEffect(() => {
    setSmsEnabled(settings.smsEnabled);
    setEmailEnabled(settings.emailEnabled);
    setSmsTemplate(settings.smsTemplate);
    setEmailTemplate(settings.emailTemplate);
  }, [settings]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleSave = () => {
    onSaveSettings({
      smsEnabled,
      emailEnabled,
      smsTemplate,
      emailTemplate
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await onSendTestNotification(logId);
    } catch (e) {
      console.error(e);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: NotificationLog["status"]) => {
    switch (status) {
      case "გაგზავნილი":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            გაგზავნილი
          </span>
        );
      case "დემო_გაგზავნილი":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-full" title="ინტეგრაციის გასაღებები არ არის შეყვანილი, ამიტომ გაიგზავნა დემო რეჟიმში">
            <Info className="w-3.5 h-3.5" />
            დემო გაგზავნილი
          </span>
        );
      case "შეცდომა":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            შეცდომა
          </span>
        );
    }
  };

  const filteredLogs = logs.filter(l => l.businessId === selectedBusinessId);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            ავტომატური შეტყობინებები
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            მართეთ SMS და ელ-ფოსტის ავტომატური შეტყობინებები, რომლებიც მომენტალურად ეგზავნება კლიენტებს ჩაწერისას.
          </p>
        </div>

        {/* Sub-tabs toggler */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "logs"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            ლოგები და ისტორია
          </button>
          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "settings"
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            კონფიგურაცია
          </button>
        </div>
      </div>

      {activeSubTab === "logs" ? (
        <div className="space-y-4">
          {/* Top info and action */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              გაგზავნილი შეტყობინებების რეესტრი ({filteredLogs.length})
            </h3>
            {filteredLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ისტორიის გასუფთავება
              </button>
            )}
          </div>

          {/* Logs Table / List */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  ლოგები ჯერჯერობით ცარიელია
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  როდესაც კლიენტს ჩაწერთ რომელიმე სერვისზე, აქ მომენტალურად გამოჩნდება გაგზავნილი SMS-ის და Email-ის სტატუსი, დრო, ადრესატი და ტექსტის შინაარსი.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">ადრესატი</th>
                      <th className="py-3.5 px-4">მომსახურება</th>
                      <th className="py-3.5 px-4">ტიპი</th>
                      <th className="py-3.5 px-4">გაგზავნის დრო</th>
                      <th className="py-3.5 px-4">სტატუსი</th>
                      <th className="py-3.5 px-4">შეტყობინება</th>
                      <th className="py-3.5 px-4 text-right">მოქმედება</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {log.clientName}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              {log.type === "sms" ? (
                                <>
                                  <Phone className="w-2.5 h-2.5" />
                                  {log.clientPhone}
                                </>
                              ) : (
                                <>
                                  <Mail className="w-2.5 h-2.5" />
                                  {log.clientEmail || "ფოსტა არ არის"}
                                </>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-600 dark:text-slate-400">
                            {log.serviceName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {log.type === "sms" ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-1.5 py-0.5 rounded">
                              <MessageSquare className="w-3 h-3" />
                              SMS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded">
                              <Mail className="w-3 h-3" />
                              Email
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {log.sentAt}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(log.status)}
                          {log.errorMessage && (
                            <span className="block text-[10px] text-rose-500 mt-1 font-semibold max-w-[150px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate" title={log.message}>
                            {log.message}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {log.status === "შეცდომა" ? (
                            <button
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-white dark:text-indigo-400 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${retryingId === log.id ? "animate-spin" : ""}`} />
                              ხელახლა
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold flex items-center justify-end gap-1">
                              გაგზავნილია
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config column 1: Options & Templates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Toggle Panels */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                შეტყობინებების ჩართვა / გამორთვა
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {/* SMS Toggle */}
                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">SMS შეტყობინებები</span>
                      <input
                        type="checkbox"
                        checked={smsEnabled}
                        onChange={(e) => setSmsEnabled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      თითოეულ ახალ ჯავშანზე კლიენტი მომენტალურად მიიღებს SMS-ს მითითებულ ნომერზე.
                    </p>
                  </div>
                </div>

                {/* Email Toggle */}
                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Email შეტყობინებები</span>
                      <input
                        type="checkbox"
                        checked={emailEnabled}
                        onChange={(e) => setEmailEnabled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      ჯავშნის დადასტურების ელეგანტური წერილი გაიგზავნება კლიენტის ელ-ფოსტის მისამართზე.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Editors */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  შაბლონების რედაქტირება
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  დინამიური ტეგები
                </span>
              </div>

              {/* Tags info list */}
              <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{client_name}"}</code> - სახელი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{service_name}"}</code> - სერვისი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{date}"}</code> - თარიღი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{time}"}</code> - დრო</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{price}"}</code> - ფასი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{staff_name}"}</code> - სპეციალისტი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{notes}"}</code> - კომენტარი</div>
                <div><code className="bg-white dark:bg-slate-950 px-1 py-0.5 rounded border border-indigo-150/40 dark:border-slate-800">{"{business_name}"}</code> - ბიზნესი</div>
              </div>

              {/* SMS Template */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  SMS ტექსტის შაბლონი
                </label>
                <textarea
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                  disabled={!smsEnabled}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 disabled:opacity-50 resize-none font-medium"
                  placeholder="ჩაწერეთ SMS ტექსტი..."
                />
              </div>

              {/* Email Template */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email წერილის შაბლონი
                </label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  disabled={!emailEnabled}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 disabled:opacity-50 font-medium"
                  placeholder="ჩაწერეთ ელ-ფოსტის ტექსტი..."
                />
              </div>
            </div>

            {/* API Integration guides */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Info className="w-4 h-4 text-indigo-500" />
                შენიშვნა სადემონსტრაციო რეჟიმზე
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                თუ Twilio-ს ან EmailJS-ის კონფიგურაციას ცარიელს დატოვებთ, CRM მაინც სრულყოფილად იმუშავებს. შეტყობინებები გაიგზავნება <strong>სადემონსტრაციო (დემო) რეჟიმში</strong>: მომენტალურად გამოჩნდება ლამაზი საინფორმაციო ფანჯარა (Toast Banner) ეკრანზე მენეჯერისთვის, სადაც გამოჩნდება გაგზავნილი შეტყობინების სრული შინაარსი და ჩაიწერება ლოგების ისტორიაში!
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                რეალური SMS-ების და Email-ების გასაგზავნად, გასაღებები უნდა ჩაიწეროს სერვერზე (Supabase Secrets) — იხილეთ ინსტრუქცია მარჯვენა სვეტში.
              </p>
            </div>
          </div>

          {/* Config column 2: Delivery status */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                გაგზავნის კონფიგურაცია
              </h3>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-2">
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold leading-normal flex items-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Twilio-სა და EmailJS-ის გასაღებები ინახება სერვერზე და აღარ იწერება ბრაუზერში.</span>
                </p>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  SMS და ელ-ფოსტა იგზავნება Supabase Edge Function-ის (<code className="font-mono">send-notification</code>) მეშვეობით, რომელსაც მხოლოდ მას აქვს წვდომა საიდუმლო გასაღებებზე. ეს იცავს თქვენს Twilio ანგარიშს ბრაუზერიდან გასაღების მოპარვისგან.
                </p>
              </div>

              <div className="space-y-2.5 text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-200/50 dark:border-slate-800/50 pb-1">
                  როგორ ჩავრთოთ რეალური გაგზავნა?
                </span>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>დააინსტალირეთ ფუნქცია: <code className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded">supabase functions deploy send-notification</code></li>
                  <li>
                    ჩაწერეთ გასაღებები სერვერზე:
                    <code className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded block mt-1 whitespace-pre-wrap break-all">supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+1...</code>
                  </li>
                  <li>დეტალური ინსტრუქცია იხილეთ ფაილში <code className="font-mono">supabase/README.md</code></li>
                </ol>
                <p className="pt-1">
                  სანამ გასაღებები არ არის ჩაწერილი, შეტყობინებები მუშაობს <strong className="text-slate-800 dark:text-slate-200">სადემონსტრაციო რეჟიმში</strong> — ტექსტი ჩანს ეკრანზე და ინახება ლოგებში, მაგრამ კლიენტს არ ეგზავნება.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-[11px] text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Twilio-ს ხშირი შეცდომები
              </h4>
              <div className="text-[10.5px] text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">From ნომერი:</strong> უნდა იყოს Twilio-სგან შეძენილი ვირტუალური ნომერი (მაგ. +12055550100), და არა თქვენი პირადი ნომერი.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Trial ანგარიში:</strong> SMS იგზავნება მხოლოდ ვერიფიცირებულ ნომრებზე — Phone Numbers ➔ Manage ➔ Verified Caller IDs.
                </p>
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">"combination of To and From":</strong> ჩართეთ საქართველო — Messaging ➔ Settings ➔ Geo-Permissions ➔ Georgia ➔ Save.
                </p>
              </div>
            </div>


            {/* Save Buttons & Action */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSave}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                ცვლილებების შენახვა
              </button>
              
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-center text-xs font-bold animate-pulse">
                  პარამეტრები წარმატებით შეინახა!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
