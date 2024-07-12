import { TryCatch } from "../utils/helper.js";
import Job from "../models/job.model.js";
import moment from "moment";
import httpStatus from "http-status";
import User from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";

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

const getJobs = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { scheduled, completed } = req.query;
  let jobs = [];

  if (scheduled) {
    jobs = await Job.aggregate([
      {
        $match: { userId, deliveryPartner: { $exists: true } }, // Match the userId if needed
      },
      {
        $group: {
          _id: "$pickUpDate",
          jobs: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          jobs: 1,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date if needed
      },
    ]);
    const formattedJobs = {};
    jobs.forEach((entry) => {
      formattedJobs[entry.date] = entry.jobs;
    });
    jobs = formattedJobs;
  } else if (completed) {
    jobs = await Job.find({
      userId,
      deliveryPartner: { $exists: true },
      deliveryStatus: { $exists: true },
    });
  } else {
    jobs = await Job.find({
      userId,
      deliveryPartner: { $exists: false },
      deliveryStatus: { $exists: false },
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    jobs,
  });
});



export const jobController = { createJob, getJobDetails, getJobs };
