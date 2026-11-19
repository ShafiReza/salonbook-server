// import cors from "cors";
// import express from "express";
// import  helmet  from "helmet";
// import { toNodeHandler } from "better-auth/node";
// import { auth } from "./config/auth.js";
// import { env } from "./config/env.js";
// import { errorHandler, notFound } from "./middleware/errorHandler.js";
// import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
// import routes from "./routes/index.js";

// const app = express();
// app.set("trust proxy", 1);

// app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// app.use(
//   cors({
//     origin: [env.CLIENT_URL],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   }),
// );

// // Better Auth must be mounted BEFORE express.json() (it reads the body itself).
// app.use("/api/auth", authLimiter);
// app.all("/api/auth/*splat", toNodeHandler(auth));

// app.use(express.json({ limit: "1mb" }));

// app.get("/", (_req, res) => {
//   res.json({ success: true, name: "SalonBook API", status: "ok" });
// });
// app.get("/health", (_req, res) => {
//   res.json({ success: true, status: "ok", uptime: process.uptime() });
// });

// app.use("/api", apiLimiter, routes);

// app.use(notFound);
// app.use(errorHandler);

// export default app;
import cors from "cors";
import express from "express";
import * as helmetModule from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.js";
import routes from "./routes/index.js";

// Works whether the build treats this file as ESM or CommonJS.
const helmet = ((helmetModule as any).default ?? helmetModule) as (
  options?: Record<string, unknown>,
) => express.RequestHandler;

const app = express();
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [env.CLIENT_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Better Auth must be mounted BEFORE express.json() (it reads the body itself).
app.use("/api/auth", authLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ success: true, name: "SalonBook API", status: "ok" });
});
app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;