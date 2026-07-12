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
    } catch (err) {
      console.error("Error fetching user data from Supabase:", err);
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
        console.error("Error creating business in Supabase:", err);
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
          console.error("Error updating booking in Supabase:", err);
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
          console.error("Error creating booking in Supabase:", err);
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
        console.error("Error deleting booking in Supabase:", err);
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
        console.error("Error updating booking status in Supabase:", err);
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
        console.error("Error adding client to Supabase:", err);
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
        console.error("Error editing client in Supabase:", err);
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
        console.error("Error deleting client in Supabase:", err);
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
        console.error("Error adding service to Supabase:", err);
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
        console.error("Error editing service in Supabase:", err);
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
        console.error("Error deleting service in Supabase:", err);
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
        console.error("Error adding staff to Supabase:", err);
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
        console.error("Error editing staff in Supabase:", err);
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
        console.error("Error deleting staff in Supabase:", err);
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
        console.error("Error toggling staff status in Supabase:", err);
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={setSelectedBusiness}
        onAddBusiness={handleAddBusiness}
        onLogout={handleLogout}
        isSupabaseSynced={!isLocalMode}
      />

      <main className="flex-1 pl-64 min-h-screen">
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

        <div className="max-w-7xl mx-auto p-6 md:p-8 animate-fade-in">
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
