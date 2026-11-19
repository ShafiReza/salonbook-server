export const SERVICE_CATEGORIES = [
  "Haircut & Styling",
  "Hair Coloring",
  "Hair Treatment",
  "Facial & Skincare",
  "Makeup",
  "Manicure & Pedicure",
  "Spa & Massage",
] as const;

export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
] as const;

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export const SERVICE_STATUSES = ["active", "inactive"] as const;
