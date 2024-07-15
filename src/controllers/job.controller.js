import { TryCatch } from "../utils/helper.js";
import Job from "../models/job.model.js";
import moment from "moment";
import httpStatus from "http-status";
import User from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { getUserById } from "../services/user.services.js";
import { getFilteredJobs } from "../services/job.services.js";
import { deliveryStatus, userRole } from "../utils/enums/enums.js";
import Review from "../models/review.modal.js";

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

  if (jobType === 1 && dropOffs.length > 1) {
    return next(
      new ErrorHandler(
        "Single dropoff job can only have one dropoff location",
        httpStatus.BAD_REQUEST
      )
    );
  }

  const formattedPickUpDate = moment(pickUpDate).format("YYYY-MM-DD");
  const formattedDropOffDate = moment(dropOffDate).format("YYYY-MM-DD");

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

  if (job) {
    const user = await User.findById(job.userId);
    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Job created successfully",
      job,
      createdBy: user.name,
    });
  }
});

const getJobDetails = TryCatch(async (req, res, next) => {
  const { jobId } = req.params;
  const { userId } = req;

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

  const jobs = await Job.find({
    deliveryPartner: { $exists: false },
    deliveryStatus: { $exists: false },
  }).populate("userId", "name");

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
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

  const jobs = await Job.findById(jobId)
    .select("apply")
    .populate("apply", "name driverImage");

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});

const selectJobDriver = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId, userId: driverId } = req.body;

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

  const job = await Job.findById(jobId);
  if (job.deliveryPartner)
    return next(
      new ErrorHandler(
        "Job already assigned to a driver",
        httpStatus.BAD_REQUEST
      )
    );
  job.deliveryPartner = driverId;
  await job.save();

  // TODO: Send notification to the driver that he has been selected for the job

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
    pickupImage,
    dropOffImage,
    dropOffPoint,
    dropOffDetails,
    isDeliveryCompleted,
  } = req.body;

  const { userId } = req;
  const user = await getUserById(userId);
  let message = "";

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

  // if (!job.deliveryPartnerImageVerification)
  //   return next(
  //     new ErrorHandler("Please verify your image first", httpStatus.BAD_REQUEST)
  //   );

  const dropOff = job.dropOffs.id(dropOffId);

  // Step 2: Upload image and on the way to drop off
  if (dropOff.dropOffStatus === 1 && pickupImage)
    dropOff.pickupImage = pickupImage;

  // Step 1: On the way to pickup (General case to change the drop off status)
  // Step 3: Change the drop off status to COMPLETED(3) when the driver arrived on the drop off location
  if (dropOffStatus) {
    if (dropOffStatus === 1)
      message = "You are on the way to pickup the order.";

    if (dropOffStatus === 2) {
      message = "You are on the way to deliver the order.";
    }

    if (dropOffStatus === 3) {
      message = "You arrived on the drop off location.";
    }

    dropOff.dropOffStatus = dropOffStatus;
  }

  // Step 4: Upload image and complete the drop off
  if (dropOffImage || dropOffPoint || dropOffDetails) {
    dropOff.dropOffImage = dropOffImage;
    dropOff.dropOffPoint = dropOffPoint;
    dropOff.dropOffDetails = dropOffDetails;

    message = "Drop off details are submitted successfully";
  }

  // Step 5: Finish the delivery
  if (isDeliveryCompleted) {
    const allDropOffs = job.dropOffs;
    const inCompleteDropOff = allDropOffs.find(
      (dropOff) => dropOff.dropOffStatus !== 3
    );
    if (inCompleteDropOff)
      return next(
        new ErrorHandler("Please complete all dropoffs", httpStatus.BAD_REQUEST)
      );
    job.deliveryStatus = deliveryStatus.DELIVERED;
    message = "Delivery completed successfully";
  }

  await job.save();

  console.log("dropOff", dropOff);

  res.status(httpStatus.OK).json({
    success: true,
    message,
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

export const jobController = {
  createJob,
  getJobDetails,
  getJobsByFilters,
  getAllJobsOfCustomer,
  getAvailableJobsForDriver,
  applyForJob,
  getJobApplications,
  selectJobDriver,
  completeJob,
  giveCustomerReview
};
