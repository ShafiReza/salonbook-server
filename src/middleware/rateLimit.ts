// import { rateLimit } from "express-rate-limit";

// const base = { standardHeaders: "draft-7" as const, legacyHeaders: false };
// const msg = (m: string) => ({ success: false, code: "RATE_LIMITED", message: m });

// export const apiLimiter = rateLimit({
//   ...base,
//   windowMs: 15 * 60 * 1000,
//   limit: 600,
//   message: msg("Too many requests. Please slow down."),
// });

// // Generous on purpose: when the browser reaches Better Auth through the Next.js proxy,
// // many users can share the proxy's egress IP.
// export const authLimiter = rateLimit({
//   ...base,
//   windowMs: 15 * 60 * 1000,
//   limit: 300,
//   skip: (req) => req.method === "GET",
//   message: msg("Too many authentication attempts. Try again later."),
// });

// export const uploadLimiter = rateLimit({
//   ...base,
//   windowMs: 60 * 60 * 1000,
//   limit: 40,
//   message: msg("Upload limit reached. Try again later."),
// });

// export const bookingLimiter = rateLimit({
//   ...base,
//   windowMs: 15 * 60 * 1000,
//   limit: 40,
//   message: msg("Too many booking attempts. Try again later."),
// });

// export const paymentLimiter = rateLimit({
//   ...base,
//   windowMs: 15 * 60 * 1000,
//   limit: 30,
//   message: msg("Too many payment attempts. Try again later."),
// });
import { rateLimit } from "express-rate-limit";

const base = { standardHeaders: "draft-7" as const, legacyHeaders: false };
const msg = (m: string) => ({ success: false, code: "RATE_LIMITED", message: m });

export const apiLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: msg("Too many requests. Please slow down."),
});

// Generous on purpose: when the browser reaches Better Auth through the Next.js proxy,
// many users can share the proxy's egress IP.
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 300,
  skip: (req) => req.method === "GET",
  message: msg("Too many authentication attempts. Try again later."),
});

export const uploadLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 40,
  message: msg("Upload limit reached. Try again later."),
});

export const bookingLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: msg("Too many booking attempts. Try again later."),
});

export const paymentLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: msg("Too many payment attempts. Try again later."),
});

