import { Schema, model } from "mongoose";
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from "../config/constants.js";

const serviceSchema = new Schema(
  {
    serviceName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    category: { type: String, enum: [...SERVICE_CATEGORIES], required: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: [0.01, "Price must be positive"] },
    duration: { type: Number, required: true, min: [1, "Duration must be positive"] },
    image: { type: String, required: true },
    status: { type: String, enum: [...SERVICE_STATUSES], default: "active" },
  },
  { timestamps: true },
);

serviceSchema.index({ status: 1, price: 1 });
serviceSchema.index({ status: 1, category: 1 });
serviceSchema.index({ serviceName: 1 });
serviceSchema.index({ createdAt: -1 });

export const Service = model("Service", serviceSchema);
