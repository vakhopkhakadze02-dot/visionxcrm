/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
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

export interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  smsTemplate: string;
  emailTemplate: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsUserId?: string;
  emailjsAccessToken?: string;
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

