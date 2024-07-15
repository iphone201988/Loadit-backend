import express from "express";
import userRoutes from "./user.route.js";
import jobRoutes from "./job.route.js";
import cardRouter from "./card.js";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/job", jobRoutes);
router.use("/", cardRouter);

export default router;
