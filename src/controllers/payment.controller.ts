import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth.js";
import * as svc from "../services/payment.service.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOk } from "../utils/helpers.js";
import { parseId } from "../utils/objectId.js";
import { transactionQuerySchema } from "../validators/user.validator.js";

export async function checkout(req: Request, res: Response) {
  const appointmentId = parseId((req.body as { appointmentId?: string } | undefined)?.appointmentId, "appointment");
  sendOk(res, await svc.createCheckoutSession(currentUser(req), appointmentId), 201);
}

export async function sessionStatus(req: Request, res: Response) {
  const raw = req.params.sessionId;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw ApiError.badRequest("Invalid session ID");
  sendOk(res, await svc.getSessionStatus(currentUser(req).id, sessionId));
}

export async function allTransactions(req: Request, res: Response) {
  sendOk(res, await svc.listAllTransactions(transactionQuerySchema.parse(req.query)));
}
export async function myTransactions(req: Request, res: Response) {
  sendOk(res, await svc.listMyTransactions(currentUser(req).id, transactionQuerySchema.parse(req.query)));
}
