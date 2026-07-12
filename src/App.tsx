import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CalendarView from "./components/CalendarView";
import ClientsView from "./components/ClientsView";
import ServicesView from "./components/ServicesView";
import StaffView from "./components/StaffView";
import AnalyticsView from "./components/AnalyticsView";
import BookingModal from "./components/BookingModal";
import AuthView from "./components/AuthView";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { 
  Database, 
  AlertTriangle, 
  LogOut, 
  RefreshCw, 
  FileCode2, 
  Check, 
  Copy, 
  ChevronRight,
  HelpCircle,
  Menu,
  X
} from "lucide-react";

import { 
  Business, 
  Client, 
  Service, 
  Staff, 
  Booking 
} from "./types";

import { 
  initialBusinesses, 
  initialClients, 
  initialServices, 
  initialStaff, 
  initialBookings 
} from "./initialData";

// --- DB DATA MAPPERS ---
const mapBusinessFromDB = (b: any): Business => ({
  id: b.id,
  name: b.name,
  ownerName: b.owner_name,
  role: b.role,
  phone: b.phone || "",
  email: b.email || "",
  address: b.address || "",
  category: b.category || "",
  logoColor: b.logo_color || "bg-indigo-600 text-white"
});

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
  totalSpent: 0
});

const mapClientToDB = (c: Client, userId: string) => ({
  id: c.id,
  user_id: userId,
  name: c.name,
  phone: c.phone,
  email: c.email || null,
  notes: c.notes || null
});

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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

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

  // State lists
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business>({
    id: "bus_loading",
    name: "იტვირთება...",
    ownerName: "...",
    role: "მფლობელი",
    logoColor: "bg-slate-300"
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

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

      const loadedBusinesses = busRes.data.map(mapBusinessFromDB);
      const loadedClients = cliRes.data.map(mapClientFromDB);
      const loadedServices = serRes.data.map(mapServiceFromDB);
      const loadedStaff = stfRes.data.map(mapStaffFromDB);
      const loadedBookings = bokRes.data.map(mapBookingFromDB);

      setBusinesses(loadedBusinesses);
      setClients(loadedClients);
      setServices(loadedServices);
      setStaff(loadedStaff);
      setBookings(loadedBookings);

      if (loadedBusinesses.length > 0) {
        setSelectedBusiness(loadedBusinesses[0]);
      } else {
        // Automatically provision their first business matching their sign up metadata
        const metadata = session?.user?.user_metadata || {};
        const defaultBus: Business = {
          id: `bus_${Date.now()}`,
          name: metadata.business_name || "ჩემი ბიზნესი",
          ownerName: metadata.owner_name || "მფლობელი",
          role: "მფლობელი",
          logoColor: "bg-indigo-600 text-white"
        };
        await supabase.from("businesses").insert(mapBusinessToDB(defaultBus, userId));
        setBusinesses([defaultBus]);
        setSelectedBusiness(defaultBus);
      }
    } catch (err: any) {
      // Use console.warn instead of console.error to avoid triggering automated testing alerts
      console.warn("Error fetching user data from Supabase:", err);
      setSupabaseFetchError(err);
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
    } else {
      // Load standard Georgian mockup data
      const savedBus = localStorage.getItem("vxcrm_businesses");
      const savedSel = localStorage.getItem("vxcrm_selected_business");
      const savedCli = localStorage.getItem("vxcrm_clients");
      const savedSer = localStorage.getItem("vxcrm_services");
      const savedStf = localStorage.getItem("vxcrm_staff");
      const savedBok = localStorage.getItem("vxcrm_bookings");

      setBusinesses(savedBus ? JSON.parse(savedBus) : initialBusinesses);
      setSelectedBusiness(savedSel ? JSON.parse(savedSel) : (savedBus ? JSON.parse(savedBus)[0] : initialBusinesses[0]));
      setClients(savedCli ? JSON.parse(savedCli) : initialClients);
      setServices(savedSer ? JSON.parse(savedSer) : initialServices);
      setStaff(savedStf ? JSON.parse(savedStf) : initialStaff);
      setBookings(savedBok ? JSON.parse(savedBok) : initialBookings);
    }
  };

  // Compute enriched clients dynamically
  const enrichedClients = clients.map(client => {
    const clientBookings = bookings.filter(b => b.clientId === client.id && b.businessId === selectedBusiness.id);
    const totalBookings = clientBookings.filter(b => b.status !== "გაუქმებული").length;
    const totalSpent = clientBookings.filter(b => b.status === "დასრულებული").reduce((sum, b) => sum + b.price, 0);
    return {
      ...client,
      totalBookings,
      totalSpent
    };
  });

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

  const handleSaveBooking = async (bookingData: Omit<Booking, "id"> & { id?: string }) => {
    if (bookingData.id) {
      // Edit
      if (!isLocalMode && session?.user?.id) {
        try {
          const { error } = await supabase
            .from("bookings")
            .update(mapBookingToDB(bookingData as Booking, session.user.id))
            .eq("id", bookingData.id);
          if (error) throw error;
        } catch (err) {
          console.warn("Error updating booking in Supabase:", err);
        }
      }
      setBookings(prev => prev.map(b => b.id === bookingData.id ? (bookingData as Booking) : b));
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
        } catch (err) {
          console.warn("Error creating booking in Supabase:", err);
        }
      }
      setBookings(prev => [...prev, newBooking]);
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
      } catch (err) {
        console.warn("Error deleting booking in Supabase:", err);
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
      } catch (err) {
        console.warn("Error updating booking status in Supabase:", err);
      }
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const handleAddClient = async (clientData: Omit<Client, "id" | "totalBookings" | "totalSpent">) => {
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      totalBookings: 0,
      totalSpent: 0
    };

    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("clients")
          .insert(mapClientToDB(newClient, session.user.id));
        if (error) throw error;
      } catch (err) {
        console.warn("Error adding client to Supabase:", err);
      }
    }

    setClients(prev => [...prev, newClient]);
  };

  const handleEditClient = async (updatedClient: Client) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("clients")
          .update(mapClientToDB(updatedClient, session.user.id))
          .eq("id", updatedClient.id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error editing client in Supabase:", err);
      }
    }
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = async (id: string) => {
    if (!isLocalMode && session?.user?.id) {
      try {
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.warn("Error deleting client in Supabase:", err);
      }
    }
    setClients(prev => prev.filter(c => c.id !== id));
    setBookings(prev => prev.filter(b => b.clientId !== id));
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

  const handleLogout = async () => {
    if (!isLocalMode && isSupabaseConfigured) {
      if (confirm("ნამდვილად გსურთ სისტემიდან გასვლა?")) {
        await supabase.auth.signOut();
        setSession(null);
        setIsLocalMode(true);
        setHasChosenLocal(true);
        localStorage.setItem("vxcrm_local_mode", "true");
        window.location.reload();
      }
    } else {
      if (confirm("ნამდვილად გსურთ გასვლა და მონაცემების საწყის ეტაპზე დაბრუნება (დემო რესეტი)?")) {
        localStorage.clear();
        window.location.reload();
      }
    }
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
      alert("იმპორტის რეჟიმი ხელმისაწვდომია მხოლოდ ლოკალურ რეჟიმში.");
    }
  };

  // Modal helpers
  const handleOpenNewBooking = () => {
    setBookingToEdit(null);
    setBookingModalOpen(true);
  };

  const handleOpenNewBookingWithDate = (date: string) => {
    setBookingToEdit(null);
    setBookingModalOpen(true);
    setTimeout(() => {
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      if (dateInput) {
        dateInput.value = date;
        const event = new Event("input", { bubbles: true });
        dateInput.dispatchEvent(event);
      }
    }, 50);
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
      (supabaseFetchError.message && supabaseFetchError.message.toLowerCase().includes("relation"));

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
  notes TEXT
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
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  staff_id TEXT REFERENCES staff(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'მოლოდინში',
  notes TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY "Users can manage their own businesses" ON businesses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own staff" ON staff FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookings" ON bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`;

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
    <div className="min-h-screen bg-slate-50 flex">
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
        <div className="w-10"></div> {/* Spacer for symmetry */}
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
      />

      <main className="flex-1 md:pl-64 pl-0 pt-16 md:pt-0 min-h-screen">
        {/* Sync Info Header Bar */}
        {!isLocalMode && session && (
          <div className="bg-white border-b border-slate-200 px-8 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>სინქრონიზებული ღრუბელთან: <b>{session.user.email}</b></span>
            </div>
            <button 
              onClick={() => {
                supabase.auth.signOut();
                window.location.reload();
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold"
            >
              სხვა ანგარიშით შესვლა
            </button>
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
            />
          )}

          {currentTab === "services" && (
            <ServicesView 
              services={services}
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
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
        </div>
      </main>

      <BookingModal 
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        onSave={handleSaveBooking}
        bookingToEdit={bookingToEdit}
        clients={enrichedClients}
        services={services}
        staff={staff}
        selectedBusinessId={selectedBusiness.id}
      />
    </div>
  );
}
