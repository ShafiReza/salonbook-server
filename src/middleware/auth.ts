import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import type { AuthUser, Role } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";

// Better Auth's jwt plugin publishes its public keys here. jose caches them and refetches on key rotation.
const jwks = createRemoteJWKSet(new URL(`${env.BETTER_AUTH_URL}/api/auth/jwks`));

/**
 * Verifies the Bearer JWT issued by Better Auth (signature, expiry, issuer, audience),
 * then loads the user from MongoDB so role / blocked status are ALWAYS taken from the database,
 * never from the client or from a possibly stale token.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw ApiError.unauthorized();

  let sub: string | undefined;
  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, {
      issuer: env.BETTER_AUTH_URL,
      audience: env.BETTER_AUTH_URL,
    });
    sub = payload.sub;
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
  if (!sub || !/^[a-f\d]{24}$/i.test(sub)) throw ApiError.unauthorized("Invalid token subject");

  const user = await User.findById(sub).lean();
  if (!user) throw ApiError.unauthorized("Account not found");
  if (user.isBlocked) throw ApiError.forbidden("Your account has been blocked. Contact support.", "ACCOUNT_BLOCKED");

  req.user = {
    id: String(user._id),
    role: user.role === "admin" ? "admin" : "customer",
    email: user.email ?? "",
    name: user.name ?? "",
  };
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden("You are not allowed to access this resource");
    next();
  };

export const requireAdmin = requireRole("admin");
export const requireCustomer = requireRole("customer");

export function currentUser(req: Request): AuthUser {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
