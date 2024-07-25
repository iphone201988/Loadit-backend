import { TryCatch, getImages } from "../utils/helper.js";
import Job from "../models/job.model.js";
import moment from "moment";
import httpStatus from "http-status";
import User from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { getUserById } from "../services/user.services.js";
import {
  fetchImage,
  getFilteredJobs,
  getJobById,
} from "../services/job.services.js";
import { deliveryStatus, userRole } from "../utils/enums/enums.js";
import Review from "../models/review.modal.js";

import path from "path";
import { fileURLToPath } from "url";
import * as faceapi from "@vladmandic/face-api";
import canvas from "canvas";

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsPath = path.join(__dirname, "../public/models");

// Load models
const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
};

// Load models once at startup
loadModels();

const createJob = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const {
    title,
    pickUpLocation,
    pickUpDate,
    pickUpTime,
    dropOffDate,
    dropOffTime,
    dropOffs,
    jobType,
  } = req.body;

  const user = await getUserById(userId);

  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  if (jobType == 1 && dropOffs.length > 1) {
    return next(
      new ErrorHandler(
        "Single dropoff job can only have one dropoff location",
        httpStatus.BAD_REQUEST
      )
    );
  }

  const formattedPickUpDate = moment(pickUpDate).format("YYYY-MM-DD");
  const formattedDropOffDate = moment(dropOffDate).format("YYYY-MM-DD");

  if (formattedPickUpDate > formattedDropOffDate)
    return next(
      new ErrorHandler(
        "Pickup date should be less than dropoff date",
        httpStatus.BAD_REQUEST
      )
    );

  const job = await Job.create({
    title,
    userId,
    pickUpLocation,
    pickUpDate: formattedPickUpDate,
    pickUpTime,
    dropOffDate: formattedDropOffDate,
    dropOffTime,
    dropOffs,
    jobType,
  });

  // const user = await User.findById(job.userId);
  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Job created successfully",
    job,
    createdBy: user.name,
  });
});

const searchByLocation = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { location } = req.query;

  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const jobs = await Job.find({
    pickUpLocation: { $regex: location, $options: "i" },
  });

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});

const getJobDetails = TryCatch(async (req, res, next) => {
  const { jobId } = req.params;
  const { userId } = req;

  console.log(jobId);

  const job = await Job.findOne({ _id: jobId, userId }).lean();

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  if (job) {
    const user = await User.findById(job.userId);

    res.status(httpStatus.OK).json({
      success: true,
      job,
      createdBy: user.name,
    });
  }
});

const getJobsByFilters = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { scheduled, completed } = req.query;

  const user = await getUserById(userId);

  const jobs = await getFilteredJobs(userId, user.role, scheduled, completed);

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});

const getAllJobsOfCustomer = TryCatch(async (req, res, next) => {
  const { userId } = req;

  const user = await getUserById(userId);

  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  const jobs = await Job.find({ userId }).sort({ updatedAt: -1 });

  if (!jobs)
    return next(new ErrorHandler("Jobs not found", httpStatus.NOT_FOUND));

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});

const getAvailableJobsForDriver = TryCatch(async (req, res, next) => {
  const { userId } = req;

  const user = await User.findById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const currentDate = moment().format("YYYY-MM-DD"); // Current date in YYYY-MM-DD format
  const currentTime = moment().format("HH:mm"); // Current time in HH:mm format

  const jobs = await Job.find({
    $and: [
      {
        $or: [
          { dropOffDate: { $gt: currentDate } }, // Future dates
          {
            $and: [
              { dropOffDate: currentDate }, // Today
              { dropOffTime: { $gte: currentTime } }, // Times later today
            ],
          },
        ],
      },
      { deliveryPartner: { $exists: false } },
      { deliveryStatus: { $exists: false } },
    ],
  })
    .populate("userId", "name")
    .lean();

  // Checking if the driver has applied any specific job
  const data = jobs.map((job) => {
    if (job?.apply.includes(userId)) {
      job.applied = true;
    } else {
      job.applied = false;
    }
    return job;
  });

  res.status(httpStatus.OK).json({
    success: true,
    jobs: data,
  });
});

