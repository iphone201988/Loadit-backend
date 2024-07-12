import express from "express";
import { jobController } from "../controllers/job.controller.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import jobSchema from "../schema/job.schema.js";
import { validate } from "../utils/helper.js";

const router = express.Router();

router.post(
  "/createJob",
  authenticationMiddleware,
  validate(jobSchema.createJobValidation),
  jobController.createJob
);

export default router;
