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

router.get(
  "/getJobDetails/:jobId",
  authenticationMiddleware,
  validate(jobSchema.getJobDetailsValidation),
  jobController.getJobDetails
);

router.get(
  "/getJobs",
  authenticationMiddleware,
  validate(jobSchema.getJobsValidation),
  jobController.getJobs
);

export default router;