const applyForJob = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId } = req.body;

  const user = await User.findById(userId);
  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await Job.findById(jobId);

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  console.log("job:::", job, job.deliveryPartner);

  if (job.deliveryPartner)
    return next(
      new ErrorHandler(
        "Job already assigned to a driver",
        httpStatus.BAD_REQUEST
      )
    );

  if (job.apply.includes(userId))
    return next(
      new ErrorHandler(
        "You already applied for this job",
        httpStatus.BAD_REQUEST
      )
    );

  job.apply.push(userId);
  await job.save();

  res.status(httpStatus.OK).json({
    success: true,
    message: "You applied for job successfully",
  });
});

const getJobApplications = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId } = req.params;

  const user = await getUserById(userId);
  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  const jobs = await Job.findOne({ _id: jobId, userId })
    .select("apply")
    .populate("apply", "name driverImage");

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});

const selectJobDriver = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId, driverId } = req.body;

  const user = await getUserById(userId);
  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  const driver = await getUserById(driverId);
  if (!driver)
    return next(new ErrorHandler("Driver not found", httpStatus.NOT_FOUND));

  if (driver.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("Selected user is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await Job.findOne({ _id: jobId, userId });

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  if (job.deliveryPartner)
    return next(
      new ErrorHandler(
        "Job already assigned to a driver",
        httpStatus.BAD_REQUEST
      )
    );
  job.deliveryPartner = driverId;
  job.deliveryStatus = deliveryStatus.IN_PROGRESS;
  await job.save();

  // TODO:
  // 1: Send notification to the driver that he has been selected for the job
  // 2: Deduct the amount from the customer card

  res.status(httpStatus.OK).json({
    success: true,
    message: "Driver selected successfully",
  });
});

const completeJob = TryCatch(async (req, res, next) => {
  const {
    jobId,
    dropOffId,
    dropOffStatus,
    dropOffPoint,
    dropOffDetails,
    isDeliveryCompleted,
  } = req.body;

  const { userId } = req;
  const user = await getUserById(userId);

  const images = getImages(req, ["pickupImage", "dropOffImage"]);

  let message = "";

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await Job.findOne({ _id: jobId, deliveryPartner: userId });

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  // if (!job.deliveryPartnerImageVerification)
  //   return next(
  //     new ErrorHandler(
  //       "Please verify your identity first",
  //       httpStatus.BAD_REQUEST
  //     )
  //   );

  const dropOff = job.dropOffs.id(dropOffId);

  if (!dropOff)
    return next(new ErrorHandler("Dropoff not found", httpStatus.NOT_FOUND));

  // Step 1: On the way to pickup (General case to change the drop off status)
  if (dropOffStatus == 1) {
    dropOff.dropOffStatus = dropOffStatus;
    message = "You are on the way to pickup the order.";
  }

  // Step 2: Upload image and on the way to drop off
  if (dropOffStatus == 2 && images?.pickupImage) {
    if (dropOff.dropOffStatus != 1) {
      return next(
        new ErrorHandler("Pickup is not initiated yet.", httpStatus.BAD_REQUEST)
      );
    }
    dropOff.pickupImage = images?.pickupImage;
    dropOff.dropOffStatus = dropOffStatus; // Update status to ON_THE_WAY_TO_PICKUP(2)
    message = "Pickup image uploaded successfully";
  }

  // Step 3: Change the drop off status to COMPLETED(3) when the driver arrived on the drop off location
  // Step 4: Upload image and complete the drop off
  if (dropOffStatus == 3) {
    // If arrived at dropOff location

    if (dropOff.dropOffStatus != 2)
      return next(
        new ErrorHandler(
          "DropOff is not completed yet.",
          httpStatus.BAD_REQUEST
        )
      );

    if (images || dropOffPoint || dropOffDetails) {
      dropOff.dropOffStatus = dropOffStatus;
      dropOff.dropOffImage = images?.dropOffImage;
      dropOff.dropOffPoint = dropOffPoint;
      dropOff.dropOffDetails = dropOffDetails;

      message = "Drop off details are submitted successfully";
    }
  }

  // Step 5: Finish the delivery
  if (isDeliveryCompleted) {
    const allDropOffs = job.dropOffs;
    const inCompleteDropOff = allDropOffs.find(
      (dropOff) => dropOff.dropOffStatus != 3
    );

    if (inCompleteDropOff)
      return next(
        new ErrorHandler("Please complete all dropoffs", httpStatus.BAD_REQUEST)
      );
    job.deliveryStatus = deliveryStatus.DELIVERED;
    message = "Delivery completed successfully";
  }

  await job.save();

  res.status(httpStatus.OK).json({
    success: true,
    message,
  });
});

