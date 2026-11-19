import { Schema, model } from "mongoose";

// Better Auth owns this collection (name, email, image, role, isBlocked, ...).
// This model only gives the application typed access to it.
const userSchema = new Schema(
  {
    name: String,
    email: String,
    image: String,
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    isBlocked: { type: Boolean, default: false },
    phone: String,
    address: String,
    emailVerified: Boolean,
  },
  { collection: "users", strict: false, timestamps: false },
);

export const User = model("User", userSchema);
