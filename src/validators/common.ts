import { z } from "zod";

/** Trim, bound the length and strip angle brackets from free text. */
export const cleanString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`)
    .transform((s) => s.replace(/[<>]/g, ""));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const searchSchema = z.string().trim().max(100).optional();
