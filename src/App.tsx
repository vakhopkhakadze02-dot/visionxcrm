import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CalendarView from "./components/CalendarView";
import ClientsView from "./components/ClientsView";
import PipelineView from "./components/PipelineView";
import ServicesView from "./components/ServicesView";
import StaffView from "./components/StaffView";
import AnalyticsView from "./components/AnalyticsView";
import BookingModal from "./components/BookingModal";
import AuthView from "./components/AuthView";
import NotificationCenter from "./components/NotificationCenter";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { 
  Database, 
  AlertTriangle, 
  LogOut, 
  RefreshCw, 
  FileCode2, 
  Check, 
  CheckCircle,
  ShieldCheck,
  Copy, 
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";

import { 
  Business, 
  Client, 
  Service, 
  Staff, 
  Booking,
  NotificationLog,
  NotificationSettings,
  Followup,
  DocumentInvoice,
  WorkflowAutomation,
  IntegrationConfig,
  CurrencyCode
} from "./types";
import NotificationsView from "./components/NotificationsView";
import FollowupsView from "./components/FollowupsView";
import DocumentsView from "./components/DocumentsView";
import AutomationsView from "./components/AutomationsView";
import IntegrationsView from "./components/IntegrationsView";
import CurrencySelector from "./components/CurrencySelector";

import {
  initialBusinesses,
  initialClients,
  initialServices,
  initialStaff,
  initialBookings
} from "./initialData";

import {
  StorageScope,
  LOCAL_SCOPE,
  readScoped,
  writeScoped,
  clearScope
} from "./storage";
import { SETUP_SQL, TAG_MIGRATION_SQL } from "./dbSchema";

// --- DB DATA MAPPERS ---
const getBusinessCurrency = (scope: StorageScope, businessId: string): CurrencyCode => {
  const currencies = readScoped<Record<string, CurrencyCode>>(scope, "business_currencies", {});
  return currencies[businessId] || "GEL";
};

const mapBusinessFromDB = (b: any, scope: StorageScope): Business => {
  const currency = getBusinessCurrency(scope, b.id);
  return {
    id: b.id,
    name: b.name,
    ownerName: b.owner_name,
    role: b.role,
    phone: b.phone || "",
    email: b.email || "",
    address: b.address || "",
    category: b.category || "",
    logoColor: b.logo_color || "bg-indigo-600 text-white",
    currency
  };
};

const mapBusinessToDB = (b: Business, userId: string) => ({
  id: b.id,
  user_id: userId,
  name: b.name,
  owner_name: b.ownerName,
  role: b.role,
  phone: b.phone || null,
  email: b.email || null,
  address: b.address || null,
  category: b.category || null,
  logo_color: b.logoColor
});

const mapClientFromDB = (c: any): Client => ({
  id: c.id,
  name: c.name,
  phone: c.phone,
  email: c.email || "",
  company: c.company || "",
  source: c.source || undefined,
  leadValue: c.lead_value ? Number(c.lead_value) : undefined,
  assignedStaffId: c.assigned_staff_id || undefined,
  communications: Array.isArray(c.communications) ? c.communications : undefined,
  attachments: Array.isArray(c.attachments) ? c.attachments : undefined,
  notes: c.notes || "",
  totalBookings: 0,
  totalSpent: 0,
  tag: c.tag || undefined
});

const mapClientToDB = (c: Client, userId: string, businessId?: string) => ({
  id: c.id,
  user_id: userId,
  business_id: businessId || null,
  name: c.name,
  phone: c.phone,
  email: c.email || null,
  company: c.company || null,
  source: c.source || null,
  lead_value: c.leadValue || null,
  assigned_staff_id: c.assignedStaffId || null,
  communications: c.communications || null,
  attachments: c.attachments || null,
  notes: c.notes || null,
  tag: c.tag || null
});

const mapDocumentFromDB = (d: any): DocumentInvoice => ({
  id: d.id,
  businessId: d.business_id,
  clientId: d.client_id,
  clientName: d.client_name,
  docType: d.doc_type,
  docNumber: d.doc_number,
  title: d.title,
  amount: Number(d.amount),
  date: d.date,
  dueDate: d.due_date || undefined,
  status: d.status,
  items: Array.isArray(d.items) ? d.items : undefined,
  notes: d.notes || undefined
});

const mapDocumentToDB = (d: DocumentInvoice, userId: string) => ({
  id: d.id,
  user_id: userId,
  business_id: d.businessId,
  client_id: d.clientId,
  client_name: d.clientName,
  doc_type: d.docType,
  doc_number: d.docNumber,
  title: d.title,
  amount: d.amount,
  date: d.date,
  due_date: d.dueDate || null,
  status: d.status,
  items: d.items || null,
  notes: d.notes || null
});

const mapWorkflowFromDB = (w: any): WorkflowAutomation => ({
  id: w.id,
  businessId: w.business_id,
  title: w.title,
  triggerEvent: w.trigger_event,
  triggerLabel: w.trigger_label,
  actionType: w.action_type,
  actionLabel: w.action_label,
  enabled: w.enabled !== false,
  executionCount: Number(w.execution_count) || 0
});

const mapWorkflowToDB = (w: WorkflowAutomation, userId: string) => ({
  id: w.id,
  user_id: userId,
  business_id: w.businessId,
  title: w.title,
  trigger_event: w.triggerEvent,
  trigger_label: w.triggerLabel,
  action_type: w.actionType,
  action_label: w.actionLabel,
  enabled: w.enabled,
  execution_count: w.executionCount
});

const isSchemaCacheOrTagError = (err: any) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toString();
  return (
    code === "PGRST204" ||
    code === "42703" ||
    msg.includes("schema cache") ||
    msg.includes("column")
  );
};

/**
 * Client columns introduced after the original schema. On a project where the
 * newer migration has not been run, writing them fails the whole row — so the
 * write is retried without them and the core fields (name, phone, email, notes)
 * still save. The migration banner tells the user how to stop losing the rest.
 */
const CLIENT_COLUMNS_ADDED_LATER = [
  "tag",
  "business_id",
  "company",
  "source",
  "lead_value",
  "assigned_staff_id",
  "communications",
  "attachments"
] as const;

const stripNewerClientColumns = (payload: Record<string, any>): Record<string, any> => {
  const core = { ...payload };
  CLIENT_COLUMNS_ADDED_LATER.forEach(column => delete core[column]);
  return core;
};

const mapServiceFromDB = (s: any): Service => ({
  id: s.id,
  name: s.name,
  price: Number(s.price),
  duration: Number(s.duration),
  category: s.category,
  color: s.color || "blue"
});

const mapServiceToDB = (s: Service, userId: string) => ({
  id: s.id,
  user_id: userId,
  name: s.name,
  price: s.price,
  duration: s.duration,
  category: s.category,
  color: s.color
});

const mapStaffFromDB = (st: any): Staff => ({
  id: st.id,
  name: st.name,
  role: st.role,
  email: st.email || "",
  phone: st.phone || "",
  avatarColor: st.avatar_color || "bg-indigo-600 text-white",
  rating: Number(st.rating) || 5.0,
  status: (st.status === "აქტიური" || st.status === "შვებულებაში" ? st.status : "აქტიური") as "აქტიური" | "შვებულებაში"
});

const mapStaffToDB = (st: Staff, userId: string) => ({
  id: st.id,
  user_id: userId,
  name: st.name,
  role: st.role,
  email: st.email || null,
  phone: st.phone || null,
  avatar_color: st.avatarColor,
  rating: st.rating,
  status: st.status
});

const mapBookingFromDB = (bk: any): Booking => ({
  id: bk.id,
  businessId: bk.business_id,
  clientId: bk.client_id,
  serviceId: bk.service_id,
  staffId: bk.staff_id,
  date: bk.date,
  time: bk.time,
  price: Number(bk.price),
  status: (bk.status === "დასრულებული" || bk.status === "მოლოდინში" || bk.status === "გაუქმებული" ? bk.status : "მოლოდინში") as any,
  notes: bk.notes || ""
});

const mapBookingToDB = (bk: Booking, userId: string) => ({
  id: bk.id,
  user_id: userId,
  business_id: bk.businessId,
  client_id: bk.clientId,
  service_id: bk.serviceId,
  staff_id: bk.staffId,
  date: bk.date,
  time: bk.time,
  price: bk.price,
  status: bk.status,
  notes: bk.notes || null
});

const mapFollowupFromDB = (f: any): Followup => ({
  id: f.id,
  businessId: f.business_id,
  clientId: f.client_id || undefined,
  clientName: f.client_name,
  clientPhone: f.client_phone,
  date: f.date,
  time: f.time,
  type: f.type as "call" | "message",
  topic: f.topic,
  status: (f.status === "დასრულებული" || f.status === "მოლოდინში" || f.status === "გაუქმებული" ? f.status : "მოლოდინში") as any,
  notes: f.notes || ""
});

