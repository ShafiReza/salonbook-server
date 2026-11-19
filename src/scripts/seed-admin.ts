/**
 * Trusted server-side admin creation. Public registration can only ever create customers.
 * Usage: set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env, then `npm run seed:admin`.
 */
import { auth, authDb, mongoClient } from "../config/auth.js";
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from "../utils/password.js";

const name = process.env.ADMIN_NAME?.trim() || "SalonBook Admin";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

async function main() {
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  if (!isStrongPassword(password)) throw new Error(PASSWORD_RULE_MESSAGE);

  const users = authDb.collection("users");
  const existing = await users.findOne({ email });
  if (!existing) {
    await auth.api.signUpEmail({ body: { name, email, password } });
    console.log(`Created account for ${email}`);
  } else {
    console.log(`Account ${email} already exists, promoting to admin`);
  }
  await users.updateOne({ email }, { $set: { role: "admin", isBlocked: false, emailVerified: true, updatedAt: new Date() } });
  console.log(`✔ ${email} is now an admin`);
}

main()
  .catch((err) => {
    console.error("Seeding admin failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoClient.close());
