import Job from "../models/job.model.js";
import { deliveryStatus } from "../utils/enums/enums.js";

export const getFilteredJobs = async (
  userId,
  role,
  scheduled = false,
  completed = false
) => {
  let jobs = [];

  // If role is driver
  if (role == 1) {
    if (scheduled) {
      jobs = await Job.aggregate([
        {
          $match: {
            deliveryPartner: userId,
            deliveryStatus: { $exists: false },
          }, // If partner assigned but status not exists means delivery not started yet
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

      // Formatting the jobs to group by date
      const formattedJobs = {};
      jobs.forEach((entry) => {
        formattedJobs[entry.date] = entry.jobs;
      });

      jobs = formattedJobs;
    } else if (completed) {
      jobs = await Job.find({
        deliveryPartner: userId,
        deliveryStatus: {
          $or: [deliveryStatus.DELIVERED, deliveryStatus.CANCELED],
        },
      });
    } else {
      jobs = await Job.find({
        deliveryPartner: userId,
        deliveryStatus: deliveryStatus.IN_PROGRESS,
      });
    }
  }

  // If role is customer
  if (role == 2) {
    if (scheduled) {
      jobs = await Job.aggregate([
        {
          $match: {
            userId,
            deliveryPartner: { $exists: true },
            deliveryStatus: { $exists: false },
          }, // If partner assigned but status not exists means delivery not started yet
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

      //Formatting the jobs to group by date
      const formattedJobs = {};
      jobs.forEach((entry) => {
        formattedJobs[entry.date] = entry.jobs;
      });

      jobs = formattedJobs;
    } else if (completed) {
      jobs = await Job.find({
        userId,
        deliveryPartner: { $exists: true },
        deliveryStatus: {
          $in: [deliveryStatus.DELIVERED, deliveryStatus.CANCELED],
        },
      });
    } else {
      jobs = await Job.find({
        userId,
        deliveryPartner: { $exists: false },
        deliveryStatus: { $exists: false },
      });
    }
  }

  return jobs;
};

export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId);
  if (job) return job;
  return false;
};

export const fetchImage = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer  re
};
