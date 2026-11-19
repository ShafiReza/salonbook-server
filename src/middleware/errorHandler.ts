import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { isProd } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, code: err.code, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    const first = issues[0];
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: first ? (first.path ? `${first.path}: ${first.message}` : first.message) : "Validation failed",
      details: issues,
    });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: err.message });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, code: "BAD_REQUEST", message: `Invalid value for ${err.path}` });
    return;
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image must be 5MB or smaller" : err.message;
    res.status(400).json({ success: false, code: "UPLOAD_ERROR", message });
    return;
  }
  if (err?.code === 11000) {
    res.status(409).json({ success: false, code: "DUPLICATE", message: "A record with these details already exists" });
    return;
  }
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ success: false, message: err.message || "Bad request" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: isProd ? "Something went wrong on our side. Please try again." : String(err?.message ?? err),
  });
};
