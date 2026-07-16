/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Business, Client, Service, Staff, Booking } from "./types";

export const initialBusinesses: Business[] = [
  {
    id: "bus_1",
    name: "სალონი1",
    ownerName: "ვახტანგ ფხაკაძე",
    role: "მფლობელი",
    phone: "+995 555 11 22 33",
    email: "owner@salon1.ge",
    address: "ჭავჭავაძის გამზირი 37, თბილისი",
    category: "სილამაზის სალონი",
    logoColor: "bg-violet-600 text-white"
  },
  {
    id: "bus_2",
    name: "სტომატოლოგია დენტი",
    ownerName: "ვახტანგ ფხაკაძე",
    role: "მფლობელი",
    phone: "+995 599 44 55 66",
    email: "info@denti.ge",
    address: "ყაზბეგის გამზირი 14ა, თბილისი",
    category: "სტომატოლოგიური კლინიკა",
    logoColor: "bg-blue-600 text-white"
  },
  {
    id: "bus_3",
    name: "ავტო სერვისი პრო",
    ownerName: "ვახტანგ ფხაკაძე",
    role: "მფლობელი",
    phone: "+995 577 77 88 99",
    email: "contact@autoservice.ge",
    address: "წერეთლის გამზირი 116, თბილისი",
    category: "ავტოტექმომსახურება",
    logoColor: "bg-emerald-600 text-white"
  }
];

export const initialClients: Client[] = [
  {
    id: "cli_1",
    name: "ნიკოლოზ ბერიძე",
    phone: "+995 555 12 34 56",
    email: "nikoloz.b@gmail.com",
    totalBookings: 12,
    totalSpent: 420,
    notes: "ურჩევნია ყავა უშაქროდ. თმის შეჭრა მხოლოდ ანასთან.",
    tag: "წარმატებული გარიგება"
  },
  {
    id: "cli_2",
    name: "მარიამ კაპანაძე",
    phone: "+995 599 98 76 54",
    email: "mariam.k@gmail.com",
    totalBookings: 8,
    totalSpent: 320,
    notes: "მგრძნობიარე კანი, საჭიროებს ნატურალურ კოსმეტიკას.",
    tag: "მუშაობის პროცესში"
  },
  {
    id: "cli_3",
    name: "გიორგი მახარაძე",
    phone: "+995 577 45 61 23",
    email: "giorgi.m@yahoo.com",
    totalBookings: 5,
    totalSpent: 100,
    notes: "წვერის კორექცია 2 კვირაში ერთხელ.",
    tag: "წარუმატებლად დახურული"
  },
  {
    id: "cli_4",
    name: "ლიკა შენგელია",
    phone: "+995 591 32 16 54",
    email: "lika.sh@gmail.com",
    totalBookings: 15,
    totalSpent: 850,
    notes: "მუდმივი კლიენტი. იკეთებს მანიკურსა და თმის შეღებვას.",
    tag: "წარმატებული გარიგება"
  },
  {
    id: "cli_5",
    name: "დავით ლომიძე",
    phone: "+995 595 78 94 56",
    email: "david.l@gmail.com",
    totalBookings: 3,
    totalSpent: 105,
    notes: "თმის შეჭრა ყოველი თვის ბოლოს.",
    tag: "მუშაობის პროცესში"
  },
  {
    id: "cli_6",
    name: "ნინო თოდუა",
    phone: "+995 593 11 22 33",
    email: "nino.t@gmail.com",
    totalBookings: 6,
    totalSpent: 270,
    notes: "პედიკური და კოსმეტოლოგიური პროცედურები.",
    tag: "წარმატებული გარიგება"
  }
];

export const initialServices: Service[] = [
  {
    id: "ser_1",
    name: "თმის შეჭრა & ვარცხნილობა",
    price: 35,
    duration: 45,
    category: "თმის მოვლა",
    color: "emerald"
  },
  {
    id: "ser_2",
    name: "წვერის კორექცია",
    price: 20,
    duration: 30,
    category: "თმის მოვლა",
    color: "teal"
  },
  {
    id: "ser_3",
    name: "მანიკური",
    price: 40,
    duration: 60,
    category: "ფრჩხილები",
    color: "pink"
  },
  {
    id: "ser_4",
    name: "პედიკური",
    price: 55,
    duration: 75,
    category: "ფრჩხილები",
    color: "purple"
  },
  {
    id: "ser_5",
    name: "სახის წმენდა",
    price: 70,
    duration: 90,
    category: "კოსმეტოლოგია",
    color: "amber"
  },
  {
    id: "ser_6",
    name: "თმის შეღებვა",
    price: 120,
    duration: 120,
    category: "თმის მოვლა",
    color: "blue"
  }
];

