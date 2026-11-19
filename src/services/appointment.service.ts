
import { Types } from "mongoose";
import { TIME_SLOTS } from "../config/constants.js";
import { Appointment } from "../models/appointment.model.js";
import { Service } from "../models/service.model.js";
import { User } from "../models/user.model.js";
import type { AuthUser } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { isSlotInPast, salonNow, toDateOnly } from "../utils/date.js";
import { buildPagination, escapeRegex } from "../utils/helpers.js";
import type { AppointmentQuery, CreateAppointmentInput } from "../validators/appointment.validator.js";

const SERVICE_FIELDS = "serviceName category image duration price status";
const CUSTOMER_FIELDS = "name email image phone";

/* eslint-disable @typescript-eslint/no-explicit-any */
function shape(doc: any) {
  const { serviceId, customerId, ...rest } = doc;
  return {
    ...rest,
    serviceId: serviceId?._id ?? serviceId ?? null,
    customerId: customerId?._id ?? customerId ?? null,
    service: serviceId && serviceId.serviceName ? serviceId : null,
    customer: customerId && customerId.email ? customerId : null,
  };
}

const slotTaken = () =>
  ApiError.conflict("That time slot is already booked. Please choose another slot.", "SLOT_TAKEN");

export async function createAppointment(customerId: string, input: CreateAppointmentInput) {
  const service = await Service.findById(input.serviceId).lean();
  if (!service) throw ApiError.notFound("Service not found");
  if (service.status !== "active") {
    throw ApiError.conflict("This service is currently unavailable for booking", "SERVICE_INACTIVE");
  }

  const today = salonNow().date;
  if (input.appointmentDate < today) throw ApiError.badRequest("You cannot book an appointment in the past");
  if (isSlotInPast(input.appointmentDate, input.timeSlot)) {
    throw ApiError.badRequest("That time slot has already passed. Choose a later slot.");
  }

  const appointmentDate = toDateOnly(input.appointmentDate);
  // Friendly early check; the partial unique index below is what actually guarantees no double booking.
  if (await Appointment.exists({ appointmentDate, timeSlot: input.timeSlot, isActive: true })) throw slotTaken();

  try {
    const created = await Appointment.create({
      serviceId: service._id,
      customerId,
      appointmentDate,
      timeSlot: input.timeSlot,
      message: input.message,
      servicePrice: service.price, // price snapshot taken server-side from MongoDB
      status: "pending",
      paymentStatus: "unpaid",
      isActive: true,
    });
    return created.toObject();
  } catch (err: any) {
    if (err?.code === 11000) throw slotTaken();
    throw err;
  }
}

export async function getAvailability(dateStr: string) {
  const booked = await Appointment.find({ appointmentDate: toDateOnly(dateStr), isActive: true })
    .select("timeSlot")
    .lean();
  const taken = new Set(booked.map((b) => b.timeSlot));
  const isPastDay = dateStr < salonNow().date;
  return {
    date: dateStr,
    slots: TIME_SLOTS.map((time) => ({
      time,
      available: !isPastDay && !taken.has(time) && !isSlotInPast(dateStr, time),
    })),
  };
}

async function paginated(filter: Record<string, unknown>, page: number, limit: number) {
  const [docs, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("serviceId", SERVICE_FIELDS)
      .populate("customerId", CUSTOMER_FIELDS)
      .lean(),
    Appointment.countDocuments(filter),
  ]);
  return { items: docs.map(shape), pagination: buildPagination(page, limit, total) };
}

export function listMyAppointments(customerId: string, q: AppointmentQuery) {
  const filter: Record<string, unknown> = { customerId: new Types.ObjectId(customerId) };
  if (q.status) filter.status = q.status;
  return paginated(filter, q.page, q.limit);
}

export async function listAllAppointments(q: AppointmentQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    const [users, services] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id").lean(),
      Service.find({ serviceName: rx }).select("_id").lean(),
    ]);
    filter.$or = [
      { customerId: { $in: users.map((u) => u._id) } },
      { serviceId: { $in: services.map((s) => s._id) } },
    ];
  }
  return paginated(filter, q.page, q.limit);
}

export async function getAppointment(id: string, user: AuthUser) {
  const doc: any = await Appointment.findById(id)
    .populate("serviceId", SERVICE_FIELDS)
    .populate("customerId", CUSTOMER_FIELDS)
    .lean();
  if (!doc) throw ApiError.notFound("Appointment not found");
  const ownerId = String(doc.customerId?._id ?? doc.customerId);
  // 404 (not 403) so other customers' appointment IDs cannot be probed
  if (user.role !== "admin" && ownerId !== user.id) throw ApiError.notFound("Appointment not found");
  return shape(doc);
}

export async function cancelAppointment(id: string, user: AuthUser) {
  const isAdmin = user.role === "admin";
  const filter: Record<string, unknown> = isAdmin
    ? { _id: id, status: { $in: ["pending", "confirmed"] }, paymentStatus: "unpaid" }
    : { _id: id, customerId: user.id, status: "pending" };

  // Single atomic conditional update: no check-then-write race
  const updated = await Appointment.findOneAndUpdate(
    filter,
    { $set: { status: "cancelled", isActive: false } },
    { new: true },
  ).lean();
  if (updated) return updated;

  const existing = await Appointment.findById(id).lean();
  if (!existing || (!isAdmin && String(existing.customerId) !== user.id)) {
    throw ApiError.notFound("Appointment not found");
  }
  if (existing.status === "cancelled") throw ApiError.conflict("This appointment is already cancelled");
  if (isAdmin && existing.paymentStatus === "paid") {
    throw ApiError.conflict("This appointment has been paid. Refund it in Stripe before cancelling.");
  }
  throw ApiError.conflict(
    isAdmin
      ? "Only pending or confirmed appointments can be cancelled"
      : "Only pending appointments can be cancelled. Please contact the salon for changes.",
  );
}

export async function confirmAppointment(id: string) {
  const updated = await Appointment.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: "confirmed" } },
    { new: true },
  ).lean();
  if (updated) return updated;

  const existing = await Appointment.findById(id).lean();
  if (!existing) throw ApiError.notFound("Appointment not found");
  throw ApiError.conflict(
    existing.status === "cancelled"
      ? "Cancelled appointments cannot be confirmed"
      : "Only pending appointments can be confirmed",
  );
}
