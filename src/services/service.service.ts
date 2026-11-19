import { Appointment } from "../models/appointment.model.js";
import { Service } from "../models/service.model.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, escapeRegex } from "../utils/helpers.js";
import type { ServiceBody, ServiceQuery } from "../validators/service.validator.js";

const sortMap: Record<ServiceQuery["sort"], Record<string, 1 | -1>> = {
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
};

export async function listServices(q: ServiceQuery, includeInactive: boolean) {
  const filter: Record<string, unknown> = {};
  if (!includeInactive) filter.status = "active";
  else if (q.status) filter.status = q.status;
  if (q.category) filter.category = q.category;
  if (q.search) filter.serviceName = { $regex: escapeRegex(q.search), $options: "i" };

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Service.find(filter).sort(sortMap[q.sort]).skip(skip).limit(q.limit).lean(),
    Service.countDocuments(filter),
  ]);
  return { items, pagination: buildPagination(q.page, q.limit, total) };
}

export async function getService(id: string) {
  const service = await Service.findById(id).lean();
  if (!service) throw ApiError.notFound("Service not found");
  return service;
}

export const createService = (body: ServiceBody) => Service.create(body);

export async function updateService(id: string, body: ServiceBody) {
  const service = await Service.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true }).lean();
  if (!service) throw ApiError.notFound("Service not found");
  return service;
}

export async function setServiceStatus(id: string, status: "active" | "inactive") {
  const service = await Service.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  if (!service) throw ApiError.notFound("Service not found");
  return service;
}

export async function deleteService(id: string) {
  const exists = await Service.exists({ _id: id });
  if (!exists) throw ApiError.notFound("Service not found");
  // Appointments keep a reference to the service, so a service with history is deactivated instead of deleted.
  const used = await Appointment.exists({ serviceId: id });
  if (used) {
    throw ApiError.conflict(
      "This service has appointment history and cannot be deleted. Deactivate it instead.",
      "SERVICE_HAS_APPOINTMENTS",
    );
  }
  await Service.deleteOne({ _id: id });
}
