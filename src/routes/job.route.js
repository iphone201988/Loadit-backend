import express from "express";
import { jobController } from "../controllers/job.controller.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import jobSchema from "../schema/job.schema.js";
import { validate } from "../utils/helper.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateFiles } from "../middlewares/validateFiles.middleware.js";

const router = express.Router();

router.post(
  "/createJob",
  authenticationMiddleware,
  validate(jobSchema.createJobValidation),
  jobController.createJob
);

router.get(
  "/search",
  authenticationMiddleware,
  validate(jobSchema.searchByLocationValidation),
  jobController.searchByLocation
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
  "/applyForJob",
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
  upload.fields([
    { name: "pickupImage", maxCount: 1 },
    { name: "dropOffImage", maxCount: 1 },
  ]),
  validate(jobSchema.completeJobValidation),
  jobController.completeJob
);

router.put(
  "/quitJob",
  authenticationMiddleware,
  validate(jobSchema.quitJobValidation),
  jobController.quitJob
);

router.put(
  "/updateDeliveryStatus/:jobId",
  authenticationMiddleware,
  validate(jobSchema.updateDeliveryStatusValidation),
  jobController.updateDeliveryStatus
);

router.put(
  "/updateDropOffStatus/:jobId",
  authenticationMiddleware,
  upload.fields([
    { name: "pickupImage", maxCount: 1 },
    { name: "dropOffImage", maxCount: 1 },
  ]),
  validate(jobSchema.updateDropOffStatusValidation),
  jobController.updateDropOffStatus
);

router.post(
  "/customerReview",
  authenticationMiddleware,
  validate(jobSchema.giveCustomerReviewValidation),
  jobController.giveCustomerReview
);

router.post(
  "/recognizeFace",
  authenticationMiddleware,
  upload.single("faceImage"),
  validateFiles(["faceImage"]),
  validate(jobSchema.recognizeFaceValidation),
  jobController.recognizeFace
);

export default router;
