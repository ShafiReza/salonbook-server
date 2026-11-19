// import mongoose from "mongoose";
// import { env } from "./env.js";
// import { Appointment } from "../models/appointment.model.js";
// import { Service } from "../models/service.model.js";
// import { Transaction } from "../models/transaction.model.js";

// export async function connectDB(): Promise<void> {
//   mongoose.set("strictQuery", true);
//   await mongoose.connect(env.MONGODB_URI);
//   // Make sure unique/partial indexes exist before serving traffic
//   await Promise.all([Appointment.init(), Service.init(), Transaction.init()]);
//   console.log("MongoDB connected");
// }

import mongoose from "mongoose";
import { env } from "./env.js";
import { Appointment } from "../models/appointment.model.js";
import { Service } from "../models/service.model.js";
import { Transaction } from "../models/transaction.model.js";

let connecting: Promise<void> | null = null;

// Safe to call on every request: reuses the live connection or the in-flight attempt.
export function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = (async () => {
      mongoose.set("strictQuery", true);
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      // Make sure unique/partial indexes exist before serving traffic
      await Promise.all([Appointment.init(), Service.init(), Transaction.init()]);
      console.log("MongoDB connected");
    })().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}
