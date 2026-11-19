import { Schema, model } from "mongoose";
import { APPOINTMENT_STATUSES, PAYMENT_STATUSES, TIME_SLOTS } from "../config/constants.js";

const appointmentSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, enum: [...TIME_SLOTS], required: true },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    // Price captured at booking time so history survives later price changes
    servicePrice: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: [...PAYMENT_STATUSES], default: "unpaid" },
    status: { type: String, enum: [...APPOINTMENT_STATUSES], default: "pending" },
    // true while pending/confirmed. Drives the partial unique index below.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Race-condition proof double-booking guard: only ONE active appointment per date + time slot.
// Cancelled appointments have isActive=false and free the slot again.
appointmentSchema.index(
  { appointmentDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: "uniq_active_slot" },
);
appointmentSchema.index({ customerId: 1, createdAt: -1 });
appointmentSchema.index({ status: 1, createdAt: -1 });

export const Appointment = model("Appointment", appointmentSchema);
