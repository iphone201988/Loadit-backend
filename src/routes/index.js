import express from "express";
import userRoutes from "./user.route.js";
import jobRoutes from "./job.route.js";
import cardRouter from "./card.route.js";
import paymentRouter from "./payment.route.js";
import notificationRouter from "./notification.route.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/job", jobRoutes);
router.use("/", cardRouter);
router.use("/payment", paymentRouter);
router.use("/notification", notificationRouter);

export default router;