export const initialStaff: Staff[] = [
  {
    id: "stf_1",
    name: "ანა მეგრელიძე",
    role: "უფროსი სტილისტი",
    email: "ana.m@visionx.ge",
    phone: "+995 555 11 44 77",
    avatarColor: "bg-indigo-600 text-white",
    rating: 4.9,
    status: "აქტიური"
  },
  {
    id: "stf_2",
    name: "დავით კალანდაძე",
    role: "ბარბერი / სტილისტი",
    email: "david.k@visionx.ge",
    phone: "+995 599 22 55 88",
    avatarColor: "bg-teal-600 text-white",
    rating: 4.8,
    status: "აქტიური"
  },
  {
    id: "stf_3",
    name: "ელენე ფანჩულიძე",
    role: "ფრჩხილის ტექნიკოსი",
    email: "elene.p@visionx.ge",
    phone: "+995 577 33 66 99",
    avatarColor: "bg-pink-600 text-white",
    rating: 4.7,
    status: "აქტიური"
  },
  {
    id: "stf_4",
    name: "გიორგი გელაშვილი",
    role: "კოსმეტოლოგი",
    email: "giorgi.g@visionx.ge",
    phone: "+995 591 44 77 00",
    avatarColor: "bg-amber-600 text-white",
    rating: 4.9,
    status: "შვებულებაში"
  }
];

// Let's create some past and current bookings.
// Current local time metadata is Sunday, 12 July 2026.
export const initialBookings: Booking[] = [
  {
    id: "bok_1",
    businessId: "bus_1",
    clientId: "cli_1",
    serviceId: "ser_1",
    staffId: "stf_1",
    date: "2026-07-12",
    time: "10:30",
    price: 35,
    status: "დასრულებული",
    notes: "მუდმივი სტილი, კლასიკური შეჭრა."
  },
  {
    id: "bok_2",
    businessId: "bus_1",
    clientId: "cli_2",
    serviceId: "ser_3",
    staffId: "stf_3",
    date: "2026-07-12",
    time: "12:00",
    price: 40,
    status: "მოლოდინში",
    notes: "ნაზი ფერი სასურველია."
  },
  {
    id: "bok_3",
    businessId: "bus_1",
    clientId: "cli_3",
    serviceId: "ser_2",
    staffId: "stf_2",
    date: "2026-07-12",
    time: "14:30",
    price: 20,
    status: "მოლოდინში"
  },
  {
    id: "bok_4",
    businessId: "bus_1",
    clientId: "cli_4",
    serviceId: "ser_6",
    staffId: "stf_1",
    date: "2026-07-12",
    time: "16:00",
    price: 120,
    status: "მოლოდინში",
    notes: "საჭიროა გაღიავება ჯერ."
  },
  // Yesterday's bookings (July 11)
  {
    id: "bok_5",
    businessId: "bus_1",
    clientId: "cli_5",
    serviceId: "ser_1",
    staffId: "stf_1",
    date: "2026-07-11",
    time: "11:00",
    price: 35,
    status: "დასრულებული"
  },
  {
    id: "bok_6",
    businessId: "bus_1",
    clientId: "cli_6",
    serviceId: "ser_5",
    staffId: "stf_4",
    date: "2026-07-11",
    time: "15:00",
    price: 70,
    status: "დასრულებული"
  },
  // Earlier this week (July 10)
  {
    id: "bok_7",
    businessId: "bus_1",
    clientId: "cli_1",
    serviceId: "ser_1",
    staffId: "stf_2",
    date: "2026-07-10",
    time: "13:00",
    price: 35,
    status: "დასრულებული"
  },
  {
    id: "bok_8",
    businessId: "bus_1",
    clientId: "cli_2",
    serviceId: "ser_4",
    staffId: "stf_3",
    date: "2026-07-10",
    time: "16:30",
    price: 55,
    status: "დასრულებული"
  },
  // Earlier this week (July 09)
  {
    id: "bok_9",
    businessId: "bus_1",
    clientId: "cli_3",
    serviceId: "ser_2",
    staffId: "stf_2",
    date: "2026-07-09",
    time: "10:00",
    price: 20,
    status: "დასრულებული"
  },
  {
    id: "bok_10",
    businessId: "bus_1",
    clientId: "cli_4",
    serviceId: "ser_3",
    staffId: "stf_3",
    date: "2026-07-09",
    time: "12:00",
    price: 40,
    status: "დასრულებული"
  },
  {
    id: "bok_11",
    businessId: "bus_1",
    clientId: "cli_5",
    serviceId: "ser_1",
    staffId: "stf_1",
    date: "2026-07-08",
    time: "15:00",
    price: 35,
    status: "დასრულებული"
  },
  {
    id: "bok_12",
    businessId: "bus_1",
    clientId: "cli_6",
    serviceId: "ser_4",
    staffId: "stf_3",
    date: "2026-07-07",
    time: "17:00",
    price: 55,
    status: "დასრულებული"
  },
  {
    id: "bok_13",
    businessId: "bus_1",
    clientId: "cli_2",
    serviceId: "ser_5",
    staffId: "stf_4",
    date: "2026-07-06",
    time: "11:30",
    price: 70,
    status: "დასრულებული"
  },
  // Some bookings for the auto service business (bus_3)
  {
    id: "bok_14",
    businessId: "bus_3",
    clientId: "cli_5",
    serviceId: "ser_1",
    staffId: "stf_2",
    date: "2026-07-12",
    time: "11:00",
    price: 150,
    status: "მოლოდინში",
    notes: "ზეთის და ფილტრების შეცვლა."
  }
];