const mapFollowupToDB = (f: Followup, userId: string) => ({
  id: f.id,
  user_id: userId,
  business_id: f.businessId,
  client_id: f.clientId || null,
  client_name: f.clientName,
  client_phone: f.clientPhone,
  date: f.date,
  time: f.time,
  type: f.type,
  topic: f.topic,
  status: f.status,
  notes: f.notes || null
});

// --- NOTIFICATION DELIVERY ---

/** What the send-notification Edge Function reports back. */
interface DeliveryResult {
  status: "sent" | "demo" | "error";
  message?: string;
}

const DELIVERY_STATUS_LABEL: Record<DeliveryResult["status"], NotificationLog["status"]> = {
  sent: "გაგზავნილი",
  demo: "დემო_გაგზავნილი",
  error: "შეცდომა"
};

// --- DEFAULTS ---

const LOADING_BUSINESS: Business = {
  id: "bus_loading",
  name: "იტვირთება...",
  ownerName: "...",
  role: "მფლობელი",
  logoColor: "bg-slate-300"
};

const LOCAL_BUSINESS: Business = {
  id: "bus_local",
  name: "ლოკალური ბიზნესი",
  ownerName: "სტუმარი",
  role: "მფლობელი",
  logoColor: "bg-indigo-600 text-white"
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  smsEnabled: true,
  emailEnabled: true,
  smsTemplate: `გამარჯობა {client_name}, თქვენ წარმატებით ჩაეწერეთ სერვისზე: "{service_name}". თარიღი: {date}, დრო: {time}. ფასი: {price} ₾. სპეციალისტი: {staff_name}. მადლობა რომ ირჩევთ ჩვენს სერვისს!`,
  emailTemplate: `გამარჯობა {client_name},\n\nთქვენ წარმატებით დარეგისტრირდით სერვისზე: "{service_name}".\n\nჯავშნის დეტალები:\n- თარიღი: {date}\n- დრო: {time}\n- სპეციალისტი: {staff_name}\n- მომსახურების ფასი: {price} ₾\n- დამატებითი კომენტარი: {notes}\n\nგელოდებით სიყვარულით!\n{business_name}`
};

/**
 * Older builds kept Twilio/EmailJS credentials in this blob. They are dropped on
 * read (and overwritten on the next save) now that delivery is server-side.
 */
const loadNotificationSettings = (scope: StorageScope): NotificationSettings => {
  const saved = readScoped<Partial<NotificationSettings> | null>(scope, "notification_settings", null);
  if (!saved) return DEFAULT_NOTIFICATION_SETTINGS;
  return {
    smsEnabled: saved.smsEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.smsEnabled,
    emailEnabled: saved.emailEnabled ?? DEFAULT_NOTIFICATION_SETTINGS.emailEnabled,
    smsTemplate: saved.smsTemplate || DEFAULT_NOTIFICATION_SETTINGS.smsTemplate,
    emailTemplate: saved.emailTemplate || DEFAULT_NOTIFICATION_SETTINGS.emailTemplate
  };
};

const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  facebookLeadAds: true,
  whatsappBusiness: true,
  gmailOutlook: true,
  googleCalendar: true,
  telegramBot: false,
  stripePayPal: false,
  facebookPageToken: "EAAB...mock_page_access_token",
  whatsappApiKey: "wa_biz_key_88912",
  gmailAddress: "office@company.ge",
  googleCalendarEmail: "calendar@company.ge",
  telegramBotToken: ""
};

const DEMO_DOCUMENTS: DocumentInvoice[] = [
  {
    id: "doc_101",
    businessId: "bus_1",
    clientId: "cli_1",
    clientName: "გიორგი ბერიძე",
    docType: "invoice",
    docNumber: "INV-2026-001",
    title: "მარკეტინგული მომსახურების ინვოისი",
    amount: 450,
    date: "2026-07-10",
    dueDate: "2026-07-20",
    status: "გადახდილი",
    notes: "გადახდილია საბანკო გადარიცხვით"
  }
];

const DEMO_WORKFLOWS: WorkflowAutomation[] = [
  {
    id: "wf_1",
    businessId: "bus_1",
    title: "ახალ ლიდზე SMS შეტყობინება",
    triggerEvent: "new_lead",
    triggerLabel: "ახალი ლიდის რეგისტრაცია",
    actionType: "send_sms",
    actionLabel: "მისალმების SMS-ის გაგზავნა",
    enabled: true,
    executionCount: 14
  },
  {
    id: "wf_2",
    businessId: "bus_1",
    title: "ჯავშნის შეხსენება",
    triggerEvent: "booking_created",
    triggerLabel: "ახალი ჯავშნის შექმნა",
    actionType: "send_email",
    actionLabel: "დასტურის ელ-ფოსტის გაგზავნა",
    enabled: true,
    executionCount: 28
  }
];

