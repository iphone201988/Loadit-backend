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
  "/getJobsByFilters",
  authenticationMiddleware,
  validate(jobSchema.getJobsByFiltersValidation),
  jobController.getJobsByFilters
);

router.get(
  "/getAllJobsOfCustomer",
  authenticationMiddleware,
  jobController.getAllJobsOfCustomer
);

router.get(
  "/getAvailableJobsForDriver",
  authenticationMiddleware,
  jobController.getAvailableJobsForDriver
);

router.put(
  "/applyForJob/:jobId",
  authenticationMiddleware,
  validate(jobSchema.applyJobValidation),
  jobController.applyForJob
);

router.get(
  "/getJobApplications/:jobId",
  authenticationMiddleware,
  validate(jobSchema.getJobApplicationsValidation),
  jobController.getJobApplications
);

router.put(
  "/selectJobDriver",
  authenticationMiddleware,
  validate(jobSchema.selectJobDriverValidation),
  jobController.selectJobDriver
);

router.put(
  "/completeJob",
  authenticationMiddleware,
  validate(jobSchema.completeJobValidation),
  jobController.completeJob
);

export default router;
