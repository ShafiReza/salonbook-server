import mongoose from "mongoose";
import { env } from "./env.js";
import { Appointment } from "../models/appointment.model.js";
import { Service } from "../models/service.model.js";
import { Transaction } from "../models/transaction.model.js";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  // Make sure unique/partial indexes exist before serving traffic
  await Promise.all([Appointment.init(), Service.init(), Transaction.init()]);
  console.log("MongoDB connected");
}
