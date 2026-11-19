import { z } from "zod";
import { cleanString, paginationSchema, searchSchema } from "./common.js";

export const updateProfileSchema = z
  .object({
    name: cleanString(2, 80).optional(),
    image: z.union([z.literal(""), z.string().trim().url("Image must be a valid URL").max(2000)]).optional(),
    phone: z
      .union([z.literal(""), z.string().trim().regex(/^[+\d][\d\s()-]{5,19}$/, "Enter a valid phone number")])
      .optional(),
    address: cleanString(0, 200).optional(),
  })
  .strict(); // unknown keys (e.g. role, isBlocked) are rejected, not silently ignored

export const userQuerySchema = paginationSchema.extend({
  search: searchSchema,
  blocked: z.enum(["true", "false"]).optional(),
});

export const transactionQuerySchema = paginationSchema.extend({
  search: searchSchema,
  status: z.enum(["paid", "failed"]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