const updateDeliveryStatus = TryCatch(async (req, res, next) => {
  const { dropOffId, dropOffStatus, isDeliveryCompleted } = req.body;
  const { jobId } = req.params;
  const { userId } = req;
  const user = await getUserById(userId);

  if (user.role != userRole.DRIVER)
    return next(new ErrorHandler("User is not driver", httpStatus.BAD_REQUEST));

  const job = await getJobById(jobId);
  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

  const dropOff = job.dropOffs.id(dropOffId);
  if (!dropOff)
    return next(new ErrorHandler("Drop Off not found", httpStatus.BAD_REQUEST));

  if (!dropOffStatus && !isDeliveryCompleted)
    return next(
      new ErrorHandler(
        "Please provide delivery status to update.",
        httpStatus.BAD_REQUEST
      )
    );

  if (dropOffStatus) {
    dropOff.dropOffStatus = dropOffStatus;
    job.deliveryStatus = deliveryStatus.IN_PROGRESS;
  }

  if (isDeliveryCompleted) {
    const allDropOffs = job.dropOffs;
    const inCompleteDropOff = allDropOffs.find(
      (dropOff) => dropOff.dropOffStatus != 3
    );

    if (inCompleteDropOff)
      return next(
        new ErrorHandler("Please complete all dropoffs", httpStatus.BAD_REQUEST)
      );
    job.deliveryStatus = deliveryStatus.DELIVERED;
  }

  await Promise.all([job.save(), dropOff.save()]);

  res.status(httpStatus.OK).json({
    success: true,
    message: "Drop Off status updated successfully",
    job,
  });
});

const updateDropOffStatus = TryCatch(async (req, res, next) => {
  const {
    dropOffId,
    dropOffStatus,
    pickupImage,
    dropOffImage,
    dropOffPoint,
    dropOffDetails,
  } = req.body;

  const { jobId } = req.params;
  const { userId } = req;

  const user = await getUserById(userId);

  if (user.role != userRole.DRIVER)
    return next(new ErrorHandler("User is not driver", httpStatus.BAD_REQUEST));

  const job = await getJobById(jobId);
  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

  const dropOff = job.dropOffs.id(dropOffId);
  if (!dropOff)
    return next(new ErrorHandler("Drop Off not found", httpStatus.BAD_REQUEST));

  const images = getImages(req, ["pickupImage", "dropOffImage"]);

  if (dropOffStatus == 2) {
    if (dropOff.dropOffStatus == 3) {
      return next(
        new ErrorHandler("Dropff already completed", httpStatus.BAD_REQUEST)
      );
    }

    if (!images || !images?.pickupImage) {
      return next(
        new ErrorHandler("Pickup image is required", httpStatus.BAD_REQUEST)
      );
    }
    dropOff.dropOffStatus = dropOffStatus;
    dropOff.pickupImage = images.pickupImage;
  }

  if (dropOffStatus == 3) {
    if (dropOff.dropOffStatus == 1)
      return next(
        new ErrorHandler(
          "Dropoff is not initiated yet.",
          httpStatus.BAD_REQUEST
        )
      );

    if ((!images || !images?.dropOffImage) && !dropOffPoint) {
      return next(
        new ErrorHandler(
          "Drop off details are required",
          httpStatus.BAD_REQUEST
        )
      );
    }
    dropOff.dropOffStatus = dropOffStatus;
    dropOff.dropOffImage = images.dropOffImage;
    dropOff.dropOffPoint = dropOffPoint;
    if (dropOffDetails) dropOff.dropOffDetails = dropOffDetails;
  }

  await job.save();

  res.status(httpStatus.OK).json({
    success: true,
    message: "Drop off updated successfully",
  });
});

