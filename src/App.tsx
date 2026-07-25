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

// --- DB DATA MAPPERS ---
const getBusinessCurrency = (businessId: string): "GEL" | "USD" | "EUR" => {
  try {
    const currencies = localStorage.getItem("vxcrm_business_currencies");
    if (currencies) {
      const parsed = JSON.parse(currencies);
      return parsed[businessId] || "GEL";
    }
  } catch (e) {}
  return "GEL";
};

const mapBusinessFromDB = (b: any): Business => {
  const currency = getBusinessCurrency(b.id);
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
  notes: c.notes || "",
  totalBookings: 0,
  totalSpent: 0,
  tag: c.tag || undefined
});

const mapClientToDB = (c: Client, userId: string) => ({
  id: c.id,
  user_id: userId,
  name: c.name,
  phone: c.phone,
  email: c.email || null,
  notes: c.notes || null,
  tag: c.tag || null
});

const isSchemaCacheOrTagError = (err: any) => {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toString();
  return (
    code === "PGRST204" ||
    code === "42703" ||
    msg.includes("schema cache") ||
    (msg.includes("column") && msg.includes("tag"))
  );
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

  const runAutoMigrationAndSync = async (userId: string) => {
    setMigrationStatus("migrating");
    console.log("🔄 [Auto-Migration] 42703 error detected. Running automatic schema migration...");

    try {
      // 1. Attempt RPC migration calls
      await supabase.rpc("exec_sql", {
        sql: "ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT; NOTIFY pgrst, 'reload schema';"
      }).catch(() => null);

      await supabase.rpc("add_tag_column").catch(() => null);

      // 2. Test if 'tag' column is now accessible
      const { error: testErr } = await supabase.from("clients").select("tag").limit(1);

      if (!testErr) {
        console.log("✅ [Auto-Migration] Database schema updated successfully!");
        setMigrationStatus("success");
        setLastMigrationTime(new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }));
        setShowDbMigrationWarning(false);
        setDbErrorDetail(null);
        showDemoToast(
          "სქემა განახლდა!",
          "ავტომატური მიგრაცია",
          "მონაცემთა ბაზის სქემა წარმატებით განახლდა. 'tag' სვეტი აქტიურია!"
        );
        return true;
      } else {
        console.log("🛡️ [Auto-Compatibility] Operating in auto-handled compatibility mode.");
        setMigrationStatus("auto_handled");
        setLastMigrationTime(new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }));
        setShowDbMigrationWarning(false);
        return false;
      }
    } catch (err) {
      console.warn("Auto-migration process error:", err);
      setMigrationStatus("auto_handled");
      setShowDbMigrationWarning(false);
      return false;
    }
  };

  // State lists
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    const saved = localStorage.getItem("vxcrm_businesses");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    const rawBus = saved ? JSON.parse(saved) : (isInitiallyLocal ? initialBusinesses : []);
    return rawBus.map((b: any) => ({
      ...b,
      currency: b.currency || getBusinessCurrency(b.id)
    }));
  });
  const [selectedBusiness, setSelectedBusiness] = useState<Business>(() => {
    const saved = localStorage.getItem("vxcrm_selected_business");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        currency: parsed.currency || getBusinessCurrency(parsed.id)
      };
    }
    const savedBus = localStorage.getItem("vxcrm_businesses");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    const parsedBus = savedBus ? JSON.parse(savedBus) : (isInitiallyLocal ? initialBusinesses : []);
    const firstBus = parsedBus[0] || {
      id: "bus_loading",
      name: "იტვირთება...",
      ownerName: "...",
      role: "მფლობელი",
      logoColor: "bg-slate-300"
    };
    return {
      ...firstBus,
      currency: firstBus.currency || getBusinessCurrency(firstBus.id)
    };
  });
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("vxcrm_clients");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    return saved ? JSON.parse(saved) : (isInitiallyLocal ? initialClients : []);
  });
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem("vxcrm_services");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    return saved ? JSON.parse(saved) : (isInitiallyLocal ? initialServices : []);
  });
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem("vxcrm_staff");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    return saved ? JSON.parse(saved) : (isInitiallyLocal ? initialStaff : []);
  });
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem("vxcrm_bookings");
    const isInitiallyLocal = !isSupabaseConfigured || localStorage.getItem("vxcrm_local_mode") === "true";
    return saved ? JSON.parse(saved) : (isInitiallyLocal ? initialBookings : []);
  });
  const [followups, setFollowups] = useState<Followup[]>(() => {
    const saved = localStorage.getItem("vxcrm_followups");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("vxcrm_followups", JSON.stringify(followups));
  }, [followups]);

  // CRM Documents
  const [documents, setDocuments] = useState<DocumentInvoice[]>(() => {
    const saved = localStorage.getItem("vxcrm_documents");
    return saved ? JSON.parse(saved) : [
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
  });

  useEffect(() => {
    localStorage.setItem("vxcrm_documents", JSON.stringify(documents));
  }, [documents]);

  // CRM Workflows
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>(() => {
    const saved = localStorage.getItem("vxcrm_workflows");
    return saved ? JSON.parse(saved) : [
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
  });

  useEffect(() => {
    localStorage.setItem("vxcrm_workflows", JSON.stringify(workflows));
  }, [workflows]);

  // CRM Integration Config
  const [integrationConfig, setIntegrationConfig] = useState<IntegrationConfig>(() => {
    const saved = localStorage.getItem("vxcrm_integration_config");
    return saved ? JSON.parse(saved) : {
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
  });

  useEffect(() => {
    localStorage.setItem("vxcrm_integration_config", JSON.stringify(integrationConfig));
  }, [integrationConfig]);

  // Notification logs & settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("vxcrm_notification_settings");
    if (saved) return JSON.parse(saved);
    return {
      smsEnabled: true,
      emailEnabled: true,
      smsTemplate: `გამარჯობა {client_name}, თქვენ წარმატებით ჩაეწერეთ სერვისზე: "{service_name}". თარიღი: {date}, დრო: {time}. ფასი: {price} ₾. სპეციალისტი: {staff_name}. მადლობა რომ ირჩევთ ჩვენს სერვისს!`,
      emailTemplate: `გამარჯობა {client_name},\n\nთქვენ წარმატებით დარეგისტრირდით სერვისზე: "{service_name}".\n\nჯავშნის დეტალები:\n- თარიღი: {date}\n- დრო: {time}\n- სპეციალისტი: {staff_name}\n- მომსახურების ფასი: {price} ₾\n- დამატებითი კომენტარი: {notes}\n\nგელოდებით სიყვარულით!\n{business_name}`,
    };
  });
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem("vxcrm_notification_logs");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("vxcrm_notification_settings", JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem("vxcrm_notification_logs", JSON.stringify(notificationLogs));
  }, [notificationLogs]);

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

  // Sync back to local storage only when in local mode
  useEffect(() => {
    if (isLocalMode && businesses.length > 0) {
      localStorage.setItem("vxcrm_businesses", JSON.stringify(businesses));
    }
  }, [businesses, isLocalMode]);

  useEffect(() => {
    if (isLocalMode && selectedBusiness.id !== "bus_loading") {
      localStorage.setItem("vxcrm_selected_business", JSON.stringify(selectedBusiness));
    }
  }, [selectedBusiness, isLocalMode]);

  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem("vxcrm_clients", JSON.stringify(clients));
    }
  }, [clients, isLocalMode]);

  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem("vxcrm_services", JSON.stringify(services));
    }
  }, [services, isLocalMode]);

  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem("vxcrm_staff", JSON.stringify(staff));
    }
  }, [staff, isLocalMode]);

  useEffect(() => {
    if (isLocalMode) {
      localStorage.setItem("vxcrm_bookings", JSON.stringify(bookings));
    }
  }, [bookings, isLocalMode]);

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

      let loadedBusinesses = busRes.data.map(mapBusinessFromDB);
      let loadedClients = cliRes.data.map(mapClientFromDB);
      let loadedServices = serRes.data.map(mapServiceFromDB);
      let loadedStaff = stfRes.data.map(mapStaffFromDB);
      let loadedBookings = bokRes.data.map(mapBookingFromDB);

      // Safe fetch for followups to avoid breaking if table is not created yet
      let loadedFollowups: Followup[] = [];
      try {
        const folRes = await supabase.from("followups").select("*").eq("user_id", userId);
        if (!folRes.error) {
          loadedFollowups = folRes.data.map(mapFollowupFromDB);
        }
      } catch (folErr) {
        console.warn("Followups fetch error:", folErr);
      }

      // Verify if 'tag' column exists in 'clients' table and run auto-migration if 42703 is detected
      const { error: tagCheckErr } = await supabase.from("clients").select("tag").limit(1);
      if (tagCheckErr && isSchemaCacheOrTagError(tagCheckErr)) {
        await runAutoMigrationAndSync(userId);
      } else {
        setMigrationStatus("success");
        setLastMigrationTime(new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }));
        setShowDbMigrationWarning(false);
        setDbErrorDetail(null);
      }

      // 1. Seed Business if empty in Supabase
      if (loadedBusinesses.length === 0) {
        const metadata = session?.user?.user_metadata || {};
        const savedBus = localStorage.getItem("vxcrm_businesses");
        const localBusList: Business[] = savedBus ? JSON.parse(savedBus) : [];
        const defaultBus: Business = localBusList[0] || {
          id: `bus_${Date.now()}`,
          name: metadata.business_name || "ჩემი ბიზნესი",
          ownerName: metadata.owner_name || "მფლობელი",
          role: "მფლობელი",
          logoColor: "bg-indigo-600 text-white",
          category: "სალონი"
        };
        await supabase.from("businesses").insert(mapBusinessToDB(defaultBus, userId));
        loadedBusinesses = [defaultBus];
      }

      // 2. Seed Clients if empty in Supabase
      if (loadedClients.length === 0) {
        const savedCli = localStorage.getItem("vxcrm_clients");
        const parsedSavedCli = savedCli ? JSON.parse(savedCli) : [];
        const localCliList: Client[] = (parsedSavedCli && parsedSavedCli.length > 0) 
          ? parsedSavedCli 
          : initialClients;

        if (localCliList.length > 0) {
          const cliToInsert = localCliList.map(c => mapClientToDB(c, userId));
          let { error: cliSeedErr } = await supabase.from("clients").insert(cliToInsert);

          // Retry without 'tag' field if schema cache / missing column error
          if (cliSeedErr && isSchemaCacheOrTagError(cliSeedErr)) {
            console.warn("Retrying seeding clients without 'tag' field due to schema error:", cliSeedErr);
            const cliToInsertNoTag = cliToInsert.map(({ tag, ...rest }) => rest);
            const retryRes = await supabase.from("clients").insert(cliToInsertNoTag);
            cliSeedErr = retryRes.error;
          }

          if (!cliSeedErr) {
            console.log(`✅ [Auto-Sync] ${localCliList.length} clients successfully uploaded to Supabase clients table!`);
            showDemoToast(
              "ავტო-სინქრონიზაცია",
              "კლიენტების ატვირთვა",
              `წარმატებით აიტვირთა ${localCliList.length} კლიენტი Supabase-ის clients ცხრილში!`
            );
            loadedClients = localCliList;
          } else {
            console.warn("Error seeding clients to Supabase:", cliSeedErr);
            showDemoToast(
              "სინქრონიზაციის შეცდომა",
              "კლიენტების ატვირთვა",
              `კლიენტების ატვირთვა ვერ მოხერხდა: ${cliSeedErr.message || JSON.stringify(cliSeedErr)}`
            );
            loadedClients = localCliList; // keep local clients in UI state
          }
        }
      }

      // 3. Seed Services if empty in Supabase
      if (loadedServices.length === 0) {
        const savedSer = localStorage.getItem("vxcrm_services");
        const parsedSavedSer = savedSer ? JSON.parse(savedSer) : [];
        const localSerList: Service[] = (parsedSavedSer && parsedSavedSer.length > 0) 
          ? parsedSavedSer 
          : initialServices;

        if (localSerList.length > 0) {
          const serToInsert = localSerList.map(s => mapServiceToDB(s, userId));
          const { error: serSeedErr } = await supabase.from("services").insert(serToInsert);
          if (!serSeedErr) {
            console.log(`✅ [Auto-Sync] ${localSerList.length} services seeded to Supabase.`);
          }
          loadedServices = localSerList;
        }
      }

      // 4. Seed Staff if empty in Supabase
      if (loadedStaff.length === 0) {
        const savedStf = localStorage.getItem("vxcrm_staff");
        const parsedSavedStf = savedStf ? JSON.parse(savedStf) : [];
        const localStfList: Staff[] = (parsedSavedStf && parsedSavedStf.length > 0) 
          ? parsedSavedStf 
          : initialStaff;

        if (localStfList.length > 0) {
          const stfToInsert = localStfList.map(s => mapStaffToDB(s, userId));
          const { error: stfSeedErr } = await supabase.from("staff").insert(stfToInsert);
          if (!stfSeedErr) {
            console.log(`✅ [Auto-Sync] ${localStfList.length} staff members seeded to Supabase.`);
          }
          loadedStaff = localStfList;
        }
      }

      // 5. Seed Bookings if empty in Supabase
      if (loadedBookings.length === 0) {
        const savedBok = localStorage.getItem("vxcrm_bookings");
        const parsedSavedBok = savedBok ? JSON.parse(savedBok) : [];
        const localBokList: Booking[] = (parsedSavedBok && parsedSavedBok.length > 0) 
          ? parsedSavedBok 
          : initialBookings;

        if (localBokList.length > 0) {
          const bokToInsert = localBokList.map(b => mapBookingToDB(b, userId));
          const { error: bokSeedErr } = await supabase.from("bookings").insert(bokToInsert);
          if (!bokSeedErr) {
            console.log(`✅ [Auto-Sync] ${localBokList.length} bookings seeded to Supabase.`);
          }
          loadedBookings = localBokList;
        }
      }

      // 6. Seed Followups if empty in Supabase
      if (loadedFollowups.length === 0) {
        const savedFol = localStorage.getItem("vxcrm_followups");
        const localFolList: Followup[] = savedFol ? JSON.parse(savedFol) : [];
        if (localFolList.length > 0) {
          const folToInsert = localFolList.map(f => mapFollowupToDB(f, userId));
          await supabase.from("followups").insert(folToInsert);
          loadedFollowups = localFolList;
        }
      }

      setBusinesses(loadedBusinesses);
      setClients(loadedClients);
      setServices(loadedServices);
      setStaff(loadedStaff);
      setBookings(loadedBookings);
      setFollowups(loadedFollowups);
      if (loadedBusinesses.length > 0) {
        setSelectedBusiness(loadedBusinesses[0]);
      }
    } catch (err: any) {
      console.warn("Error fetching user data from Supabase:", err);
      setSupabaseFetchError(err);
    }
  };

  const handleForceSyncToSupabase = async () => {
    if (!session?.user?.id) return;
    showDemoToast("სინქრონიზაცია...", "Supabase Sync", "მიმდინარეობს ლოკალური მონაცემების ატვირთვა Supabase-ში...");

    const userId = session.user.id;
    const savedCli = localStorage.getItem("vxcrm_clients");
    const parsedSavedCli = savedCli ? JSON.parse(savedCli) : [];
    const localCliList: Client[] = (parsedSavedCli && parsedSavedCli.length > 0) 
      ? parsedSavedCli 
      : (clients.length > 0 ? clients : initialClients);

    if (localCliList.length > 0) {
      const cliToInsert = localCliList.map(c => mapClientToDB(c, userId));
      let { error } = await supabase.from("clients").insert(cliToInsert);

      if (error && isSchemaCacheOrTagError(error)) {
        console.warn("Retrying force sync without 'tag' field:", error);
        const cliToInsertNoTag = cliToInsert.map(({ tag, ...rest }) => rest);
        const retryRes = await supabase.from("clients").insert(cliToInsertNoTag);
        error = retryRes.error;
      }

      if (!error) {
        console.log(`✅ [Manual Sync] ${localCliList.length} clients uploaded to Supabase clients table!`);
        showDemoToast(
          "სინქრონიზაცია დასრულდა!",
          "კლიენტების ატვირთვა",
          `წარმატებით აიტვირთა ${localCliList.length} კლიენტი Supabase-ის clients ცხრილში!`
        );
        await fetchUserData(userId);
      } else {
        console.warn("Manual sync clients error:", error);
        showDemoToast(
          "სინქრონიზაციის შეცდომა",
          "Supabase",
          `კლიენტების ატვირთვა ვერ მოხერხდა: ${error.message || JSON.stringify(error)}`
        );
      }
    } else {
      showDemoToast("მონაცემები ცარიელია", "Supabase", "ასატვირთი კლიენტები ვერ მოიძებნა.");
    }
  };

  const handleVerifyMigration = async () => {
    if (!session?.user?.id) return;
    try {
      // Query clients table requesting the tag column specifically to verify if it's available
      const { error } = await supabase.from("clients").select("tag").limit(1);
      if (error) throw error;
      
      // If it succeeded, refresh the user data
      await fetchUserData(session.user.id);
      setShowDbMigrationWarning(false);
      setDbErrorDetail(null);
      showDemoToast("ბაზა განახლდა!", "მიგრაცია წარმატებულია", "კავშირი აღდგენილია და ახალი სვეტი აქტიურია.");
    } catch (err: any) {
      const errMsg = err?.message || JSON.stringify(err);
      setDbErrorDetail(errMsg);
      showDemoToast("კავშირი ვერ დამყარდა", "მიგრაცია", `ბაზა კვლავ აბრუნებს შეცდომას: ${errMsg}`);
    }
  };

  const handleContinueLocal = (startEmpty: boolean) => {
    setIsLocalMode(true);
    localStorage.setItem("vxcrm_local_mode", "true");
    localStorage.setItem("vxcrm_start_empty", startEmpty ? "true" : "false");

    if (startEmpty) {
      setBusinesses([]);
      const emptyBus = {
        id: "bus_local",
        name: "ლოკალური ბიზნესი",
        ownerName: "სტუმარი",
        role: "მფლობელი",
        logoColor: "bg-indigo-600 text-white"
      };
      setSelectedBusiness(emptyBus);
      setBusinesses([emptyBus]);
      setClients([]);
      setServices([]);
      setStaff([]);
      setBookings([]);
      setFollowups([]);
    } else {
      // Load standard Georgian mockup data
      const savedBus = localStorage.getItem("vxcrm_businesses");
      const savedSel = localStorage.getItem("vxcrm_selected_business");
      const savedCli = localStorage.getItem("vxcrm_clients");
      const savedSer = localStorage.getItem("vxcrm_services");
      const savedStf = localStorage.getItem("vxcrm_staff");
      const savedBok = localStorage.getItem("vxcrm_bookings");
      const savedFol = localStorage.getItem("vxcrm_followups");

      setBusinesses(savedBus ? JSON.parse(savedBus) : initialBusinesses);
      setSelectedBusiness(savedSel ? JSON.parse(savedSel) : (savedBus ? JSON.parse(savedBus)[0] : initialBusinesses[0]));
      setClients(savedCli ? JSON.parse(savedCli) : initialClients);
      setServices(savedSer ? JSON.parse(savedSer) : initialServices);
      setStaff(savedStf ? JSON.parse(savedStf) : initialStaff);
      setBookings(savedBok ? JSON.parse(savedBok) : initialBookings);

      if (savedFol) {
        setFollowups(JSON.parse(savedFol));
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        
        const initialFollowups: Followup[] = [
          {
            id: "initial_f1",
            businessId: savedBus ? JSON.parse(savedBus)[0]?.id || "bus_local" : initialBusinesses[0]?.id || "bus_local",
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
            businessId: savedBus ? JSON.parse(savedBus)[0]?.id || "bus_local" : initialBusinesses[0]?.id || "bus_local",
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
        setFollowups(initialFollowups);
      }
    }
  };

  const [demoToast, setDemoToast] = useState<{ title: string; recipient: string; message: string } | null>(null);

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

    const sendTwilioSMS = async (to: string, body: string, settings: NotificationSettings) => {
      if (!settings.twilioSid || !settings.twilioToken || !settings.twilioFrom) {
        throw new Error("Twilio-ს გასაღებები არ არის შევსებული");
      }
      
      let formattedTo = to.replace(/[\s\-\(\)]/g, "");
      if (!formattedTo.startsWith("+")) {
        if (formattedTo.startsWith("995")) {
          formattedTo = "+" + formattedTo;
        } else if (formattedTo.length === 9) {
          formattedTo = "+995" + formattedTo;
        } else {
          formattedTo = "+" + formattedTo;
        }
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${settings.twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(`${settings.twilioSid}:${settings.twilioToken}`),
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            To: formattedTo,
            From: settings.twilioFrom,
            Body: body
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Twilio HTTP error! status: ${response.status}`);
      }
      return await response.json();
    };

    const sendEmailJS = async (settings: NotificationSettings, emailText: string) => {
      if (!settings.emailjsServiceId || !settings.emailjsTemplateId || !settings.emailjsUserId) {
        throw new Error("EmailJS-ის გასაღებები არ არის შევსებული");
      }

      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_id: settings.emailjsServiceId,
          template_id: settings.emailjsTemplateId,
          user_id: settings.emailjsUserId,
          accessToken: settings.emailjsAccessToken || undefined,
          template_params: {
            to_email: client.email || "",
            to_name: client.name || "",
            message: emailText,
            service_name: service?.name || "",
            date: booking.date || "",
            time: booking.time || "",
            price: String(booking.price || ""),
            staff_name: staffMember?.name || "",
            notes: booking.notes || "არ არის",
            business_name: selectedBusiness?.name || "ჩვენი ბიზნესი"
          }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `EmailJS HTTP error! status: ${response.status}`);
      }
    };

    // PROCESS SMS
    const isSmsEnabled = forceSendSms !== undefined ? forceSendSms : notificationSettings.smsEnabled;
    if (isSmsEnabled && client.phone) {
      const smsBody = formatMessage(notificationSettings.smsTemplate);
      const isTwilioConfigured = !!(notificationSettings.twilioSid && notificationSettings.twilioToken && notificationSettings.twilioFrom);
      
      const newLog: NotificationLog = {
        id: `log_sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        businessId: selectedBusiness.id,
        bookingId: booking.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email || "",
        serviceName: service?.name || "მომსახურება",
        type: "sms",
        status: isTwilioConfigured ? "გაგზავნილი" : "დემო_გაგზავნილი",
        sentAt: new Date().toLocaleString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }),
        message: smsBody
      };

      if (isTwilioConfigured) {
        try {
          await sendTwilioSMS(client.phone, smsBody, notificationSettings);
        } catch (err: any) {
          console.error("SMS Sending Error:", err);
          newLog.status = "შეცდომა";
          newLog.errorMessage = enhanceErrorMessage(err.message || "უცნობი შეცდომა Twilio-სთან");
        }
      } else {
        showDemoToast("SMS შეტყობინება (სადემონსტრაციო)", client.phone, smsBody);
      }

      setNotificationLogs(prev => [newLog, ...prev]);
    }

    // PROCESS EMAIL
    if (notificationSettings.emailEnabled && client.email) {
      const emailBody = formatMessage(notificationSettings.emailTemplate);
      const isEmailJSConfigured = !!(notificationSettings.emailjsServiceId && notificationSettings.emailjsTemplateId && notificationSettings.emailjsUserId);

      const newLog: NotificationLog = {
        id: `log_email_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        businessId: selectedBusiness.id,
        bookingId: booking.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        serviceName: service?.name || "მომსახურება",
        type: "email",
        status: isEmailJSConfigured ? "გაგზავნილი" : "დემო_გაგზავნილი",
        sentAt: new Date().toLocaleString("ka-GE", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }),
        message: emailBody
      };

      if (isEmailJSConfigured) {
        try {
          await sendEmailJS(notificationSettings, emailBody);
        } catch (err: any) {
          console.error("Email Sending Error:", err);
          newLog.status = "შეცდომა";
          newLog.errorMessage = err.message || "უცნობი შეცდომა EmailJS-თან";
        }
      } else {
        showDemoToast("Email შეტყობინება (სადემონსტრაციო)", client.email, emailBody);
      }

      setNotificationLogs(prev => [newLog, ...prev]);
    }
  };

  const handleRetryNotification = async (logId: string): Promise<boolean> => {
    const log = notificationLogs.find(l => l.id === logId);
    if (!log) return false;

    const isSMS = log.type === "sms";
    const isTwilioConfigured = !!(notificationSettings.twilioSid && notificationSettings.twilioToken && notificationSettings.twilioFrom);
    const isEmailJSConfigured = !!(notificationSettings.emailjsServiceId && notificationSettings.emailjsTemplateId && notificationSettings.emailjsUserId);

    if (isSMS) {
      if (!isTwilioConfigured) {
        showDemoToast("შეცდომა პარამეტრებში", "Twilio შეტყობინება", "გთხოვთ ჯერ შეავსოთ Twilio-ს პარამეტრები პარამეტრების მენიუდან.");
        return false;
      }
      try {
        let formattedTo = log.clientPhone.replace(/[\s\-\(\)]/g, "");
        if (!formattedTo.startsWith("+")) {
          if (formattedTo.startsWith("995")) {
            formattedTo = "+" + formattedTo;
          } else if (formattedTo.length === 9) {
            formattedTo = "+995" + formattedTo;
          } else {
            formattedTo = "+" + formattedTo;
          }
        }

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${notificationSettings.twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${notificationSettings.twilioSid}:${notificationSettings.twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              To: formattedTo,
              From: notificationSettings.twilioFrom!,
              Body: log.message
            })
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Twilio HTTP error! status: ${response.status}`);
        }

        setNotificationLogs(prev => prev.map(l => l.id === logId ? { ...l, status: "გაგზავნილი", errorMessage: undefined } : l));
        return true;
      } catch (err: any) {
        console.error(err);
        setNotificationLogs(prev => prev.map(l => l.id === logId ? { ...l, status: "შეცდომა", errorMessage: enhanceErrorMessage(err.message || "შეცდომა") } : l));
        return false;
      }
    } else {
      if (!isEmailJSConfigured) {
        showDemoToast("შეცდომა პარამეტრებში", "EmailJS შეტყობინება", "გთხოვთ ჯერ შეავსოთ EmailJS-ის პარამეტრები პარამეტრების მენიუდან.");
        return false;
      }
      try {
        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            service_id: notificationSettings.emailjsServiceId,
            template_id: notificationSettings.emailjsTemplateId,
            user_id: notificationSettings.emailjsUserId,
            accessToken: notificationSettings.emailjsAccessToken || undefined,
            template_params: {
              to_email: log.clientEmail,
              to_name: log.clientName,
              message: log.message,
              service_name: log.serviceName,
              business_name: selectedBusiness?.name || "ჩვენი ბიზნესი"
            }
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `EmailJS HTTP error! status: ${response.status}`);
        }

        setNotificationLogs(prev => prev.map(l => l.id === logId ? { ...l, status: "გაგზავნილი", errorMessage: undefined } : l));
        return true;
      } catch (err: any) {
        console.error(err);
        setNotificationLogs(prev => prev.map(l => l.id === logId ? { ...l, status: "შეცდომა", errorMessage: err.message || "შეცდომა" } : l));
        return false;
      }
    }
  };

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

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("businesses")
          .insert(mapBusinessToDB(newBus, session.user.id));
        if (error) throw error;
      } catch (err) {
        console.warn("Error creating business in Supabase:", err);
      }
    }

    setBusinesses(prev => [...prev, newBus]);
    setSelectedBusiness(newBus);
  };

  const handleUpdateCurrency = (currency: CurrencyCode) => {
    setSelectedBusiness(prev => {
      const updated = { ...prev, currency };
      try {
        const stored = localStorage.getItem("vxcrm_business_currencies") || "{}";
        const parsed = JSON.parse(stored);
        parsed[prev.id] = currency;
        localStorage.setItem("vxcrm_business_currencies", JSON.stringify(parsed));
      } catch (e) {
        console.warn("Error saving business currency in localStorage:", e);
      }
      return updated;
    });

    setBusinesses(prev => prev.map(b => b.id === selectedBusiness.id ? { ...b, currency } : b));
  };

  const handleAddFollowup = async (followupData: Omit<Followup, "id" | "businessId">) => {
    const newFollowup: Followup = {
      ...followupData,
      id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: selectedBusiness.id
    };

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("followups")
          .insert(mapFollowupToDB(newFollowup, session.user.id));
        if (error) throw error;
      } catch (err) {
        console.warn("Error creating followup in Supabase:", err);
      }
    }

    setFollowups(prev => [newFollowup, ...prev]);
  };

  const handleUpdateFollowupStatus = async (id: string, status: Followup["status"]) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("followups")
          .update({ status })
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error updating followup status in Supabase:", err);
      }
    }
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, status } : f));
  };

  const handleDeleteFollowup = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("followups")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error deleting followup in Supabase:", err);
      }
    }
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  const handleEditFollowup = async (edited: Followup) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("followups")
          .update(mapFollowupToDB(edited, session.user.id))
          .eq("id", edited.id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error updating followup in Supabase:", err);
      }
    }
    setFollowups(prev => prev.map(f => f.id === edited.id ? edited : f));
  };

  // Document actions
  const handleAddDocument = (docData: Omit<DocumentInvoice, "id">) => {
    const newDoc: DocumentInvoice = {
      ...docData,
      id: `doc_${Date.now()}`
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleUpdateDocumentStatus = (id: string, status: DocumentInvoice["status"]) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Automation actions
  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleAddWorkflow = (wfData: Omit<WorkflowAutomation, "id">) => {
    const newWf: WorkflowAutomation = {
      ...wfData,
      id: `wf_${Date.now()}`
    };
    setWorkflows(prev => [...prev, newWf]);
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const handleSaveBooking = async (bookingData: Omit<Booking, "id"> & { id?: string }, shouldSendSms?: boolean) => {
    if (bookingData.id) {
      // Edit
      if (!isLocalMode && session?.user?.id) {
        try {
          const { error } = await supabase
            .from("bookings")
            .update(mapBookingToDB(bookingData as Booking, session.user.id))
            .eq("id", bookingData.id);
          if (error) throw error;
        } catch (err: any) {
          console.warn("Error updating booking in Supabase:", err);
          showDemoToast("სინქრონიზაციის შეცდომა", "ჯავშნის რედაქტირება", `ბაზაში ცვლილება ვერ შეინახა: ${err?.message || "უცნობი შეცდომა"}`);
        }
      }
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
      if (!isLocalMode && session?.user?.id) {
        try {
          const { error } = await supabase
            .from("bookings")
            .insert(mapBookingToDB(newBooking, session.user.id));
          if (error) throw error;
        } catch (err: any) {
          console.warn("Error creating booking in Supabase:", err);
          showDemoToast("სინქრონიზაციის შეცდომა", "ჯავშნის დამატება", `ბაზაში ჩაწერა ვერ მოხერხდა: ${err?.message || "უცნობი შეცდომა"}`);
        }
      }
      setBookings(prev => [...prev, newBooking]);
      sendBookingNotifications(newBooking, true, shouldSendSms);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.warn("Error deleting booking in Supabase:", err);
        showDemoToast("სინქრონიზაციის შეცდომა", "ჯავშნის წაშლა", `წაშლა ვერ მოხერხდა: ${err?.message || "უცნობი შეცდომა"}`);
      }
    }
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleUpdateBookingStatus = async (id: string, status: "დასრულებული" | "მოლოდინში" | "გაუქმებული") => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("bookings")
          .update({ status })
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.warn("Error updating booking status in Supabase:", err);
        showDemoToast("სინქრონიზაციის შეცდომა", "სტატუსის განახლება", `სტატუსი ვერ განახლდა ბაზაში: ${err?.message || "უცნობი შეცდომა"}`);
      }
    }
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
        const payload = mapClientToDB(newClient, session.user.id);
        const { error } = await supabase
          .from("clients")
          .insert(payload);
        if (error) {
          if (isSchemaCacheOrTagError(error)) {
            // Fallback: retry without 'tag' field if schema cache issue
            const { tag, ...payloadWithoutTag } = payload;
            const { error: retryErr } = await supabase
              .from("clients")
              .insert(payloadWithoutTag);
            if (retryErr) throw retryErr;
            showDemoToast("სქემის ქეშის გაფრთხილება", "Supabase Schema Cache", "კლიენტი შეინახა ტეგის გარეშე. PostgREST ქეშის განახლებისთვის გაუშვით: NOTIFY pgrst, 'reload schema';");
          } else {
            throw error;
          }
        }
      } catch (err: any) {
        console.warn("Error adding client to Supabase:", err);
        const errMsg = err?.message || JSON.stringify(err);
        setDbErrorDetail(errMsg);
        if (isSchemaCacheOrTagError(err)) {
          runAutoMigrationAndSync(session.user.id);
        } else {
          showDemoToast("შეცდომა ბაზაში შენახვისას", "კლიენტის დამატება", `მონაცემის შენახვა ვერ მოხერხდა: ${errMsg}`);
        }
      }
    }

    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const handleEditClient = async (updatedClient: Client) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const payload = mapClientToDB(updatedClient, session.user.id);
        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", updatedClient.id);
        if (error) {
          if (isSchemaCacheOrTagError(error)) {
            // Fallback: retry update without 'tag' field so basic fields (name, phone, email, notes) still save!
            const { tag, ...payloadWithoutTag } = payload;
            const { error: retryErr } = await supabase
              .from("clients")
              .update(payloadWithoutTag)
              .eq("id", updatedClient.id);
            if (retryErr) throw retryErr;
            showDemoToast("სქემის ქეშის გაფრთხილება", "Supabase Schema Cache", "კლიენტის მონაცემები განახლდა (ტეგის გარეშე). PostgREST ქეშის განახლებისთვის გაუშვით: NOTIFY pgrst, 'reload schema';");
          } else {
            throw error;
          }
        }
      } catch (err: any) {
        console.warn("Error editing client in Supabase:", err);
        const errMsg = err?.message || JSON.stringify(err);
        setDbErrorDetail(errMsg);
        if (isSchemaCacheOrTagError(err)) {
          runAutoMigrationAndSync(session.user.id);
        } else {
          showDemoToast("შეცდომა ბაზაში განახლებისას", "კლიენტის რედაქტირება", `ცვლილებების შენახვა ვერ მოხერხდა: ${errMsg}`);
        }
      }
    }
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        // Delete bookings for this client in Supabase first to satisfy foreign key constraints
        await supabase
          .from("bookings")
          .delete()
          .eq("client_id", id);

        // Delete followups for this client in Supabase first
        await supabase
          .from("followups")
          .delete()
          .eq("client_id", id);

        // Now delete the client
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.warn("Error deleting client in Supabase:", err);
        showDemoToast("შეცდომა წაშლისას", "კლიენტის წაშლა", `წაშლა ვერ მოხერხდა: ${err?.message || "უცნობი შეცდომა"}`);
      }
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

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("services")
          .insert(mapServiceToDB(newService, session.user.id));
        if (error) throw error;
      } catch (err) {
        console.warn("Error adding service to Supabase:", err);
      }
    }

    setServices(prev => [...prev, newService]);
  };

  const handleEditService = async (updatedService: Service) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("services")
          .update(mapServiceToDB(updatedService, session.user.id))
          .eq("id", updatedService.id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error editing service in Supabase:", err);
      }
    }
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleDeleteService = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        // Delete bookings for this service in Supabase first to satisfy foreign key constraints
        await supabase
          .from("bookings")
          .delete()
          .eq("service_id", id);

        const { error } = await supabase
          .from("services")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error deleting service in Supabase:", err);
      }
    }
    setServices(prev => prev.filter(s => s.id !== id));
    setBookings(prev => prev.filter(b => b.serviceId !== id));
  };

  const handleAddStaff = async (memberData: Omit<Staff, "id">) => {
    const newMember: Staff = {
      ...memberData,
      id: `stf_${Date.now()}`
    };

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("staff")
          .insert(mapStaffToDB(newMember, session.user.id));
        if (error) throw error;
      } catch (err) {
        console.warn("Error adding staff to Supabase:", err);
      }
    }

    setStaff(prev => [...prev, newMember]);
  };

  const handleEditStaff = async (updatedMember: Staff) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("staff")
          .update(mapStaffToDB(updatedMember, session.user.id))
          .eq("id", updatedMember.id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error editing staff in Supabase:", err);
      }
    }
    setStaff(prev => prev.map(s => s.id === updatedMember.id ? updatedMember : s));
  };

  const handleDeleteStaff = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        // Delete bookings for this staff in Supabase first to satisfy foreign key constraints
        await supabase
          .from("bookings")
          .delete()
          .eq("staff_id", id);

        const { error } = await supabase
          .from("staff")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error deleting staff in Supabase:", err);
      }
    }
    setStaff(prev => prev.filter(s => s.id !== id));
    setBookings(prev => prev.filter(b => b.staffId !== id));
  };

  const handleToggleStaffStatus = async (id: string) => {
    const target = staff.find(s => s.id === id);
    if (!target) return;
    const newStatus = target.status === "აქტიური" ? "შვებულებაში" : "აქტიური";

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("staff")
          .update({ status: newStatus })
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error toggling staff status in Supabase:", err);
      }
    }

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
    setSession(null);
    setIsLocalMode(true);
    setHasChosenLocal(false);
    if (isLocalMode) {
      localStorage.clear();
    } else {
      localStorage.removeItem("vxcrm_local_mode");
    }
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
          localStorage.setItem("vxcrm_local_mode", "true");
          handleContinueLocal(startEmpty);
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

    const sqlCode = `-- 1. Create Tables with User Isolation
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  role TEXT DEFAULT 'მფლობელი',
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  logo_color TEXT DEFAULT 'bg-indigo-600 text-white'
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  tag TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration INT NOT NULL,
  category TEXT NOT NULL,
  color TEXT DEFAULT 'blue'
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_color TEXT DEFAULT 'bg-indigo-600 text-white',
  rating NUMERIC DEFAULT 5.0,
  status TEXT DEFAULT 'აქტიური'
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  client_id TEXT,
  service_id TEXT,
  staff_id TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'მოლოდინში',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'მოლოდინში',
  notes TEXT
);

-- 2. Add missing columns if tables already existed without them
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE followups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;
CREATE POLICY "Users can manage their own businesses" ON businesses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own services" ON services;
CREATE POLICY "Users can manage their own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own staff" ON staff;
CREATE POLICY "Users can manage their own staff" ON staff FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
CREATE POLICY "Users can manage their own bookings" ON bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own followups" ON followups;
CREATE POLICY "Users can manage their own followups" ON followups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`;

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
                  <span>DB ავტო-თავსებადია</span>
                </span>
              )}
              {migrationStatus === "migrating" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                  <span>მიმდინარეობს DB სქემის ავტო-მიგრაცია...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => session?.user?.id && runAutoMigrationAndSync(session.user.id)}
                className="text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title="ბაზის სქემის ავტომატური შემოწმება და მიგრაცია"
              >
                ⚡ DB სქემის შემოწმება
              </button>
              <button
                onClick={handleForceSyncToSupabase}
                className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title="ლოკალური კლიენტების მონაცემების ატვირთვა Supabase-ში"
              >
                🔄 კლიენტების ატვირთვა
              </button>
              <button 
                onClick={() => {
                  supabase.auth.signOut();
                  window.location.reload();
                }}
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
                    navigator.clipboard.writeText("ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;\nNOTIFY pgrst, 'reload schema';");
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
            <div className="mt-3 font-mono bg-slate-900 text-slate-300 p-2.5 rounded-lg border border-slate-800 text-[11px] overflow-x-auto max-w-3xl whitespace-pre-wrap">
              ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;
              NOTIFY pgrst, 'reload schema';
            </div>
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
              documents={documents}
              clients={enrichedClients}
              selectedBusiness={selectedBusiness}
              onAddDocument={handleAddDocument}
              onUpdateDocumentStatus={handleUpdateDocumentStatus}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {currentTab === "automations" && (
            <AutomationsView 
              workflows={workflows}
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
                      ? "ნამდვილად გსურთ თქვენი ანგარიშიდან გასვლა? ყველა მონაცემი უსაფრთხოდ არის შენახული ღრუბელში."
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