const demoFollowups = (businessId: string): Followup[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  return [
    {
      id: "initial_f1",
      businessId,
      clientName: "მარიამ ბერიძე",
      clientPhone: "599123456",
      date: tomorrowStr,
      time: "11:30",
      type: "call",
      topic: "ხვალ გასაწევ მომსახურებაზე დადასტურება",
      status: "მოლოდინში",
      notes: "სთხოვა რომ ზუსტად 11:30-ზე დავურეკოთ"
    },
    {
      id: "initial_f2",
      businessId,
      clientName: "ლევან კალანდაძე",
      clientPhone: "555987654",
      date: tomorrowStr,
      time: "15:00",
      type: "message",
      topic: "შემდეგი ვიზიტის შეთავაზება",
      status: "მოლოდინში",
      notes: "WhatsApp-ით გაგზავნა"
    }
  ];
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("vxcrm_theme");
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("vxcrm_theme", theme);
  }, [theme]);

  // Supabase auth and state synchronization
  const [session, setSession] = useState<any>(null);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    if (!isSupabaseConfigured) return true;
    const saved = localStorage.getItem("vxcrm_local_mode");
    return saved === "true";
  });

  const [hasChosenLocal, setHasChosenLocal] = useState<boolean>(() => {
    return localStorage.getItem("vxcrm_local_mode") === "true";
  });

  const [supabaseFetchError, setSupabaseFetchError] = useState<any>(null);
  const [showDbGuide, setShowDbGuide] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showDbMigrationWarning, setShowDbMigrationWarning] = useState<boolean>(false);
  const [dbErrorDetail, setDbErrorDetail] = useState<string | null>(null);
  const [migrationCopied, setMigrationCopied] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "migrating" | "success" | "auto_handled">("idle");
  const [lastMigrationTime, setLastMigrationTime] = useState<string | null>(null);

  /**
   * Checks whether the schema is up to date.
   *
   * The app deliberately does not run DDL. Doing that from the browser needs a
   * SQL-executing RPC in the database, which anyone holding the public anon key
   * could then call to run arbitrary statements. Missing columns surface as a
   * banner with the SQL to run instead, and writes keep working meanwhile via
   * the tag-less fallbacks below.
   */
  const verifyDatabaseSchema = async (): Promise<boolean> => {
    setMigrationStatus("migrating");

    const { error } = await supabase.from("clients").select("tag").limit(1);

    if (!error) {
      setMigrationStatus("success");
      setLastMigrationTime(new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }));
      setShowDbMigrationWarning(false);
      setDbErrorDetail(null);
      return true;
    }

    console.warn("Database schema is out of date:", error);
    setMigrationStatus("auto_handled");
    setLastMigrationTime(new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" }));
    setDbErrorDetail(error.message || JSON.stringify(error));
    setShowDbMigrationWarning(true);
    return false;
  };

  /**
   * Which slice of localStorage this session may touch: one signed-in account,
   * or the shared local (no account) workspace. Null until auth resolves, which
   * is why state below starts empty and is hydrated once the scope is known —
   * otherwise the previous user's data would flash up for the next one.
   */
  const [scope, setScope] = useState<StorageScope | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /** Bumped to force a re-hydrate when the scope object itself is unchanged. */
  const [hydrationNonce, setHydrationNonce] = useState(0);

  const isLocalScope = scope?.kind === "local";
  const canPersist = scope !== null && hydrated;

  // State lists
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>(LOADING_BUSINESS);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [documents, setDocuments] = useState<DocumentInvoice[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(DEFAULT_INTEGRATION_CONFIG);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Resolve the storage scope from the auth state.
  useEffect(() => {
    if (session?.user?.id && !isLocalMode) {
      const userId = session.user.id;
      setScope(prev => (prev?.kind === "user" && prev.userId === userId ? prev : { kind: "user", userId }));
    } else if (isLocalMode) {
      setScope(prev => (prev?.kind === "local" ? prev : LOCAL_SCOPE));
    }
  }, [session, isLocalMode]);

  // Load everything belonging to the resolved scope.
  useEffect(() => {
    if (!scope) return;
    setHydrated(false);

    const local = scope.kind === "local";

    // Still device-only: integration config and the delivery log. Cached per
    // scope so accounts sharing a browser never see each other's message
    // history, and cleared on sign-out.
    setIntegrationConfig(readScoped(scope, "integration_config", DEFAULT_INTEGRATION_CONFIG));
    setNotificationSettings(loadNotificationSettings(scope));
    setNotificationLogs(readScoped(scope, "notification_logs", []));

    if (local) {
      const startEmpty = localStorage.getItem("vxcrm_start_empty") === "true";
      const withCurrency = (b: Business) => ({ ...b, currency: b.currency || getBusinessCurrency(scope, b.id) });

      const loadedBusinesses = readScoped<Business[]>(scope, "businesses", startEmpty ? [LOCAL_BUSINESS] : initialBusinesses).map(withCurrency);
      setBusinesses(loadedBusinesses);
      setSelectedBusiness(withCurrency(readScoped<Business>(scope, "selected_business", loadedBusinesses[0] || LOCAL_BUSINESS)));
      setClients(readScoped(scope, "clients", startEmpty ? [] : initialClients));
      setServices(readScoped(scope, "services", startEmpty ? [] : initialServices));
      setStaff(readScoped(scope, "staff", startEmpty ? [] : initialStaff));
      setBookings(readScoped(scope, "bookings", startEmpty ? [] : initialBookings));
      setFollowups(readScoped(scope, "followups", startEmpty ? [] : demoFollowups(loadedBusinesses[0]?.id || LOCAL_BUSINESS.id)));
      setDocuments(readScoped(scope, "documents", startEmpty ? [] : DEMO_DOCUMENTS));
      setWorkflows(readScoped(scope, "workflows", startEmpty ? [] : DEMO_WORKFLOWS));
    } else {
      // Cloud scope: the database is the record, so nothing here is written to
      // disk. Anything left over from a previous scope is dropped immediately
      // rather than shown until fetchUserData replaces it.
      setBusinesses([]);
      setSelectedBusiness(LOADING_BUSINESS);
      setClients([]);
      setServices([]);
      setStaff([]);
      setBookings([]);
      setFollowups([]);
      setDocuments([]);
      setWorkflows([]);
    }

    setHydrated(true);
  }, [scope, hydrationNonce]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "documents", documents);
  }, [documents, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "workflows", workflows);
  }, [workflows, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist) writeScoped(scope!, "integration_config", integrationConfig);
  }, [integrationConfig, canPersist, scope]);

  useEffect(() => {
    if (canPersist) writeScoped(scope!, "notification_settings", notificationSettings);
  }, [notificationSettings, canPersist, scope]);

  useEffect(() => {
    if (canPersist) writeScoped(scope!, "notification_logs", notificationLogs);
  }, [notificationLogs, canPersist, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "followups", followups);
  }, [followups, canPersist, isLocalScope, scope]);

  // Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [bookingDefaultDate, setBookingDefaultDate] = useState<string>("2026-07-12");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sync session and auth states
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // If Supabase not configured, load local data directly
      handleContinueLocal(localStorage.getItem("vxcrm_start_empty") === "true");
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        setIsLocalMode(false);
        setHasChosenLocal(false);
        localStorage.setItem("vxcrm_local_mode", "false");
      } else {
        if (hasChosenLocal) {
          handleContinueLocal(localStorage.getItem("vxcrm_start_empty") === "true");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        setIsLocalMode(false);
        setHasChosenLocal(false);
        localStorage.setItem("vxcrm_local_mode", "false");
      } else {
        // Sign out / no session
        if (hasChosenLocal) {
          setIsLocalMode(true);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [hasChosenLocal]);

  // Fetch from Supabase when session becomes active
  useEffect(() => {
    if (session?.user?.id && !isLocalMode) {
      fetchUserData(session.user.id);
    }
  }, [session, isLocalMode]);

  // Entity caches are written for local mode only — in cloud mode the database
  // is the record and nothing sensitive is left behind on the device.
  useEffect(() => {
    if (canPersist && isLocalScope && businesses.length > 0) {
      writeScoped(scope!, "businesses", businesses);
    }
  }, [businesses, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope && selectedBusiness.id !== LOADING_BUSINESS.id) {
      writeScoped(scope!, "selected_business", selectedBusiness);
    }
  }, [selectedBusiness, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "clients", clients);
  }, [clients, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "services", services);
  }, [services, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "staff", staff);
  }, [staff, canPersist, isLocalScope, scope]);

  useEffect(() => {
    if (canPersist && isLocalScope) writeScoped(scope!, "bookings", bookings);
  }, [bookings, canPersist, isLocalScope, scope]);

  // Load and fetch cloud database
  const fetchUserData = async (userId: string) => {
    try {
      setSupabaseFetchError(null);
      const [busRes, cliRes, serRes, stfRes, bokRes] = await Promise.all([
        supabase.from("businesses").select("*").eq("user_id", userId),
        supabase.from("clients").select("*").eq("user_id", userId),
        supabase.from("services").select("*").eq("user_id", userId),
        supabase.from("staff").select("*").eq("user_id", userId),
        supabase.from("bookings").select("*").eq("user_id", userId)
      ]);

      if (busRes.error) throw busRes.error;
      if (cliRes.error) throw cliRes.error;
      if (serRes.error) throw serRes.error;
      if (stfRes.error) throw stfRes.error;
      if (bokRes.error) throw bokRes.error;

      const dataScope: StorageScope = { kind: "user", userId };

      let loadedBusinesses = busRes.data.map((b: any) => mapBusinessFromDB(b, dataScope));
      const loadedClients = cliRes.data.map(mapClientFromDB);
      const loadedServices = serRes.data.map(mapServiceFromDB);
      const loadedStaff = stfRes.data.map(mapStaffFromDB);
      const loadedBookings = bokRes.data.map(mapBookingFromDB);

      // Tables added in later migrations. Fetched leniently so an account still
      // loads on a project where the newer SQL has not been run yet — the
      // migration banner tells the user what to run.
      const fetchOptional = async <T,>(table: string, map: (row: any) => T): Promise<T[]> => {
        try {
          const res = await supabase.from(table).select("*").eq("user_id", userId);
          if (res.error) {
            console.warn(`Could not load "${table}":`, res.error);
            return [];
          }
          return res.data.map(map);
        } catch (err) {
          console.warn(`Could not load "${table}":`, err);
          return [];
        }
      };

      const [loadedFollowups, loadedDocuments, loadedWorkflows] = await Promise.all([
        fetchOptional("followups", mapFollowupFromDB),
        fetchOptional("documents", mapDocumentFromDB),
        fetchOptional("workflows", mapWorkflowFromDB)
      ]);

      await verifyDatabaseSchema();

      // Create the account's first business if it has none. This is the only
      // thing ever written on the user's behalf: clients, services, staff and
      // bookings stay exactly as the user left them, including empty. (Earlier
      // builds re-seeded demo records into any empty table, which silently
      // resurrected deleted data on every reload.)
      if (loadedBusinesses.length === 0) {
        const metadata = session?.user?.user_metadata || {};
        const defaultBus: Business = {
          id: `bus_${Date.now()}`,
          name: metadata.business_name || "ჩემი ბიზნესი",
          ownerName: metadata.owner_name || "მფლობელი",
          role: "მფლობელი",
          logoColor: "bg-indigo-600 text-white",
          category: "სალონი"
        };
        const { error: busInsertErr } = await supabase
          .from("businesses")
          .insert(mapBusinessToDB(defaultBus, userId));
        if (busInsertErr) throw busInsertErr;
        loadedBusinesses = [defaultBus];
      }

      setBusinesses(loadedBusinesses);
      setClients(loadedClients);
      setServices(loadedServices);
      setStaff(loadedStaff);
      setBookings(loadedBookings);
      setFollowups(loadedFollowups);
      setDocuments(loadedDocuments);
      setWorkflows(loadedWorkflows);
      if (loadedBusinesses.length > 0) {
        setSelectedBusiness(loadedBusinesses[0]);
      }
    } catch (err: any) {
      console.warn("Error fetching user data from Supabase:", err);
      setSupabaseFetchError(err);
    }
  };

  /**
   * Uploads the local-mode workspace into the signed-in account, on request.
   *
   * This is the deliberate replacement for the old automatic seeding: nothing
   * moves to the cloud unless the user asks for it. Rows are upserted by id, so
   * running it twice is harmless.
   */
  const handleUploadLocalData = async () => {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    const localClients = readScoped<Client[]>(LOCAL_SCOPE, "clients", []);
    const localServices = readScoped<Service[]>(LOCAL_SCOPE, "services", []);
    const localStaff = readScoped<Staff[]>(LOCAL_SCOPE, "staff", []);
    const localBookings = readScoped<Booking[]>(LOCAL_SCOPE, "bookings", []);
    const localFollowups = readScoped<Followup[]>(LOCAL_SCOPE, "followups", []);
    const localDocuments = readScoped<DocumentInvoice[]>(LOCAL_SCOPE, "documents", []);
    const localWorkflows = readScoped<WorkflowAutomation[]>(LOCAL_SCOPE, "workflows", []);

    const totalRows =
      localClients.length + localServices.length + localStaff.length +
      localBookings.length + localFollowups.length +
      localDocuments.length + localWorkflows.length;

    if (totalRows === 0) {
      showDemoToast("მონაცემები ცარიელია", "Supabase", "ლოკალურ რეჟიმში ასატვირთი მონაცემები ვერ მოიძებნა.");
      return;
    }

    showDemoToast("სინქრონიზაცია...", "Supabase Sync", "მიმდინარეობს ლოკალური მონაცემების ატვირთვა Supabase-ში...");

    const failures: string[] = [];

    const upsert = async (table: string, rows: any[], label: string) => {
      if (rows.length === 0) return;
      const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
      if (error) failures.push(`${label}: ${error.message || JSON.stringify(error)}`);
    };

    // Clients first — the tag column may be missing on older projects.
    if (localClients.length > 0) {
      const rows = localClients.map(c => mapClientToDB(c, userId, selectedBusiness.id));
      let { error } = await supabase.from("clients").upsert(rows, { onConflict: "id" });

      if (error && isSchemaCacheOrTagError(error)) {
        console.warn("Retrying client upload with core columns only:", error);
        const coreRows = rows.map(stripNewerClientColumns);
        error = (await supabase.from("clients").upsert(coreRows, { onConflict: "id" })).error;
      }
      if (error) failures.push(`კლიენტები: ${error.message || JSON.stringify(error)}`);
    }

    await upsert("services", localServices.map(s => mapServiceToDB(s, userId)), "სერვისები");
    await upsert("staff", localStaff.map(s => mapStaffToDB(s, userId)), "თანამშრომლები");
    await upsert("bookings", localBookings.map(b => mapBookingToDB(b, userId)), "ჯავშნები");
    await upsert("followups", localFollowups.map(f => mapFollowupToDB(f, userId)), "შეხსენებები");
    await upsert("documents", localDocuments.map(d => mapDocumentToDB(d, userId)), "დოკუმენტები");
    await upsert("workflows", localWorkflows.map(w => mapWorkflowToDB(w, userId)), "ავტომატიზაციები");

    await fetchUserData(userId);

    if (failures.length === 0) {
      showDemoToast(
        "სინქრონიზაცია დასრულდა!",
        "ლოკალური მონაცემების ატვირთვა",
        `წარმატებით აიტვირთა ${totalRows} ჩანაწერი თქვენს ანგარიშში.`
      );
    } else {
      showDemoToast(
        "სინქრონიზაცია ნაწილობრივ შესრულდა",
        "Supabase",
        `ზოგიერთი ჩანაწერი ვერ აიტვირთა — ${failures.join("; ")}`
      );
    }
  };

  const handleVerifyMigration = async () => {
    if (!session?.user?.id) return;
    const ok = await verifyDatabaseSchema();
    if (ok) {
      await fetchUserData(session.user.id);
      showDemoToast("ბაზა განახლდა!", "მიგრაცია წარმატებულია", "კავშირი აღდგენილია და ახალი სვეტი აქტიურია.");
    } else {
      showDemoToast(
        "კავშირი ვერ დამყარდა",
        "მიგრაცია",
        `ბაზა კვლავ აბრუნებს შეცდომას. გაუშვით მითითებული SQL კოდი Supabase SQL Editor-ში.`
      );
    }
  };

  /**
   * Switches to the local workspace. State itself is loaded by the hydration
   * effect, so this only records the choice.
   *
   * `isExplicitChoice` marks the user actively picking a starting point on the
   * auth screen. Resuming an existing local session must never reach the reset
   * branch, or every page load would wipe the workspace.
   */
  const handleContinueLocal = (startEmpty: boolean, isExplicitChoice: boolean = false) => {
    localStorage.setItem("vxcrm_local_mode", "true");

    if (isExplicitChoice) {
      localStorage.setItem("vxcrm_start_empty", startEmpty ? "true" : "false");

      if (startEmpty) {
        clearScope(LOCAL_SCOPE);
        writeScoped(LOCAL_SCOPE, "businesses", [LOCAL_BUSINESS]);
        writeScoped(LOCAL_SCOPE, "selected_business", LOCAL_BUSINESS);
      }
    }

    setIsLocalMode(true);
    setScope(LOCAL_SCOPE);
    setHydrationNonce(n => n + 1);
  };

  const [demoToast, setDemoToast] = useState<{ title: string; recipient: string; message: string } | null>(null);

  /** Cloud writes that failed this session — surfaced in the sync header. */
  const [syncFailures, setSyncFailures] = useState<
    { id: string; label: string; message: string; at: string }[]
  >([]);

  const showDemoToast = (title: string, recipient: string, message: string) => {
    setDemoToast({ title, recipient, message });
    // Play notification sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  /**
   * Runs one cloud mutation and makes any failure visible.
   *
   * Local state is still updated optimistically by the callers, so a failed
   * write leaves the screen showing something the database does not have. That
   * divergence used to be invisible — a console.warn and nothing else. Every
   * failure now raises a toast and adds to the banner in the sync header, which
   * stays up until the user reloads from the cloud or dismisses it.
   *
   * Returns true when the write landed (or when there is nothing to sync).
   */
  const recordSyncFailure = (label: string, err: any) => {
    const message = err?.message || JSON.stringify(err);
    console.warn(`Cloud sync failed (${label}):`, err);

    setSyncFailures(prev => [
      ...prev,
      {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        label,
        message,
        at: new Date().toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    showDemoToast("ღრუბელში შენახვა ვერ მოხერხდა", label, message);
  };

  const syncToCloud = async (
    label: string,
    run: () => PromiseLike<{ error: any }>
  ): Promise<boolean> => {
    if (isLocalMode || !session?.user?.id) return true;

    try {
      const { error } = await run();
      if (error) throw error;
      return true;
    } catch (err: any) {
      recordSyncFailure(label, err);
      return false;
    }
  };

  const enhanceErrorMessage = (msg: string): string => {
    if (msg.includes("combination of 'To'") || msg.includes("combination of To and From") || msg.includes("combination of") && msg.includes("To") && msg.includes("From")) {
      return `${msg} (მინიშნება: Twilio ბლოკავს აშშ-ს ნომრიდან საქართველოში (+995) SMS-ის გაგზავნას, რადგან ნაგულისხმევად საერთაშორისო გეო-ნებართვები გათიშულია. გადადით თქვენს Twilio-ს პანელში: Console ➔ Messaging ➔ Settings ➔ Geo-Permissions, მოძებნეთ ქვეყანა "Georgia", მონიშნეთ ის და დააჭირეთ შენახვას (Save). ამის შემდეგ SMS წარმატებით გამოიგზავნება!).`;
    }
    if (msg.includes("unverified") || msg.includes("Trial accounts cannot send messages") || msg.includes("verify") && msg.includes("verified")) {
      return `${msg} (მინიშნება: Twilio-ს უფასო (Trial) ანგარიშიდან SMS-ის გაგზავნა შეგიძლიათ მხოლოდ თქვენსავე ვერიფიცირებულ ნომერზე (მაგალითად, იმ ნომერზე, რომლითაც Twilio-ზე დარეგისტრირდით). სხვის ნომერზე გასაგზავნად საჭიროა Twilio-ს ბალანსის შევსება და ანგარიშის განახლება (Upgrade), ან კონკრეტული მიმღები ნომრის წინასწარ ვერიფიკაცია Twilio-ს პანელში: twilio.com/user/account/phone-numbers/verified).`;
    }
    if (msg.includes("is not a Twilio phone number") || msg.includes("not a valid phone number") || msg.includes("Twilio phone number") || msg.includes("country mismatch")) {
      return `${msg} (მინიშნება: გამგზავნის (From) ნომერი უნდა იყოს Twilio-სგან შეძენილი ვირტუალური ნომერი, მაგ. +12055550100 ან ალფანუმერული ID. თქვენი პირადი მობილური ნომერი არ გამოდგება, რადგან Twilio-ს არ აქვს უფლება მის სახელით გაგზავნოს შეტყობინება).`;
    }
    if (msg.includes("authenticate") || msg.includes("Credentials") || msg.includes("Account SID") || msg.includes("Auth Token") || msg.includes("Unauthorized")) {
      return `${msg} (მინიშნება: გთხოვთ შეამოწმოთ Twilio SID და Auth Token, შეყვანილი გასაღებები არასწორია).`;
    }
    return msg;
  };

  /**
   * Hands a message to the send-notification Edge Function, which owns the
   * Twilio/EmailJS credentials. Nothing sensitive is held in the browser, and
   * without a signed-in session (or with no provider secrets set) delivery
   * degrades to demo mode instead of failing.
   */
  const deliverNotification = async (
    channel: "sms" | "email",
    to: string,
    body: string,
    templateParams?: Record<string, string>
  ): Promise<DeliveryResult> => {
    if (!isSupabaseConfigured || isLocalMode || !session) {
      return { status: "demo" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { channel, to, body, templateParams }
      });

      if (error) {
        console.error(`${channel} delivery failed:`, error);
        return { status: "error", message: error.message || "Edge Function-თან კავშირი ვერ დამყარდა" };
      }

      const result = data as DeliveryResult | null;
      if (!result || !result.status) {
        return { status: "error", message: "შეტყობინების სერვისმა დააბრუნა მოულოდნელი პასუხი" };
      }
      return result;
    } catch (err: any) {
      console.error(`${channel} delivery failed:`, err);
      return { status: "error", message: err?.message || "უცნობი შეცდომა გაგზავნისას" };
    }
  };

  const sendBookingNotifications = async (booking: Booking, isNew: boolean = true, forceSendSms?: boolean) => {
    const client = clients.find(c => c.id === booking.clientId);
    const service = services.find(s => s.id === booking.serviceId);
    const staffMember = staff.find(st => st.id === booking.staffId);
    
    if (!client) return;

    const formatMessage = (template: string) => {
      return template
        .replace(/{client_name}/g, client.name || "")
        .replace(/{service_name}/g, service?.name || "")
        .replace(/{date}/g, booking.date || "")
        .replace(/{time}/g, booking.time || "")
        .replace(/{price}/g, String(booking.price || ""))
        .replace(/{staff_name}/g, staffMember?.name || "")
        .replace(/{notes}/g, booking.notes || "არ არის")
        .replace(/{business_name}/g, selectedBusiness?.name || "CRM ბიზნესი");
    };

    const templateParams = {
      to_name: client.name || "",
      service_name: service?.name || "",
      date: booking.date || "",
      time: booking.time || "",
      price: String(booking.price || ""),
      staff_name: staffMember?.name || "",
      notes: booking.notes || "არ არის",
      business_name: selectedBusiness?.name || "ჩვენი ბიზნესი"
    };

    const logStamp = () =>
      new Date().toLocaleString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

    // PROCESS SMS
    const isSmsEnabled = forceSendSms !== undefined ? forceSendSms : notificationSettings.smsEnabled;
    if (isSmsEnabled && client.phone) {
      const smsBody = formatMessage(notificationSettings.smsTemplate);
      const result = await deliverNotification("sms", client.phone, smsBody);

      const newLog: NotificationLog = {
        id: `log_sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: selectedBusiness.id,
        bookingId: booking.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email || "",
        serviceName: service?.name || "მომსახურება",
        type: "sms",
        status: DELIVERY_STATUS_LABEL[result.status],
        errorMessage: result.status === "error" ? enhanceErrorMessage(result.message || "უცნობი შეცდომა Twilio-სთან") : undefined,
        sentAt: logStamp(),
        message: smsBody
      };

      if (result.status === "demo") {
        showDemoToast("SMS შეტყობინება (სადემონსტრაციო)", client.phone, smsBody);
      }

      setNotificationLogs(prev => [newLog, ...prev]);
    }

    // PROCESS EMAIL
    if (notificationSettings.emailEnabled && client.email) {
      const emailBody = formatMessage(notificationSettings.emailTemplate);
      const result = await deliverNotification("email", client.email, emailBody, templateParams);

      const newLog: NotificationLog = {
        id: `log_email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: selectedBusiness.id,
        bookingId: booking.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        serviceName: service?.name || "მომსახურება",
        type: "email",
        status: DELIVERY_STATUS_LABEL[result.status],
        errorMessage: result.status === "error" ? (result.message || "უცნობი შეცდომა EmailJS-თან") : undefined,
        sentAt: logStamp(),
        message: emailBody
      };

      if (result.status === "demo") {
        showDemoToast("Email შეტყობინება (სადემონსტრაციო)", client.email, emailBody);
      }

      setNotificationLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRetryNotification = async (logId: string): Promise<boolean> => {
    const log = notificationLogs.find(l => l.id === logId);
    if (!log) return false;

    const result = await deliverNotification(
      log.type,
      log.type === "sms" ? log.clientPhone : log.clientEmail,
      log.message,
      {
        to_name: log.clientName,
        service_name: log.serviceName,
        business_name: selectedBusiness?.name || "ჩვენი ბიზნესი"
      }
    );

    if (result.status === "demo") {
      showDemoToast(
        "შეტყობინების სერვისი არ არის კონფიგურირებული",
        log.type === "sms" ? "Twilio შეტყობინება" : "EmailJS შეტყობინება",
        "რეალური გაგზავნისთვის დააყენეთ პროვაიდერის გასაღებები Supabase-ის სერვერულ პარამეტრებში (იხ. supabase/README.md)."
      );
      return false;
    }

    const failed = result.status === "error";
    setNotificationLogs(prev => prev.map(l => l.id === logId
      ? {
          ...l,
          status: DELIVERY_STATUS_LABEL[result.status],
          errorMessage: failed ? enhanceErrorMessage(result.message || "შეცდომა") : undefined
        }
      : l
    ));

    return !failed;
  };

  // Invoices and automations belong to one business, like bookings and
  // follow-ups. Without this, switching business showed the other one's records.
  const businessDocuments = useMemo(
    () => documents.filter(d => d.businessId === selectedBusiness.id),
    [documents, selectedBusiness.id]
  );

  const businessWorkflows = useMemo(
    () => workflows.filter(w => w.businessId === selectedBusiness.id),
    [workflows, selectedBusiness.id]
  );

  // Compute enriched clients dynamically
  const enrichedClients = useMemo(() => {
    return clients.map(client => {
      const clientBookings = bookings.filter(b => b.clientId === client.id && b.businessId === selectedBusiness.id);
      const totalBookings = clientBookings.filter(b => b.status !== "გაუქმებული").length;
      const totalSpent = clientBookings.filter(b => b.status === "დასრულებული").reduce((sum, b) => sum + b.price, 0);
      return {
        ...client,
        totalBookings,
        totalSpent
      };
    });
  }, [clients, bookings, selectedBusiness.id]);

  // --- ACTIONS ---

  const handleAddBusiness = async (name: string, owner: string, category: string) => {
    const newBus: Business = {
      id: `bus_${Date.now()}`,
      name,
      ownerName: owner,
      category,
      role: "მფლობელი",
      logoColor: "bg-indigo-600 text-white"
    };

    await syncToCloud("ბიზნესის დამატება", () =>
      supabase.from("businesses").insert(mapBusinessToDB(newBus, session!.user.id))
    );

    setBusinesses(prev => [...prev, newBus]);
    setSelectedBusiness(newBus);
  };

  const handleUpdateCurrency = (currency: CurrencyCode) => {
    setSelectedBusiness(prev => {
      if (scope) {
        const currencies = readScoped<Record<string, CurrencyCode>>(scope, "business_currencies", {});
        writeScoped(scope, "business_currencies", { ...currencies, [prev.id]: currency });
      }
      return { ...prev, currency };
    });

    setBusinesses(prev => prev.map(b => b.id === selectedBusiness.id ? { ...b, currency } : b));
  };

  const handleAddFollowup = async (followupData: Omit<Followup, "id" | "businessId">) => {
    const newFollowup: Followup = {
      ...followupData,
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: selectedBusiness.id
    };

    await syncToCloud("შეხსენების დამატება", () =>
      supabase.from("followups").insert(mapFollowupToDB(newFollowup, session!.user.id))
    );

    setFollowups(prev => [newFollowup, ...prev]);
  };

  const handleUpdateFollowupStatus = async (id: string, status: Followup["status"]) => {
    await syncToCloud("შეხსენების სტატუსი", () =>
      supabase.from("followups").update({ status }).eq("id", id)
    );
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const handleDeleteFollowup = async (id: string) => {
    await syncToCloud("შეხსენების წაშლა", () =>
      supabase.from("followups").delete().eq("id", id)
    );
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  const handleEditFollowup = async (edited: Followup) => {
    await syncToCloud("შეხსენების რედაქტირება", () =>
      supabase.from("followups").update(mapFollowupToDB(edited, session!.user.id)).eq("id", edited.id)
    );
    setFollowups(prev => prev.map(f => f.id === edited.id ? edited : f));
  };

  // Document actions
  const handleAddDocument = async (docData: Omit<DocumentInvoice, "id">) => {
    const newDoc: DocumentInvoice = {
      ...docData,
      id: `doc_${Date.now()}`
    };

    await syncToCloud("დოკუმენტის შექმნა", () =>
      supabase.from("documents").insert(mapDocumentToDB(newDoc, session!.user.id))
    );

    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleUpdateDocumentStatus = async (id: string, status: DocumentInvoice["status"]) => {
    await syncToCloud("დოკუმენტის სტატუსი", () =>
      supabase.from("documents").update({ status }).eq("id", id)
    );
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const handleDeleteDocument = async (id: string) => {
    await syncToCloud("დოკუმენტის წაშლა", () =>
      supabase.from("documents").delete().eq("id", id)
    );
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Automation actions
  const handleToggleWorkflow = async (id: string) => {
    const target = workflows.find(w => w.id === id);
    if (!target) return;
    const enabled = !target.enabled;

    await syncToCloud("ავტომატიზაციის ჩართვა/გამორთვა", () =>
      supabase.from("workflows").update({ enabled }).eq("id", id)
    );

    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled } : w));
  };

  const handleAddWorkflow = async (wfData: Omit<WorkflowAutomation, "id">) => {
    const newWf: WorkflowAutomation = {
      ...wfData,
      id: `wf_${Date.now()}`
    };

    await syncToCloud("ავტომატიზაციის შექმნა", () =>
      supabase.from("workflows").insert(mapWorkflowToDB(newWf, session!.user.id))
    );

    setWorkflows(prev => [...prev, newWf]);
  };

  const handleDeleteWorkflow = async (id: string) => {
    await syncToCloud("ავტომატიზაციის წაშლა", () =>
      supabase.from("workflows").delete().eq("id", id)
    );
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, "id"> & { id?: string }, shouldSendSms?: boolean) => {
    if (bookingData.id) {
      // Edit
      await syncToCloud("ჯავშნის რედაქტირება", () =>
        supabase
          .from("bookings")
          .update(mapBookingToDB(bookingData as Booking, session!.user.id))
          .eq("id", bookingData.id!)
      );
      const updatedBooking = bookingData as Booking;
      setBookings(prev => prev.map(b => b.id === bookingData.id ? updatedBooking : b));
      if (shouldSendSms) {
        sendBookingNotifications(updatedBooking, false, true);
      }
    } else {
      // Add
      const newBooking: Booking = {
        ...bookingData,
        id: `bok_${Date.now()}`
      };
      await syncToCloud("ჯავშნის დამატება", () =>
        supabase.from("bookings").insert(mapBookingToDB(newBooking, session!.user.id))
      );
      setBookings(prev => [...prev, newBooking]);
      sendBookingNotifications(newBooking, true, shouldSendSms);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    await syncToCloud("ჯავშნის წაშლა", () =>
      supabase.from("bookings").delete().eq("id", id)
    );
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateBookingStatus = async (id: string, status: "დასრულებული" | "მოლოდინში" | "გაუქმებული") => {
    await syncToCloud("ჯავშნის სტატუსი", () =>
      supabase.from("bookings").update({ status }).eq("id", id)
    );
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleAddClient = async (clientData: Omit<Client, "id" | "totalBookings" | "totalSpent">): Promise<Client> => {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      totalBookings: 0,
      totalSpent: 0
    };

    if (!isLocalMode && session?.user?.id) {
      try {
        const payload = mapClientToDB(newClient, session.user.id, selectedBusiness.id);
        const { error } = await supabase
          .from("clients")
          .insert(payload);
        if (error) {
          if (isSchemaCacheOrTagError(error)) {
            // Fallback: save the core fields when newer columns are missing
            const { error: retryErr } = await supabase
              .from("clients")
              .insert(stripNewerClientColumns(payload));
            if (retryErr) throw retryErr;
            showDemoToast("სქემის ქეშის გაფრთხილება", "Supabase Schema Cache", "კლიენტი შეინახა ძირითადი ველებით. დანარჩენის შესანახად გაუშვით მიგრაციის SQL კოდი Supabase-ში.");
          } else {
            throw error;
          }
        }
      } catch (err: any) {
        setDbErrorDetail(err?.message || JSON.stringify(err));
        recordSyncFailure("კლიენტის დამატება", err);
        if (isSchemaCacheOrTagError(err)) verifyDatabaseSchema();
      }
    }

    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const handleEditClient = async (updatedClient: Client) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const payload = mapClientToDB(updatedClient, session.user.id, selectedBusiness.id);
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", updatedClient.id);
        if (error) {
          if (isSchemaCacheOrTagError(error)) {
            // Fallback: save the core fields when newer columns are missing
            const { error: retryErr } = await supabase
              .from("clients")
              .update(stripNewerClientColumns(payload))
              .eq("id", updatedClient.id);
            if (retryErr) throw retryErr;
            showDemoToast("სქემის ქეშის გაფრთხილება", "Supabase Schema Cache", "კლიენტის ძირითადი ველები განახლდა. დანარჩენის შესანახად გაუშვით მიგრაციის SQL კოდი Supabase-ში.");
          } else {
            throw error;
          }
        }
      } catch (err: any) {
        setDbErrorDetail(err?.message || JSON.stringify(err));
        recordSyncFailure("კლიენტის რედაქტირება", err);
        if (isSchemaCacheOrTagError(err)) verifyDatabaseSchema();
      }
    }
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = async (id: string) => {
    // Bookings and follow-ups first, to satisfy the foreign keys. If either
    // fails the client row is left alone — deleting it would orphan them.
    const bookingsRemoved = await syncToCloud("კლიენტის ჯავშნების წაშლა", () =>
      supabase.from("bookings").delete().eq("client_id", id)
    );
    const followupsRemoved = await syncToCloud("კლიენტის შეხსენებების წაშლა", () =>
      supabase.from("followups").delete().eq("client_id", id)
    );
    if (bookingsRemoved && followupsRemoved) {
      await syncToCloud("კლიენტის წაშლა", () =>
        supabase.from("clients").delete().eq("id", id)
      );
    }
    setClients(prev => prev.filter(c => c.id !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
    setFollowups(prev => prev.filter(f => f.clientId !== id));
  };

  const handleAddService = async (serviceData: Omit<Service, "id">) => {
    const newService: Service = {
      ...serviceData,
      id: `ser_${Date.now()}`
    };

    await syncToCloud("სერვისის დამატება", () =>
      supabase.from("services").insert(mapServiceToDB(newService, session!.user.id))
    );

    setServices(prev => [...prev, newService]);
  };

  const handleEditService = async (updatedService: Service) => {
    await syncToCloud("სერვისის რედაქტირება", () =>
      supabase
        .from("services")
        .update(mapServiceToDB(updatedService, session!.user.id))
        .eq("id", updatedService.id)
    );
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleDeleteService = async (id: string) => {
    // Bookings first, to satisfy the foreign key.
    const bookingsRemoved = await syncToCloud("სერვისის ჯავშნების წაშლა", () =>
      supabase.from("bookings").delete().eq("service_id", id)
    );
    if (bookingsRemoved) {
      await syncToCloud("სერვისის წაშლა", () =>
        supabase.from("services").delete().eq("id", id)
      );
    }

    setServices(prev => prev.filter(s => s.id !== id));
    setBookings(prev => prev.filter(b => b.serviceId !== id));
  };

  const handleAddStaff = async (memberData: Omit<Staff, "id">) => {
    const newMember: Staff = {
      ...memberData,
      id: `stf_${Date.now()}`
    };

    await syncToCloud("თანამშრომლის დამატება", () =>
      supabase.from("staff").insert(mapStaffToDB(newMember, session!.user.id))
    );

    setStaff(prev => [...prev, newMember]);
  };

  const handleEditStaff = async (updatedMember: Staff) => {
    await syncToCloud("თანამშრომლის რედაქტირება", () =>
      supabase
        .from("staff")
        .update(mapStaffToDB(updatedMember, session!.user.id))
        .eq("id", updatedMember.id)
    );
    setStaff(prev => prev.map(s => s.id === updatedMember.id ? updatedMember : s));
  };

  const handleDeleteStaff = async (id: string) => {
    // Bookings first, to satisfy the foreign key.
    const bookingsRemoved = await syncToCloud("თანამშრომლის ჯავშნების წაშლა", () =>
      supabase.from("bookings").delete().eq("staff_id", id)
    );
    if (bookingsRemoved) {
      await syncToCloud("თანამშრომლის წაშლა", () =>
        supabase.from("staff").delete().eq("id", id)
      );
    }

    setStaff(prev => prev.filter(s => s.id !== id));
    setBookings(prev => prev.filter(b => b.staffId !== id));
  };

  const handleToggleStaffStatus = async (id: string) => {
    const target = staff.find(s => s.id === id);
    if (!target) return;
    const newStatus = target.status === "აქტიური" ? "შვებულებაში" : "აქტიური";

    await syncToCloud("თანამშრომლის სტატუსი", () =>
      supabase.from("staff").update({ status: newStatus }).eq("id", id)
    );

    setStaff(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setShowLogoutConfirm(false);
    if (!isLocalMode && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }

    // Wipe everything this scope cached — invoices, follow-ups, message history,
    // integration tokens — so the next person to use this browser sees nothing.
    if (scope) clearScope(scope);
    localStorage.removeItem("vxcrm_local_mode");

    setSession(null);
    setIsLocalMode(true);
    setHasChosenLocal(false);
    window.location.reload();
  };

  const handleImportData = (importedData: {
    bookings: Booking[];
    clients: Client[];
    services: Service[];
    staff: Staff[];
  }) => {
    // Only available in local mode
    if (isLocalMode) {
      setBookings(importedData.bookings);
      setClients(importedData.clients);
      setServices(importedData.services);
      setStaff(importedData.staff);
    } else {
      showDemoToast("ფუნქცია შეზღუდულია", "მონაცემების იმპორტი", "იმპორტის რეჟიმი ხელმისაწვდომია მხოლოდ ლოკალურ რეჟიმში.");
    }
  };

  // Modal helpers
  const handleOpenNewBooking = () => {
    setBookingDefaultDate("2026-07-12");
    setBookingToEdit(null);
    setBookingModalOpen(true);
  };

  const handleOpenNewBookingWithDate = (date: string) => {
    setBookingDefaultDate(date);
    setBookingToEdit(null);
    setBookingModalOpen(true);
  };

  const handleOpenEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setBookingModalOpen(true);
  };

  // If the user needs to sign in / choose local mode
  if (!session && !hasChosenLocal) {
    return (
      <AuthView 
        onAuthSuccess={(newSession) => {
          setSession(newSession);
          setHasChosenLocal(false);
          setIsLocalMode(false);
          localStorage.setItem("vxcrm_local_mode", "false");
        }}
        onContinueLocal={(startEmpty) => {
          setHasChosenLocal(true);
          handleContinueLocal(startEmpty, true);
        }}
      />
    );
  }

  if (supabaseFetchError && !isLocalMode) {
    const isMissingTables = 
      supabaseFetchError.code === "42P01" || 
      supabaseFetchError.code === "42703" ||
      supabaseFetchError.code === "42501" ||
      (supabaseFetchError.message && (
        supabaseFetchError.message.toLowerCase().includes("relation") ||
        supabaseFetchError.message.toLowerCase().includes("column") ||
        supabaseFetchError.message.toLowerCase().includes("permission")
      ));

    const sqlCode = SETUP_SQL;

    const handleCopySql = () => {
      navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />
          
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-display mb-1">
                Supabase-თან კავშირის შეცდომა
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {supabaseFetchError.message || JSON.stringify(supabaseFetchError)}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/50 mb-6 text-sm text-slate-300 space-y-3 leading-relaxed">
            {isMissingTables ? (
              <>
                <p className="font-semibold text-amber-300">
                  ⚠️ როგორც ჩანს, თქვენს Supabase პროექტში საჭირო ცხრილები არ არსებობს.
                </p>
                <p className="text-slate-400">
                  VisionX CRM-ის სწორად მუშაობისთვის საჭიროა ცხრილების შექმნა და RLS წესების გააქტიურება.
                </p>
              </>
            ) : (
              <p>
                დაფიქსირდა შეცდომა მონაცემთა ბაზიდან ინფორმაციის წაკითხვისას. გთხოვთ, შეამოწმოთ პროექტის კონფიგურაცია ან სცადოთ მოგვიანებით.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => {
                setSupabaseFetchError(null);
                setIsLocalMode(true);
                setHasChosenLocal(true);
                localStorage.setItem("vxcrm_local_mode", "true");
                handleContinueLocal(false);
              }}
              className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all duration-150 shadow-md"
            >
              <Database className="w-4 h-4" />
              გაგრძელება ლოკალურ რეჟიმში
            </button>

            {isMissingTables && (
              <button
                onClick={() => setShowDbGuide(!showDbGuide)}
                className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all duration-150 border border-slate-600"
              >
                <FileCode2 className="w-4 h-4" />
                {showDbGuide ? "ინსტრუქციის დამალვა" : "ცხრილების შექმნის ინსტრუქცია"}
              </button>
            )}
          </div>

          {showDbGuide && isMissingTables && (
            <div className="mt-4 bg-slate-950 rounded-xl p-5 border border-slate-800 animate-fade-in text-xs space-y-4">
              <div>
                <p className="font-semibold text-slate-200 mb-1">როგორ შევქმნათ ცხრილები:</p>
                <ol className="list-decimal list-inside text-slate-400 space-y-1">
                  <li>გახსენით თქვენი <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Supabase Dashboard</a></li>
                  <li>მარცხენა მენიუდან გადადით <b>SQL Editor</b> განყოფილებაში</li>
                  <li>დააჭირეთ <b>New query</b>-ს</li>
                  <li>ჩააკოპირეთ ქვემოთ მოცემული SQL კოდი და დააჭირეთ <b>Run</b></li>
                </ol>
              </div>

              <div className="relative">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                    title="Copy SQL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="font-mono bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-48 text-slate-300 whitespace-pre scrollbar-thin">
                  {sqlCode}
                </pre>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-700/60 pt-5 mt-6">
            <button
              onClick={async () => {
                setSupabaseFetchError(null);
                if (session?.user?.id) {
                  fetchUserData(session.user.id);
                }
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ხელახლა ცდა
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setSession(null);
                setSupabaseFetchError(null);
                setHasChosenLocal(false);
                setIsLocalMode(true);
                localStorage.setItem("vxcrm_local_mode", "true");
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              გამოსვლა (Sign Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30 shadow-md border-b border-slate-800">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
          title="მენიუ"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-sm tracking-tight font-display flex items-center gap-2">
          <span>VisionX CRM</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
            {selectedBusiness.name !== "იტვირთება..." ? selectedBusiness.name : "CRM"}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          <CurrencySelector 
            currentCurrency={selectedBusiness.currency || "GEL"}
            onSelectCurrency={handleUpdateCurrency}
            compact
          />
          <NotificationCenter 
            bookings={bookings}
            clients={enrichedClients}
            services={services}
            staff={staff}
            selectedBusinessId={selectedBusiness.id}
            storageScope={scope}
          />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors flex items-center justify-center cursor-pointer"
            title={theme === "dark" ? "დღის რეჟიმი" : "ღამის რეჟიმი"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
      </div>

      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={setSelectedBusiness}
        onAddBusiness={handleAddBusiness}
        onLogout={handleLogout}
        isSupabaseSynced={!isLocalMode}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        onUpdateCurrency={handleUpdateCurrency}
      />

      <main className="flex-1 md:pl-64 pl-0 pt-16 md:pt-0 min-h-screen">
        {/* Sync Info Header Bar */}
        {!isLocalMode && session && (
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>სინქრონიზებული ღრუბელთან: <b>{session.user.email}</b> ({clients.length} კლიენტი)</span>
              </div>

              {/* Status Indicator for Database Schema */}
              {migrationStatus === "success" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>DB სქემა განახლებულია {lastMigrationTime && `(${lastMigrationTime})`}</span>
                </span>
              )}
              {migrationStatus === "auto_handled" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>DB სქემა განახლებას საჭიროებს</span>
                </span>
              )}
              {migrationStatus === "migrating" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                  <span>მიმდინარეობს DB სქემის შემოწმება...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => verifyDatabaseSchema()}
                className="text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title="ბაზის სქემის შემოწმება"
              >
                ⚡ DB სქემის შემოწმება
              </button>
              <button
                onClick={handleUploadLocalData}
                className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title="ლოკალური რეჟიმის მონაცემების ატვირთვა Supabase-ში"
              >
                🔄 ლოკალური მონაცემების ატვირთვა
              </button>
              <button
                onClick={handleLogout}
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold text-[11px]"
              >
                გამოსვლა
              </button>
            </div>
          </div>
        )}

        {isLocalMode && isSupabaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-8 py-2.5 flex items-center justify-between text-xs text-amber-800 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>თქვენ იმყოფებით ლოკალურ რეჟიმში. მონაცემები ინახება ბრაუზერში.</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem("vxcrm_local_mode");
                window.location.reload();
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold"
            >
              ღრუბლოვანი სინქრონიზაციის ჩართვა (ავტორიზაცია)
            </button>
          </div>
        )}

        {/* Unsaved-change warning: the screen is showing data the cloud does not have. */}
        {syncFailures.length > 0 && !isLocalMode && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900/40 px-8 py-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-0.5 text-rose-800 dark:text-rose-300">
                    {syncFailures.length} ცვლილება ვერ შეინახა ღრუბელში
                  </span>
                  <p className="text-rose-700/80 dark:text-rose-400/80 leading-relaxed max-w-2xl">
                    ეკრანზე ნაჩვენები მონაცემები არ ემთხვევა ბაზას. „ბაზიდან განახლება“ ჩამოტვირთავს ღრუბლის რეალურ მდგომარეობას — შეუნახავი ცვლილებები დაიკარგება.
                  </p>
                  <span className="block mt-1 font-mono text-[11px] text-rose-600 dark:text-rose-400">
                    {syncFailures[syncFailures.length - 1].at} · {syncFailures[syncFailures.length - 1].label}: {syncFailures[syncFailures.length - 1].message}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={async () => {
                    if (session?.user?.id) await fetchUserData(session.user.id);
                    setSyncFailures([]);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ბაზიდან განახლება
                </button>
                <button
                  onClick={() => setSyncFailures([])}
                  className="p-1.5 hover:bg-rose-500/10 text-rose-600 rounded-lg transition cursor-pointer"
                  title="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {showDbMigrationWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-4 text-xs text-amber-800 dark:text-amber-400 font-medium">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-1 text-slate-800 dark:text-slate-200">მონაცემთა ბაზის განახლებაა საჭირო (DB Migration Required)</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-1.5">
                    კლიენტების სტატუსების (თეგების) სწორად შესანახად თქვენს Supabase-ში საჭიროა ახალი სვეტის <b>'tag'</b> დამატება. 
                    გთხოვთ, დააკოპიროთ და გაუშვათ ქვემოთ მოცემული SQL კოდი თქვენს <b>Supabase SQL Editor</b>-ში:
                  </p>
                  {dbErrorDetail && (
                    <div className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/5 dark:bg-red-400/5 px-2.5 py-1.5 rounded border border-red-500/10 dark:border-red-400/10 max-w-2xl mt-1.5">
                      <b>სისტემური შეცდომა (PostgreSQL Error):</b> {dbErrorDetail}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={handleVerifyMigration}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ბაზის შემოწმება
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(TAG_MIGRATION_SQL);
                    setMigrationCopied(true);
                    setTimeout(() => setMigrationCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                >
                  {migrationCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {migrationCopied ? "დაკოპირდა!" : "კოდის კოპირება"}
                </button>
                <button
                  onClick={() => setShowDbMigrationWarning(false)}
                  className="p-1.5 hover:bg-amber-500/10 dark:hover:bg-amber-400/10 text-amber-600 rounded-lg transition cursor-pointer"
                  title="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <pre className="mt-3 font-mono bg-slate-900 text-slate-300 p-2.5 rounded-lg border border-slate-800 text-[11px] overflow-x-auto max-w-3xl whitespace-pre-wrap">
              {TAG_MIGRATION_SQL}
            </pre>
          </div>
        )}

        {/* Desktop Top Header Bar */}
        <div className="hidden md:flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-8 items-center justify-between z-20 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>{selectedBusiness.name}</span>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                {selectedBusiness.category}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <CurrencySelector 
              currentCurrency={selectedBusiness.currency || "GEL"}
              onSelectCurrency={handleUpdateCurrency}
            />
            <NotificationCenter 
              bookings={bookings}
              clients={enrichedClients}
              services={services}
              staff={staff}
              selectedBusinessId={selectedBusiness.id}
              storageScope={scope}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
          {currentTab === "dashboard" && (
            <Dashboard 
              selectedBusiness={selectedBusiness}
              bookings={bookings}
              clients={enrichedClients}
              services={services}
              staff={staff}
              onOpenNewBooking={handleOpenNewBooking}
              onEditBooking={handleOpenEditBooking}
              onDeleteBooking={handleDeleteBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
            />
          )}

          {currentTab === "calendar" && (
            <CalendarView 
              selectedBusiness={selectedBusiness}
              bookings={bookings}
              clients={enrichedClients}
              services={services}
              staff={staff}
              onOpenNewBookingWithDate={handleOpenNewBookingWithDate}
              onEditBooking={handleOpenEditBooking}
            />
          )}

          {currentTab === "clients" && (
            <ClientsView 
              clients={enrichedClients}
              onAddClient={handleAddClient}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              currency={selectedBusiness.currency || "GEL"}
            />
          )}

          {currentTab === "pipeline" && (
            <PipelineView 
              clients={enrichedClients}
              onEditClient={handleEditClient}
              onAddClient={handleAddClient}
              selectedBusiness={selectedBusiness}
            />
          )}

          {currentTab === "services" && (
            <ServicesView 
              services={services}
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
              currency={selectedBusiness.currency || "GEL"}
            />
          )}

          {currentTab === "staff" && (
            <StaffView 
              staff={staff}
              onAddStaff={handleAddStaff}
              onEditStaff={handleEditStaff}
              onDeleteStaff={handleDeleteStaff}
              onToggleStatus={handleToggleStaffStatus}
            />
          )}

          {currentTab === "analytics" && (
            <AnalyticsView 
              selectedBusiness={selectedBusiness}
              bookings={bookings}
              clients={enrichedClients}
              services={services}
              staff={staff}
              onImportData={handleImportData}
            />
          )}

          {currentTab === "notifications" && (
            <NotificationsView
              bookings={bookings}
              clients={enrichedClients}
              services={services}
              staff={staff}
              selectedBusinessId={selectedBusiness.id}
              logs={notificationLogs}
              settings={notificationSettings}
              onSaveSettings={setNotificationSettings}
              onClearLogs={() => setNotificationLogs([])}
              onSendTestNotification={handleRetryNotification}
            />
          )}

          {currentTab === "followups" && (
            <FollowupsView
              followups={followups.filter(f => f.businessId === selectedBusiness.id)}
              clients={clients}
              onAddFollowup={handleAddFollowup}
              onUpdateFollowupStatus={handleUpdateFollowupStatus}
              onDeleteFollowup={handleDeleteFollowup}
              onEditFollowup={handleEditFollowup}
            />
          )}

          {currentTab === "documents" && (
            <DocumentsView
              documents={businessDocuments}
              clients={enrichedClients}
              selectedBusiness={selectedBusiness}
              onAddDocument={handleAddDocument}
              onUpdateDocumentStatus={handleUpdateDocumentStatus}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentTab === "automations" && (
            <AutomationsView
              workflows={businessWorkflows}
              selectedBusiness={selectedBusiness}
              onAddWorkflow={handleAddWorkflow}
              onToggleWorkflow={handleToggleWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onRunWorkflowTest={(id) => {
                showDemoToast("ავტომატიზაცია გაიტესტა!", "Workflow Test", "ტესტური ტრიგერი წარმატებით შესრულდა.");
              }}
            />
          )}

          {currentTab === "integrations" && (
            <IntegrationsView 
              config={integrationConfig}
              onUpdateConfig={setIntegrationConfig}
            />
          )}
        </div>
      </main>

      <BookingModal 
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        onSave={handleSaveBooking}
        onAddClient={handleAddClient}
        bookingToEdit={bookingToEdit}
        clients={enrichedClients}
        services={services}
        staff={staff}
        selectedBusinessId={selectedBusiness.id}
        defaultDate={bookingDefaultDate}
        currency={selectedBusiness.currency || "GEL"}
      />

      {/* Floating animated demo toast alerts */}
      <AnimatePresence>
        {demoToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-[11px] tracking-wide uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {demoToast.title}
              </div>
              <button
                onClick={() => setDemoToast(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-slate-500 uppercase">ადრესატი:</div>
              <div className="text-xs font-semibold text-slate-200">{demoToast.recipient}</div>
            </div>
            <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">შინაარსი:</div>
              <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap leading-relaxed font-sans">{demoToast.message}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setDemoToast(null)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                გასაგებია
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-100 z-10"
              id="logout-confirmation-modal"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-indigo-600" />
              
              <div className="flex items-start gap-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white font-display">
                    სისტემიდან გასვლა
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {!isLocalMode && isSupabaseConfigured
                      ? "კლიენტები, სერვისები, ჯავშნები, შეხსენებები, დოკუმენტები და ავტომატიზაციები დაცულია ღრუბელში. უსაფრთხოებისთვის, ამ მოწყობილობაზე შენახული შეტყობინებების ისტორია გასვლისას წაიშლება."
                      : "თქვენ იმყოფებით ლოკალურ რეჟიმში. გასვლისას თქვენი ლოკალური მონაცემები გასუფთავდება. მონაცემების შენარჩუნებისთვის გირჩევთ გამოიყენოთ 'სარეზერვო ასლი' ავტორიზაციის გვერდზე."
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="button"
                  onClick={executeLogout}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-rose-600/15 cursor-pointer"
                  id="confirm-logout-button"
                >
                  გასვლა
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
