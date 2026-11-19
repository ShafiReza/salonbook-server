import type { Request, Response } from "express";
import multer from "multer";
import { currentUser } from "../middleware/auth.js";
import { adminStats, customerStats } from "../services/stats.service.js";
import { uploadToImgbb } from "../services/upload.service.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOk } from "../utils/helpers.js";

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, "Only JPG, PNG, WEBP or GIF images are allowed"));
  },
}).single("image");

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest("No image file provided (field name: image)");
  sendOk(res, { url: await uploadToImgbb(req.file.buffer) }, 201);
}

export async function customerOverview(req: Request, res: Response) {
  sendOk(res, await customerStats(currentUser(req).id));
}
export async function adminOverview(_req: Request, res: Response) {
  sendOk(res, await adminStats());
}
