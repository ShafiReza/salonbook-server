
import Stripe from "stripe";
import { env } from "../config/env.js";
import { Appointment } from "../models/appointment.model.js";
import { Transaction } from "../models/transaction.model.js";
import { User } from "../models/user.model.js";
import type { AuthUser } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, escapeRegex } from "../utils/helpers.js";
import type { TransactionQuery } from "../validators/user.validator.js";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const toMinorUnits = (amount: number) => Math.round(amount * 100);

export async function createCheckoutSession(user: AuthUser, appointmentId: string) {
  // Ownership is part of the query: someone else's appointment simply does not exist for this caller
  const appt = await Appointment.findOne({ _id: appointmentId, customerId: user.id })
    .populate<{ serviceId: { serviceName: string } | null }>("serviceId", "serviceName")
    .lean();
  if (!appt) throw ApiError.notFound("Appointment not found");
  if (appt.status === "cancelled") throw ApiError.conflict("Cancelled appointments cannot be paid");
  if (appt.status !== "confirmed") throw ApiError.conflict("You can pay once the salon confirms your appointment");
  if (appt.paymentStatus === "paid") throw ApiError.conflict("This appointment is already paid");

  // Amount always comes from the price stored in MongoDB, never from the client
  const unitAmount = toMinorUnits(appt.servicePrice);
  if (unitAmount <= 0) throw ApiError.badRequest("Invalid appointment amount");

  const dateLabel = appt.appointmentDate.toISOString().slice(0, 10);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: env.STRIPE_CURRENCY,
          unit_amount: unitAmount,
          product_data: {
            name: appt.serviceId?.serviceName ?? "Salon service",
            description: `Appointment on ${dateLabel} at ${appt.timeSlot}`,
          },
        },
      },
    ],
    metadata: { appointmentId: String(appt._id), customerId: user.id },
    success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/payment/cancel?appointment_id=${String(appt._id)}`,
  });
  if (!session.url) throw new ApiError(502, "Could not create a Stripe checkout session");
  return { url: session.url, sessionId: session.id, publishableKey: env.STRIPE_PUBLISHABLE_KEY };
}

async function fulfillPaidSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;

  const appt = await Appointment.findById(appointmentId).lean();
  if (!appt) {
    console.error(`Payment: appointment ${appointmentId} not found for session ${session.id}`);
    return;
  }
  // Defence in depth: the amount Stripe charged must match the price stored on the appointment
  if (session.amount_total !== toMinorUnits(appt.servicePrice) || session.currency !== env.STRIPE_CURRENCY.toLowerCase()) {
    console.error(`Payment: amount/currency mismatch for session ${session.id}`);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  // Upsert on the unique Stripe session id => retries / duplicate deliveries never create a second transaction
  await Transaction.updateOne(
    { stripeSessionId: session.id },
    {
      $setOnInsert: {
        appointmentId: appt._id,
        customerId: appt.customerId,
        amount: appt.servicePrice,
        currency: session.currency ?? env.STRIPE_CURRENCY,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        status: "paid",
      },
    },
    { upsert: true },
  ).catch((err: { code?: number }) => {
    if (err?.code !== 11000) throw err; // concurrent duplicate delivery: already stored
  });

  await Appointment.updateOne({ _id: appt._id, paymentStatus: "unpaid" }, { $set: { paymentStatus: "paid" } });
  console.log(`Payment recorded for appointment ${String(appt._id)} (session ${session.id})`);
}

/**
 * Verifies a Checkout Session directly with Stripe using the secret key (no webhook needed).
 * The browser only sends the session id; whether it was paid is decided by Stripe's API response.
 */
export async function getSessionStatus(userId: string, sessionId: string) {
  const existing = await Transaction.findOne({ stripeSessionId: sessionId, customerId: userId }).lean();
  if (existing) return { status: "paid" as const, appointmentId: existing.appointmentId };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    throw ApiError.notFound("Checkout session not found");
  }
  // A user can only verify their own sessions
  if (session.metadata?.customerId !== userId) throw ApiError.notFound("Checkout session not found");
  if (session.payment_status !== "paid") return { status: "pending" as const };

  await fulfillPaidSession(session);
  const tx = await Transaction.findOne({ stripeSessionId: sessionId, customerId: userId }).lean();
  return tx ? { status: "paid" as const, appointmentId: tx.appointmentId } : { status: "pending" as const };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function shapeTransaction(t: any) {
  const appt = t.appointmentId && t.appointmentId.timeSlot ? t.appointmentId : null;
  const service = appt?.serviceId && appt.serviceId.serviceName ? appt.serviceId : null;
  return {
    _id: t._id,
    amount: t.amount,
    currency: t.currency,
    stripeSessionId: t.stripeSessionId,
    status: t.status,
    createdAt: t.createdAt,
    appointment: appt ? { _id: appt._id, appointmentDate: appt.appointmentDate, timeSlot: appt.timeSlot } : null,
    service: service ? { _id: service._id, serviceName: service.serviceName, image: service.image } : null,
    customer: t.customerId && t.customerId.email ? t.customerId : null,
  };
}

async function listTransactions(filter: Record<string, unknown>, page: number, limit: number) {
  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "appointmentId", select: "appointmentDate timeSlot serviceId", populate: { path: "serviceId", select: "serviceName image" } })
      .populate("customerId", "name email image phone")
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  return { items: docs.map(shapeTransaction), pagination: buildPagination(page, limit, total) };
}

export async function listAllTransactions(q: TransactionQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id").lean();
    filter.$or = [{ stripeSessionId: rx }, { customerId: { $in: users.map((u) => u._id) } }];
  }
  return listTransactions(filter, q.page, q.limit);
}

export const listMyTransactions = (userId: string, q: TransactionQuery) =>
  listTransactions({ customerId: userId, ...(q.status ? { status: q.status } : {}) }, q.page, q.limit);
