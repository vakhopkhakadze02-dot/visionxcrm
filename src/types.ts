/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CurrencyCode = "GEL" | "USD" | "EUR" | "GBP";

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  role: string; // e.g., "მფლობელი"
  phone?: string;
  email?: string;
  address?: string;
  category?: string; // e.g., "სილამაზის სალონი", "ავტოსერვისი", "სტომატოლოგია"
  logoColor: string; // Tailwind bg color class
  currency?: CurrencyCode;
}

export function formatPrice(price: number, currency: CurrencyCode = "GEL"): string {
  const num = Number(price) || 0;
  if (currency === "USD") {
    return `$${num.toLocaleString("en-US")}`;
  }
  if (currency === "EUR") {
    return `€${num.toLocaleString("de-DE")}`;
  }
  if (currency === "GBP") {
    return `£${num.toLocaleString("en-GB")}`;
  }
  return `${num.toLocaleString("ka-GE")} ₾`;
}

export interface CommunicationItem {
  id: string;
  type: "call" | "sms" | "email" | "whatsapp" | "facebook";
  date: string;
  summary: string;
  author: string;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "pdf" | "image" | "doc";
  uploadedAt: string;
  url?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  source?: "Facebook" | "Website" | "WhatsApp" | "Google Ads" | "Instagram" | "Direct";
  leadValue?: number;
  totalBookings: number;
  totalSpent: number;
  notes?: string;
  tag?: string; // "წარმატებული გარიგება" | "მუშაობის პროცესში" | "წარუმატებლად დახურული" | "ახალი ლიდი"
  assignedStaffId?: string;
  communications?: CommunicationItem[];
  attachments?: FileAttachment[];
}

export interface DocumentInvoice {
  id: string;
  businessId: string;
  clientId: string;
  clientName: string;
  docType: "proposal" | "contract" | "invoice"; // შეთავაზება, ხელშეკრულება, ინვოისი
  docNumber: string;
  title: string;
  amount: number;
  /** Currency this document was issued in. Absent on records predating the column. */
  currency?: CurrencyCode;
  date: string; // YYYY-MM-DD
  dueDate?: string;
  status: "გადახდილი" | "მოლოდინში" | "გაგზავნილი" | "გაუქმებული";
  items?: { name: string; qty: number; price: number }[];
  notes?: string;
}

export interface WorkflowAutomation {
  id: string;
  businessId: string;
  title: string;
  triggerEvent: "new_lead" | "status_change" | "overdue_task" | "booking_created";
  triggerLabel: string;
  actionType: "send_sms" | "send_email" | "assign_staff" | "create_followup";
  actionLabel: string;
  enabled: boolean;
  executionCount: number;
}

export interface IntegrationConfig {
  facebookLeadAds: boolean;
  whatsappBusiness: boolean;
  gmailOutlook: boolean;
  googleCalendar: boolean;
  telegramBot: boolean;
  stripePayPal: boolean;
  facebookPageToken?: string;
  whatsappApiKey?: string;
  gmailAddress?: string;
  googleCalendarEmail?: string;
  telegramBotToken?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  /** Currency this price was entered in. Absent on records predating the column. */
  currency?: CurrencyCode;
  duration: number; // in minutes
  category: string; // e.g., "თმა", "ფრჩხილები", "სახის მოვლა"
  color: string; // Tailwind text/bg color indicator
}

export interface Staff {
  id: string;
  name: string;
  role: string; // e.g., "უფროსი სტილისტი", "მანიკურის სპეციალისტი"
  email: string;
  phone: string;
  avatarColor: string;
  rating: number; // e.g. 4.8
  status: "აქტიური" | "შვებულებაში"; // Active or On leave
}

export interface Booking {
  id: string;
  businessId: string;
  clientId: string;
  serviceId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  /** Currency this price was agreed in. Absent on records predating the column. */
  currency?: CurrencyCode;
  status: "დასრულებული" | "მოლოდინში" | "გაუქმებული";
  notes?: string;
}

export interface NotificationLog {
  id: string;
  businessId: string;
  bookingId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  type: "sms" | "email";
  status: "გაგზავნილი" | "შეცდომა" | "დემო_გაგზავნილი";
  errorMessage?: string;
  sentAt: string;
  message: string;
}

/**
 * Delivery credentials deliberately live server-side (see
 * supabase/functions/send-notification), so only templates and toggles are here.
 */
export interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  smsTemplate: string;
  emailTemplate: string;
}

export interface Followup {
  id: string;
  businessId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: "call" | "message"; // call or message
  topic: string; // e.g. "ჯავშნის დადასტურება"
  status: "მოლოდინში" | "დასრულებული" | "გაუქმებული";
  notes?: string;
}

