import { ObjectId } from "mongodb";
import { authDb } from "../config/auth.js";
import { Appointment } from "../models/appointment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, escapeRegex } from "../utils/helpers.js";
import type { UpdateProfileInput, UserQuery } from "../validators/user.validator.js";

const PUBLIC_FIELDS = "name email image phone address role isBlocked createdAt";

export async function getMe(id: string) {
  const user = await User.findById(id).select(PUBLIC_FIELDS).lean();
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) update.name = input.name;
  if (input.image !== undefined) update.image = input.image || null;
  if (input.phone !== undefined) update.phone = input.phone || null;
  if (input.address !== undefined) update.address = input.address || null;
  // Only whitelisted fields above are ever written: role / isBlocked can never change here
  await User.updateOne({ _id: id }, { $set: update });
  return getMe(id);
}

export async function listCustomers(q: UserQuery) {
  const filter: Record<string, unknown> = { role: "customer" };
  if (q.blocked) filter.isBlocked = q.blocked === "true";
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(q.page, q.limit, total) };
}

export async function getCustomer(id: string) {
  const user = await User.findOne({ _id: id, role: "customer" }).select(PUBLIC_FIELDS).lean();
  if (!user) throw ApiError.notFound("Customer not found");
  const [total, pending, confirmed, cancelled] = await Promise.all([
    Appointment.countDocuments({ customerId: id }),
    Appointment.countDocuments({ customerId: id, status: "pending" }),
    Appointment.countDocuments({ customerId: id, status: "confirmed" }),
    Appointment.countDocuments({ customerId: id, status: "cancelled" }),
  ]);
  return { ...user, appointmentStats: { total, pending, confirmed, cancelled } };
}

export async function setBlocked(id: string, blocked: boolean) {
  const user = await User.findOneAndUpdate(
    { _id: id, role: "customer" },
    { $set: { isBlocked: blocked, updatedAt: new Date() } },
    { new: true },
  )
    .select(PUBLIC_FIELDS)
    .lean();

  if (!user) {
    const exists = await User.exists({ _id: id });
    if (exists) throw ApiError.forbidden("Admin accounts cannot be blocked or unblocked");
    throw ApiError.notFound("Customer not found");
  }

  if (blocked) {
    // Drop live sessions so the customer is signed out everywhere (middleware also blocks every API call)
    try {
      await authDb.collection("session").deleteMany({ userId: { $in: [id, new ObjectId(id)] } } as never);
    } catch (err) {
      console.warn("Could not revoke sessions for blocked user:", err);
    }
  }
  return user;
}
