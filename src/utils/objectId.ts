import { isValidObjectId } from "mongoose";
import { ApiError } from "./ApiError.js";

export function parseId(raw: string | string[] | undefined, label = "resource"): string {
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id || !/^[a-f\d]{24}$/i.test(id) || !isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label} ID`);
  }
  return id;
}
