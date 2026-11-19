import app from "./app.js";
import { mongoClient } from "./config/auth.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import mongoose from "mongoose";

await connectDB();

const server = app.listen(env.PORT, () => {
  console.log(`SalonBook API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await Promise.allSettled([mongoose.disconnect(), mongoClient.close()]);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
