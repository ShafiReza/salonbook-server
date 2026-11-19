import type { Response } from "express";

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function sendOk(res: Response, data: unknown, status = 200, message?: string) {
  res.status(status).json({ success: true, ...(message ? { message } : {}), data });
}

export function buildPagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
