import { z } from "zod";
import { SERVICE_CATEGORIES, SERVICE_STATUSES } from "../config/constants.js";
import { cleanString, paginationSchema, searchSchema } from "./common.js";

export const serviceBodySchema = z.object({
  serviceName: cleanString(2, 120),
  category: z.enum(SERVICE_CATEGORIES),
  description: cleanString(10, 3000),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be positive").max(100000),
  duration: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .int("Duration must be a whole number of minutes")
    .positive("Duration must be positive")
    .max(720),
  image: z.string().trim().url("Image must be a valid URL").max(2000),
  status: z.enum(SERVICE_STATUSES).default("active"),
});

export const serviceStatusSchema = z.object({ status: z.enum(SERVICE_STATUSES) });

export const serviceQuerySchema = paginationSchema.extend({
  search: searchSchema,
  category: z.enum(SERVICE_CATEGORIES).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest"]).default("newest"),
  status: z.enum(SERVICE_STATUSES).optional(),
});

export type ServiceBody = z.infer<typeof serviceBodySchema>;
export type ServiceQuery = z.infer<typeof serviceQuerySchema>;
