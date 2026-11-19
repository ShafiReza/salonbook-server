import type { Request, Response } from "express";
import { currentUser } from "../middleware/auth.js";
import * as svc from "../services/user.service.js";
import { sendOk } from "../utils/helpers.js";
import { parseId } from "../utils/objectId.js";
import { updateProfileSchema, userQuerySchema } from "../validators/user.validator.js";

export async function me(req: Request, res: Response) {
  sendOk(res, await svc.getMe(currentUser(req).id));
}
export async function updateProfile(req: Request, res: Response) {
  sendOk(res, await svc.updateProfile(currentUser(req).id, updateProfileSchema.parse(req.body)), 200, "Profile updated");
}
export async function list(req: Request, res: Response) {
  sendOk(res, await svc.listCustomers(userQuerySchema.parse(req.query)));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await svc.getCustomer(parseId(req.params.id, "user")));
}
export async function block(req: Request, res: Response) {
  sendOk(res, await svc.setBlocked(parseId(req.params.id, "user"), true), 200, "Customer blocked");
}
export async function unblock(req: Request, res: Response) {
  sendOk(res, await svc.setBlocked(parseId(req.params.id, "user"), false), 200, "Customer unblocked");
}
