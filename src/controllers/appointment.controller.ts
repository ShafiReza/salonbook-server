
import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth.js";
import * as svc from "../services/appointment.service.js";
import { sendOk } from "../utils/helpers.js";
import { parseId } from "../utils/objectId.js";
import {
  appointmentQuerySchema,
  availabilityQuerySchema,
  createAppointmentSchema,
} from "../validators/appointment.validator.js";

export async function create(req: Request, res: Response) {
  const user = currentUser(req);
  const appointment = await svc.createAppointment(user.id, createAppointmentSchema.parse(req.body));
  sendOk(res, appointment, 201, "Appointment request submitted");
}
export async function mine(req: Request, res: Response) {
  sendOk(res, await svc.listMyAppointments(currentUser(req).id, appointmentQuerySchema.parse(req.query)));
}
export async function all(req: Request, res: Response) {
  sendOk(res, await svc.listAllAppointments(appointmentQuerySchema.parse(req.query)));
}
export async function availability(req: Request, res: Response) {
  const { date } = availabilityQuerySchema.parse(req.query);
  sendOk(res, await svc.getAvailability(date));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await svc.getAppointment(parseId(req.params.id, "appointment"), currentUser(req)));
}
export async function cancel(req: Request, res: Response) {
  sendOk(res, await svc.cancelAppointment(parseId(req.params.id, "appointment"), currentUser(req)), 200, "Appointment cancelled");
}
export async function confirm(req: Request, res: Response) {
  sendOk(res, await svc.confirmAppointment(parseId(req.params.id, "appointment")), 200, "Appointment confirmed");
}
