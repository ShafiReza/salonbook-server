import type { Request, Response } from "express";
import * as svc from "../services/service.service.js";
import { sendOk } from "../utils/helpers.js";
import { parseId } from "../utils/objectId.js";
import { serviceBodySchema, serviceQuerySchema, serviceStatusSchema } from "../validators/service.validator.js";

export async function list(req: Request, res: Response) {
  sendOk(res, await svc.listServices(serviceQuerySchema.parse(req.query), false));
}
export async function listAdmin(req: Request, res: Response) {
  sendOk(res, await svc.listServices(serviceQuerySchema.parse(req.query), true));
}
export async function getOne(req: Request, res: Response) {
  sendOk(res, await svc.getService(parseId(req.params.id, "service")));
}
export async function create(req: Request, res: Response) {
  sendOk(res, await svc.createService(serviceBodySchema.parse(req.body)), 201, "Service created");
}
export async function update(req: Request, res: Response) {
  sendOk(res, await svc.updateService(parseId(req.params.id, "service"), serviceBodySchema.parse(req.body)), 200, "Service updated");
}
export async function setStatus(req: Request, res: Response) {
  const { status } = serviceStatusSchema.parse(req.body);
  sendOk(res, await svc.setServiceStatus(parseId(req.params.id, "service"), status), 200, `Service ${status === "active" ? "activated" : "deactivated"}`);
}
export async function remove(req: Request, res: Response) {
  await svc.deleteService(parseId(req.params.id, "service"));
  sendOk(res, null, 200, "Service deleted");
}
