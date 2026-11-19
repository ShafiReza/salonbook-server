import { Router } from "express";
import * as appt from "../controllers/appointment.controller.js";
import * as misc from "../controllers/misc.controller.js";
import * as pay from "../controllers/payment.controller.js";
import * as svc from "../controllers/service.controller.js";
import * as usr from "../controllers/user.controller.js";
import { authenticate, requireAdmin, requireCustomer } from "../middleware/auth.js";
import { bookingLimiter, paymentLimiter, uploadLimiter } from "../middleware/rateLimit.js";

const router = Router();

/* Services */
const services = Router();
services.get("/", svc.list);
services.get("/admin/list", authenticate, requireAdmin, svc.listAdmin);
services.get("/:id", svc.getOne);
services.post("/", authenticate, requireAdmin, svc.create);
services.put("/:id", authenticate, requireAdmin, svc.update);
services.patch("/:id/status", authenticate, requireAdmin, svc.setStatus);
services.delete("/:id", authenticate, requireAdmin, svc.remove);
router.use("/services", services);

/* Appointments */
const appointments = Router();
appointments.use(authenticate);
appointments.post("/", requireCustomer, bookingLimiter, appt.create);
appointments.get("/my", requireCustomer, appt.mine);
appointments.get("/availability", appt.availability);
appointments.get("/", requireAdmin, appt.all);
appointments.get("/:id", appt.getOne);
appointments.patch("/:id/cancel", appt.cancel);
appointments.patch("/:id/confirm", requireAdmin, appt.confirm);
router.use("/appointments", appointments);

/* Users */
const users = Router();
users.use(authenticate);
users.get("/me", usr.me);
users.patch("/profile", usr.updateProfile);
users.get("/", requireAdmin, usr.list);
users.get("/:id", requireAdmin, usr.getOne);
users.patch("/:id/block", requireAdmin, usr.block);
users.patch("/:id/unblock", requireAdmin, usr.unblock);
router.use("/users", users);

/* Transactions */
const transactions = Router();
transactions.use(authenticate);
transactions.get("/", requireAdmin, pay.allTransactions);
transactions.get("/my", requireCustomer, pay.myTransactions);
router.use("/transactions", transactions);

/* Payments (verified directly with Stripe via the secret key, no webhook) */
const payments = Router();
payments.use(authenticate);
payments.post("/checkout", requireCustomer, paymentLimiter, pay.checkout);
payments.get("/session/:sessionId", requireCustomer, pay.sessionStatus);
router.use("/payments", payments);

/* Stats */
const stats = Router();
stats.use(authenticate);
stats.get("/customer", requireCustomer, misc.customerOverview);
stats.get("/admin", requireAdmin, misc.adminOverview);
router.use("/stats", stats);

/* Uploads (public so the registration form can upload an avatar; strictly rate limited, images only, 5MB) */
router.post("/uploads/image", uploadLimiter, misc.imageUpload, misc.uploadImage);

export default router;
