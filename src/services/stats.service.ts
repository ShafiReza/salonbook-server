import { Types } from "mongoose";
import { Appointment } from "../models/appointment.model.js";
import { Service } from "../models/service.model.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";

export async function customerStats(customerId: string) {
  const rows = await Appointment.aggregate<{ _id: string; count: number }>([
    { $match: { customerId: new Types.ObjectId(customerId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const by = (s: string) => rows.find((r) => r._id === s)?.count ?? 0;
  return {
    total: rows.reduce((sum, r) => sum + r.count, 0),
    pending: by("pending"),
    confirmed: by("confirmed"),
    cancelled: by("cancelled"),
  };
}

export async function adminStats() {
  const [customers, activeServices, appts, pay] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    Service.countDocuments({ status: "active" }),
    Appointment.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Transaction.aggregate<{ _id: null; count: number; revenue: number }>([
      { $match: { status: "paid" } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
    ]),
  ]);
  const by = (s: string) => appts.find((r) => r._id === s)?.count ?? 0;
  return {
    customers,
    activeServices,
    totalAppointments: appts.reduce((sum, r) => sum + r.count, 0),
    pending: by("pending"),
    confirmed: by("confirmed"),
    successfulPayments: pay[0]?.count ?? 0,
    revenue: pay[0]?.revenue ?? 0,
  };
}
