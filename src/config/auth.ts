import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { env, isProd } from "./env.js";
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from "../utils/password.js";

// Native driver connection used by Better Auth (it manages users/session/account/verification/jwks).
export const mongoClient = new MongoClient(env.MONGODB_URI);
export const authDb = mongoClient.db();

const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  appName: "SalonBook",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(authDb),
  trustedOrigins: [env.CLIENT_URL],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          // The browser talks to Better Auth through the Next.js proxy (/api/auth/*),
          // so the OAuth callback must land on the CLIENT origin to keep cookies first-party.
          redirectURI: `${env.CLIENT_URL}/api/auth/callback/google`,
        },
      }
    : {},

  user: {
    // Application collection name required by the assignment
    modelName: "users",
    additionalFields: {
      // input:false => can never be set or changed by a client request
      role: { type: "string", required: false, defaultValue: "customer", input: false },
      isBlocked: { type: "boolean", required: false, defaultValue: false, input: false },
      phone: { type: "string", required: false, input: false },
      address: { type: "string", required: false, input: false },
    },
  },

  plugins: [
    // Issues short-lived JWTs (signed with a key pair stored in the `jwks` collection)
    // and publishes the public keys at /api/auth/jwks for Express to verify against.
    jwt({
      jwt: {
        expirationTime: "15m",
        definePayload: ({ user }) => ({ email: user.email }),
      },
    }),
  ],

  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: { sameSite: "lax", httpOnly: true },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const password = (ctx.body as { password?: unknown } | undefined)?.password;
        if (typeof password !== "string" || !isStrongPassword(password)) {
          throw new APIError("BAD_REQUEST", { message: PASSWORD_RULE_MESSAGE });
        }
      }
    }),
  },
});
