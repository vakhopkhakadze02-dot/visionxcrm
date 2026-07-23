import React, { useState } from "react";
import { motion } from "motion/react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { Lock, Mail, Building2, ChevronRight, HelpCircle, Database, CheckCircle2, ArrowLeft, Key, Download, Upload, Search } from "lucide-react";

interface AuthViewProps {
  onAuthSuccess: (session: any) => void;
  onContinueLocal: (startEmpty: boolean) => void;
}

export default function AuthView({ onAuthSuccess, onContinueLocal }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryTab, setRecoveryTab] = useState<"password" | "email" | "backup">("password");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryBusinessName, setRecoveryBusinessName] = useState("");
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      return hash.includes("type=recovery") || search.includes("recovery=true") || hash.includes("access_token=");
    }
    return false;
  });
  const [newPassword, setNewPassword] = useState("");

  const cachedEmail = typeof window !== "undefined" ? localStorage.getItem("vxcrm_last_active_email") : null;

  const isDevMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "true";
  const showDevTools = !isSupabaseConfigured || isDevMode;

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

-- 2. Enable Row Level Security (RLS) for absolute data privacy
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies so users can ONLY access their own data
CREATE POLICY "Users can manage their own businesses" ON businesses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own staff" ON staff FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own bookings" ON bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recreating the uploaded Logo in SVG
  const VisionXLogo = () => (
    <svg viewBox="0 0 200 200" className="w-24 h-24 mx-auto drop-shadow-md">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>
      <g filter="url(#shadow)">
        {/* Spokes (Capsules rotating from center) */}
        {/* We have 12 spokes rotating at 30 degree increments */}
        {/* Spoke color mappings based on the user's logo */}
        {[
          { angle: 0, color: "#84cc16" },   // Lime Green (12 o'clock)
          { angle: 30, color: "#ffffff" },  // White
          { angle: 60, color: "#1d4ed8" },  // Royal Blue
          { angle: 90, color: "#ffffff" },  // White
          { angle: 120, color: "#84cc16" }, // Lime Green
          { angle: 150, color: "#ffffff" }, // White
          { angle: 180, color: "#1d4ed8" }, // Royal Blue
          { angle: 210, color: "#ffffff" }, // White
          { angle: 240, color: "#84cc16" }, // Lime Green
          { angle: 270, color: "#1d4ed8" }, // Royal Blue
          { angle: 300, color: "#ffffff" }, // White
          { angle: 330, color: "#84cc16" }, // Lime Green
        ].map((spoke, idx) => (
          <g key={idx} transform={`rotate(${spoke.angle} 100 100)`}>
            <rect
              x="92"
              y="25"
              width="16"
              height="55"
              rx="8"
              fill={spoke.color}
            />
          </g>
        ))}
        {/* Dark center core to give it the ring-like shape */}
        <circle cx="100" cy="100" r="32" fill="#0f172a" />
      </g>
    </svg>
  );

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!isSupabaseConfigured) {
      setError("Supabase კავშირი არ არის აქტიური. გთხოვთ მიჰყვეთ ინსტრუქციას მის დასაკავშირებლად.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!businessName.trim()) {
          throw new Error("გთხოვთ მიუთითოთ ორგანიზაციის დასახელება");
        }
        if (!ownerName.trim()) {
          throw new Error("გთხოვთ მიუთითოთ მფლობელის სახელი და გვარი");
        }

        // Register new user
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              owner_name: ownerName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data?.user) {
          localStorage.setItem("vxcrm_last_active_email", email);
          // Attempt to pre-create the business for this user
          try {
            const { error: dbError } = await supabase.from("businesses").insert({
              id: `bus_${Date.now()}`,
              user_id: data.user.id,
              name: businessName,
              owner_name: ownerName,
              role: "მფლობელი",
              logo_color: "bg-indigo-600 text-white",
            });
            if (dbError) console.error("Error inserting business", dbError);
          } catch (err) {
            console.error("Failed to insert initial business", err);
          }

          setSuccessMsg("რეგისტრაცია წარმატებით დასრულდა! გთხოვთ შეხვიდეთ სისტემაში.");
          setIsSignUp(false);
        }
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (data?.session) {
          localStorage.setItem("vxcrm_last_active_email", email);
          onAuthSuccess(data.session);
        }
      }
    } catch (err: any) {
      setError(err.message || "დაფიქსირდა შეცდომა ავტორიზაციისას");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSupabaseConfigured) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
          redirectTo: `${window.location.origin}?recovery=true`,
        });
        if (resetError) throw resetError;
        setSuccessMsg("პაროლის აღდგენის ბმული წარმატებით გაიგზავნა თქვენს ელ-ფოსტაზე! გთხოვთ შეამოწმოთ საფოსტო ყუთი.");
      } else {
        setSuccessMsg(`[დემო რეჟიმი] აღდგენის ინსტრუქცია იმიტირებულად გაიგზავნა მისამართზე: ${recoveryEmail}.`);
      }
    } catch (err: any) {
      setError(err.message || "აღდგენის მოთხოვნის გაგზავნა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isSupabaseConfigured) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (updateError) throw updateError;
        setSuccessMsg("პაროლი წარმატებით განახლდა! შეგიძლიათ ჩვეულებრივად გააგრძელოთ მუშაობა.");
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.origin);
        }
        setTimeout(() => {
          setIsRecovering(false);
          supabase.auth.getSession().then(({ data: { session: newSession } }) => {
            if (newSession) {
              onAuthSuccess(newSession);
            }
          });
        }, 2500);
      } else {
        setSuccessMsg("[დემო რეჟიმი] პაროლი წარმატებით განახლდა!");
        setTimeout(() => {
          setIsRecovering(false);
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || "პაროლის განახლება ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const backupData: Record<string, any> = {};
      const keys = [
        "vxcrm_businesses",
        "vxcrm_selected_business",
        "vxcrm_clients",
        "vxcrm_services",
        "vxcrm_staff",
        "vxcrm_bookings",
        "vxcrm_followups",
        "vxcrm_notification_settings",
        "vxcrm_notification_logs",
        "vxcrm_last_active_email"
      ];
      keys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) backupData[key] = val;
      });

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `visionx_crm_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccessMsg("სარეზერვო ასლი წარმატებით ჩამოიტვირთა! შეინახეთ ფაილი უსაფრთხოდ.");
    } catch (err: any) {
      setError("ვერ მოხერხდა სარეზერვო ასლის შექმნა: " + err.message);
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let importedCount = 0;
        Object.entries(parsed).forEach(([key, val]) => {
          if (key.startsWith("vxcrm_") && typeof val === "string") {
            localStorage.setItem(key, val);
            importedCount++;
          }
        });

        if (importedCount > 0) {
          setSuccessMsg("ყველა მონაცემი წარმატებით აღდგა ფაილიდან! გვერდი გადაიტვირთება 2 წამში...");
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setError("სარეზერვო ფაილი არ შეიცავს VisionX CRM-ის მონაცემებს.");
        }
      } catch (err) {
        setError("ფაილის წაკითხვისას დაფიქსირდა შეცდომა. დარწმუნდით, რომ სწორი .json ფაილია.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col justify-between p-6 selection:bg-indigo-500 selection:text-white">
      {/* Upper bar with setup status */}
      {showDevTools ? (
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Supabase სტატუსი:
            </span>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                დაკავშირებულია
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-500/20">
                არ არის დაკავშირებული
              </span>
            )}
          </div>

          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            კავშირის ინსტრუქცია (SQL & ENV)
          </button>
        </div>
      ) : (
        <div className="h-8"></div>
      )}

      <div className="max-w-md w-full mx-auto my-auto py-8">
        {/* Setup Guide Panel */}
        {showSetupGuide && showDevTools && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-slate-800/90 rounded-2xl border border-slate-700 shadow-xl space-y-4 text-xs leading-relaxed text-slate-300 max-h-[450px] overflow-y-auto font-sans"
          >
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              როგორ დავაკავშიროთ Supabase?
            </h3>
            <p>
              Supabase-ის დასაკავშირებლად და სრულფასოვანი იზოლირებული CRM-ის გასააქტიურებლად, დაგჭირდებათ ორი ნაბიჯის შესრულება:
            </p>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-slate-200 mb-1">1. გარემოს ცვლადები (Secrets):</p>
                <p>ჩაწერეთ შემდეგი ცვლადები AI Studio-ს მარჯვენა მენიუში (Secrets / Settings ჩანართი):</p>
                <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-[11px] text-indigo-300">
                  <li>VITE_SUPABASE_URL = თქვენი_supabase_პროექტის_url</li>
                  <li>VITE_SUPABASE_ANON_KEY = თქვენი_anon_public_key</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-slate-200 mb-1">2. SQL სქემის გაშვება Supabase-ში:</p>
                <p className="mb-2">
                  გახსენით თქვენი Supabase პროექტის SQL Editor, ჩაწერეთ და გაუშვით შემდეგი კოდი, რათა შეიქმნას ცხრილები და ჩაირთოს მონაცემთა იზოლაციის წესები (RLS):
                </p>
                <div className="relative mt-2">
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded transition-all active:scale-95"
                  >
                    {copied ? "დაკოპირდა!" : "კოდის დაკოპირება"}
                  </button>
                  <pre className="p-3 bg-slate-950 text-indigo-300 font-mono text-[10px] rounded-lg overflow-x-auto max-h-48 border border-slate-800">
                    {sqlCode}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-8 border border-slate-800/60 shadow-2xl space-y-8">
          {/* Brand/Logo Area */}
          <div className="text-center space-y-3">
            <VisionXLogo />
            <div className="space-y-1">
              <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
                VisionX CRM
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                იზოლირებული და დაცული CRM პლატფორმა თქვენი ბიზნესის სრული კონტროლისთვის
              </p>
            </div>
          </div>

          {isRecovering ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                <button
                  type="button"
                  onClick={() => { setIsRecovering(false); setError(null); setSuccessMsg(null); }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="უკან დაბრუნება"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <h2 className="text-sm font-bold text-white font-display">ახალი პაროლის დაყენება</h2>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                გთხოვთ, ჩაწეროთ თქვენი ახალი უსაფრთხო პაროლი (მინიმუმ 6 სიმბოლო).
              </p>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="ახალი პაროლი"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "ინახება..." : "პაროლის განახლება"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : showRecovery ? (
            <div className="space-y-6 animate-fade-in">
              {/* Recovery Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                <button
                  type="button"
                  onClick={() => { setShowRecovery(false); setError(null); setSuccessMsg(null); }}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="უკან დაბრუნება"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <h2 className="text-sm font-bold text-white font-display">ანგარიშის აღდგენა & Backup</h2>
              </div>

              {/* Recovery Tabs */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => { setRecoveryTab("password"); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    recoveryTab === "password" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  პაროლის აღდგენა
                </button>
                <button
                  type="button"
                  onClick={() => { setRecoveryTab("email"); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    recoveryTab === "email" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ელ-ფოსტის პოვნა
                </button>
                <button
                  type="button"
                  onClick={() => { setRecoveryTab("backup"); setError(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    recoveryTab === "backup" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  სარეზერვო ასლი
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                  {successMsg}
                </div>
              )}

              {/* Recovery Tab Details */}
              {recoveryTab === "password" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    შეიყვანეთ თქვენი ელ-ფოსტის მისამართი. თუ Supabase აქტიურია, მიიღებთ პაროლის შეცვლის ბმულს.
                  </p>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="მაგალითი: username@mail.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? "გთხოვთ დაელოდოთ..." : "აღდგენის ბმულის გაგზავნა"}
                    <Key className="w-4 h-4" />
                  </button>
                </form>
              )}

              {recoveryTab === "email" && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    თუ დაგავიწყდათ ელ-ფოსტის მისამართი, შეგვიძლია მოვძებნოთ ამ მოწყობილობაზე შენახული ბოლო აქტიური ჩანაწერი.
                  </p>

                  {cachedEmail ? (
                    <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/15 rounded-xl space-y-2">
                      <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block">
                        ამ მოწყობილობაზე ნაპოვნი ელ-ფოსტა:
                      </span>
                      <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-850">
                        <span className="font-mono text-xs text-indigo-200 select-all font-semibold">{cachedEmail}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cachedEmail);
                            setSuccessMsg("ელ-ფოსტა წარმატებით დაკოპირდა მეხსიერებაში!");
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                        >
                          კოპირება
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-center text-xs text-slate-400 leading-normal">
                      ამ ბრაუზერის ლოკალურ მეხსიერებაში ავტორიზაციის ისტორია არ მოიძებნა.
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ძებნა ბიზნესის დასახელებით (ლოკალური ქეში):
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="ჩაწერეთ ბიზნესის დასახელება..."
                        value={recoveryBusinessName}
                        onChange={(e) => {
                          setRecoveryBusinessName(e.target.value);
                          try {
                            const savedBus = localStorage.getItem("vxcrm_businesses");
                            if (savedBus) {
                              const parsed = JSON.parse(savedBus);
                              const match = parsed.find((b: any) => 
                                b.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
                                (b.ownerName && b.ownerName.toLowerCase().includes(e.target.value.toLowerCase()))
                              );
                              if (match && e.target.value.length > 2) {
                                setSuggestedEmail(localStorage.getItem("vxcrm_last_active_email") || match.email || "ნაპოვნია ლოკალური მონაცემები");
                              } else {
                                setSuggestedEmail(null);
                              }
                            }
                          } catch (err) {}
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                      />
                    </div>
                  </div>

                  {suggestedEmail && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 rounded-xl text-xs space-y-1">
                      <span className="text-[9px] font-bold uppercase text-emerald-500 block">შემოთავაზებული ელ-ფოსტა:</span>
                      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="font-mono text-white select-all font-semibold">{suggestedEmail}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(suggestedEmail);
                            setSuccessMsg("დაკოპირდა!");
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
                        >
                          კოპირება
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {recoveryTab === "backup" && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    რათა <b>თქვენი მონაცემები არასოდეს დაიკარგოს</b>, ნებისმიერ დროს ჩამოტვირთეთ მთლიანი CRM მონაცემთა ბაზის უსაფრთხო სარეზერვო ფაილი.
                  </p>

                  <div className="grid grid-cols-1 gap-3.5">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-100 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      მონაცემების ჩამოტვირთვა (JSON Backup)
                    </button>

                    <div className="border border-dashed border-slate-800 rounded-2xl p-4 text-center space-y-2.5">
                      <div className="mx-auto w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                        <Upload className="w-4 h-4 text-indigo-400" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">ატვირთეთ VisionX CRM სარეზერვო .json ფაილი აღსადგენად</p>
                      <label className="inline-block px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer">
                        ფაილის არჩევა
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isSupabaseConfigured ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isSignUp ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  შესვლა
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSignUp ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  რეგისტრაცია
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              {isSignUp && (
                <div className="grid grid-cols-1 gap-3 animate-fade-in">
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="ბიზნესის დასახელება (მაგ: სალონი X)"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                    />
                  </div>

                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="თქვენი სახელი და გვარი"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="ელ-ფოსტა"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="პაროლი (მინ. 6 სიმბოლო)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "გთხოვთ დაელოდოთ..." : isSignUp ? "რეგისტრაცია" : "შესვლა"}
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRecovery(true); setError(null); setSuccessMsg(null); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline cursor-pointer"
                  id="forgot-password-recovery-link"
                >
                  დაგავიწყდათ პაროლი ან ელ-ფოსტა?
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs space-y-2 text-amber-400">
                <p className="font-bold text-amber-300">Supabase არ არის დაკავშირებული</p>
                <p className="leading-relaxed text-slate-300">
                  სრული ღრუბლოვანი სინქრონიზაციისთვის და იზოლირებული ანგარიშების გამოსაყენებლად, ჩაწერეთ კავშირის პარამეტრები AI Studio-ს მარჯვენა მენიუში (Secrets).
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onContinueLocal(true)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  ცარიელი CRM-ის გახსნა (ლოკალური)
                </button>
                <button
                  onClick={() => onContinueLocal(false)}
                  className="w-full py-2.5 bg-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  დემო მონაცემებით ტესტირება (ლოკალური)
                </button>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => { setShowRecovery(true); setError(null); setSuccessMsg(null); setRecoveryTab("backup"); }}
                  className="w-full py-2.5 bg-indigo-950/40 hover:bg-indigo-900/30 text-indigo-400 font-bold text-xs rounded-xl transition-all border border-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  id="local-recovery-backup-link"
                >
                  <Download className="w-3.5 h-3.5" />
                  მონაცემთა სარეზერვო ასლი & აღდგენა
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer credits */}
      <div className="text-center text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
        VisionX CRM &copy; {new Date().getFullYear()} &middot; Powered by Supabase
      </div>
    </div>
  );
}
