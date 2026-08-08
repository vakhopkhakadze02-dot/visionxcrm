/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Share2, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Calendar, 
  Mail, 
  MessageCircle, 
  Send, 
  CreditCard, 
  Facebook, 
  ExternalLink,
  Settings,
  RefreshCw
} from "lucide-react";
import { IntegrationConfig } from "../types";

interface IntegrationsViewProps {
  config: IntegrationConfig;
  onUpdateConfig: (updated: IntegrationConfig) => void;
}

export default function IntegrationsView({
  config,
  onUpdateConfig
}: IntegrationsViewProps) {
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Config Form Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");

  const handleToggle = (key: keyof IntegrationConfig) => {
    onUpdateConfig({
      ...config,
      [key]: !config[key]
    });
  };

  const handleTestConnection = (serviceName: string) => {
    setTestingService(serviceName);
    setTestSuccessMessage(null);
    setTimeout(() => {
      setTestingService(null);
      setTestSuccessMessage(`${serviceName}: სადემონსტრაციო შემოწმება. რეალური კავშირი ჯერ არ არის რეალიზებული — ეს ღილაკი ნამდვილ API-ს არ იძახებს.`);
      setTimeout(() => setTestSuccessMessage(null), 4000);
    }, 1200);
  };

  const handleSaveToken = (field: keyof IntegrationConfig) => {
    onUpdateConfig({
      ...config,
      [field]: tokenInput
    });
    setActiveModal(null);
    setTokenInput("");
  };

  const services = [
    {
      id: "facebookLeadAds",
      name: "Facebook Lead Ads",
      icon: Facebook,
      color: "bg-blue-600 text-white",
      desc: "ახალი ლიდების ავტომატური იმპორტი FB რეკლამებიდან რეალურ დროში",
      tokenField: "facebookPageToken" as keyof IntegrationConfig,
      enabled: config.facebookLeadAds,
      value: config.facebookPageToken || "EAACEdEose0c..."
    },
    {
      id: "whatsappBusiness",
      name: "WhatsApp Business API",
      icon: MessageCircle,
      color: "bg-emerald-600 text-white",
      desc: "ავტომატური WhatsApp შეტყობინებები, ჯავშნის დადასტურება & ჩატი",
      tokenField: "whatsappApiKey" as keyof IntegrationConfig,
      enabled: config.whatsappBusiness,
      value: config.whatsappApiKey || "+995 599 001 002"
    },
    {
      id: "gmailOutlook",
      name: "Gmail / Outlook Integration",
      icon: Mail,
      color: "bg-rose-600 text-white",
      desc: "სრული ელ-ფოსტის სინქრონიზაცია და ავტომატური Follow-up წერილები",
      tokenField: "gmailAddress" as keyof IntegrationConfig,
      enabled: config.gmailOutlook,
      value: config.gmailAddress || "info@visionx.ge"
    },
    {
      id: "googleCalendar",
      name: "Google Calendar Sync",
      icon: Calendar,
      color: "bg-indigo-600 text-white",
      desc: "შეხვედრებისა და ჯავშნების ორმხრივი სინქრონიზაცია Google Calendar-თან",
      tokenField: "googleCalendarEmail" as keyof IntegrationConfig,
      enabled: config.googleCalendar,
      value: config.googleCalendarEmail || "calendar@visionx.ge"
    },
    {
      id: "telegramBot",
      name: "Telegram Notification Bot",
      icon: Send,
      color: "bg-sky-500 text-white",
      desc: "მყისიერი შეტყობინებები ახალ ლიდებსა და დავალებებზე Telegram-ში",
      tokenField: "telegramBotToken" as keyof IntegrationConfig,
      enabled: config.telegramBot,
      value: config.telegramBotToken || "bot7482910384:AA..."
    },
    {
      id: "stripePayPal",
      name: "Stripe & PayPal Payments",
      icon: CreditCard,
      color: "bg-violet-600 text-white",
      desc: "ონლაინ გადახდის ბმულები, ინვოისების დაფარვა და ავტომატური ქვითრები",
      enabled: config.stripePayPal,
      value: "sk_live_51M..."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-500" />
            ინტეგრაციების ცენტრი (Integrations Hub)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
            დააკავშირეთ Facebook, WhatsApp, Gmail, Google Calendar, Telegram და Stripe
          </p>
        </div>
      </div>

      {testSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{testSuccessMessage}</span>
        </div>
      )}

      {/* Grid of Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => {
          const IconComp = srv.icon;
          return (
            <div
              key={srv.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-xs ${srv.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {srv.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${srv.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {srv.enabled ? "ჩართულია" : "გამორთულია"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={srv.enabled}
                      onChange={() => handleToggle(srv.id as keyof IntegrationConfig)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {srv.desc}
                </p>

                {srv.enabled && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[170px]">
                      {srv.value}
                    </span>
                    {srv.tokenField && (
                      <button
                        onClick={() => {
                          setActiveModal(srv.id);
                          setTokenInput(srv.value);
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Key className="w-3 h-3" />
                        კონფიგურაცია
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleTestConnection(srv.name)}
                  disabled={!srv.enabled || testingService === srv.name}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    srv.enabled
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${testingService === srv.name ? "animate-spin" : ""}`} />
                  <span>{testingService === srv.name ? "მოწმდება..." : "ტესტირება"}</span>
                </button>

                <span className="text-[10px] font-mono font-bold text-slate-400">
                  v2.4 API
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Config Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              API Key / Access Token-ის პარამეტრები
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              შეიყვანეთ თქვენი სერვისის API გასაღები ან ვებჰუკის მისამართი:
            </p>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="EAACEdEose0c..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3.5 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg font-semibold"
              >
                გაუქმება
              </button>
              <button
                onClick={() => {
                  const srv = services.find(s => s.id === activeModal);
                  if (srv && srv.tokenField) {
                    handleSaveToken(srv.tokenField);
                  }
                }}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
              >
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
