import { Schema, model } from "mongoose";

const transactionSchema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    // Unique => the same Stripe session can never create two transactions
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String },
    status: { type: String, enum: ["paid", "failed"], required: true },
  },
  { timestamps: true },
);

transactionSchema.index({ createdAt: -1 });

export const Transaction = model("Transaction", transactionSchema);
