import { z } from "zod";
import { APPOINTMENT_STATUSES, TIME_SLOTS } from "../config/constants.js";
import { isValidDateString } from "../utils/date.js";
import { cleanString, paginationSchema, searchSchema } from "./common.js";

const dateString = z.string().refine(isValidDateString, "Date must be a valid YYYY-MM-DD date");

export const createAppointmentSchema = z.object({
  serviceId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid service ID"),
  appointmentDate: dateString,
  timeSlot: z.enum(TIME_SLOTS, { errorMap: () => ({ message: "Choose a valid time slot" }) }),
  message: cleanString(0, 500).optional().default(""),
});

export const appointmentQuerySchema = paginationSchema.extend({
  search: searchSchema,
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

export const availabilityQuerySchema = z.object({ date: dateString });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