const giveCustomerReview = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId, review, rating } = req.body;

  const user = await getUserById(userId);
  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await Job.findById(jobId);
  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  if (!job.deliveryPartner)
    return next(
      new ErrorHandler(
        "Driver not assigned to this job",
        httpStatus.BAD_REQUEST
      )
    );

  if (userId.toString() !== job.deliveryPartner.toString())
    return next(
      new ErrorHandler(
        "You are not assigned to this job",
        httpStatus.BAD_REQUEST
      )
    );

  if (job.deliveryStatus !== deliveryStatus.DELIVERED)
    return next(
      new ErrorHandler("Delivery is not completed yet", httpStatus.BAD_REQUEST)
    );

  await Review.create({
    userId,
    jobId,
    rating,
    customerId: job.userId,
    review,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Customer review given successfully",
  });
});

const recognizeFace = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId } = req.body;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await getJobById(jobId);
  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  const driverImage = user.driverImage;

  const faceImage = getImages(req, ["faceImage"]);

  // console.log("enter", faceImage, driverImage);

  // Read the images
  const capturedImageBuffer = await fetchImage(faceImage);
  const storedImageBuffer = await fetchImage(driverImage);

  const capturedImage = await canvas.loadImage(capturedImageBuffer);
  const storedImage = await canvas.loadImage(storedImageBuffer);

  console.log("capturedImage storedImage", capturedImage, storedImage);

  // Detect faces and compute descriptors
  const capturedResult = await faceapi
    .detectSingleFace(capturedImage)
    .withFaceLandmarks()
    .withFaceDescriptor();
  const storedResult = await faceapi
    .detectSingleFace(storedImage)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!capturedResult || !storedResult)
    return next(
      new ErrorHandler(
        "Unable to detect faces in one or both images.",
        httpStatus.BAD_REQUEST
      )
    );

  const distance = faceapi.euclideanDistance(
    capturedResult.descriptor,
    storedResult.descriptor
  );

  console.log("distance:::", distance);

  const threshold = 0.6;
  if (distance < threshold) {
    job.deliveryPartnerImageVerification = true;
    await job.save();

    res.status(httpStatus.OK).json({
      success: true,
      message: "User validated successfully",
    });
  } else {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "User not validated",
    });
  }
});

const quitJob = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId, reason } = req.body;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const job = await Job.findOne({
    _id: jobId,
    deliveryStatus: deliveryStatus.IN_PROGRESS,
    deliveryPartner: userId,
  });
  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.NOT_FOUND));

  job.isJobQuit.push({ driverId: userId, reason });
  job.deliveryPartner = undefined;
  job.deliveryPartnerImageVerification = false;
  job.deliveryStatus = deliveryStatus.CANCELED;
  await job.save();

  res.status(httpStatus.OK).json({
    success: true,
    message: "You have quit the job successfully",
  });
});

export const jobController = {
  createJob,
  searchByLocation,
  getJobDetails,
  getJobsByFilters,
  getAllJobsOfCustomer,
  getAvailableJobsForDriver,
  applyForJob,
  getJobApplications,
  selectJobDriver,
  completeJob,
  giveCustomerReview,
  recognizeFace,
  quitJob,
  updateDeliveryStatus,
  updateDropOffStatus,
};
