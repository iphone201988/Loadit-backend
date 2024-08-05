import Job from "../models/job.model.js";
import { deliveryStatus } from "../utils/enums/enums.js";
import NodeGeocoder from "node-geocoder";


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

// Extra functions for calculating distance and price
const getDistanceBetweenPoints = async (location1, location2) => {
  const options = {
    provider: "google",
    apiKey: process.env.GOOGLE_MAP_API_KEY,
  };

  const geocoder = NodeGeocoder(options);

  const [loc1, loc2] = await Promise.all([
    geocoder.geocode(location1),
    geocoder.geocode(location2),
  ]);

  const loc1Coords = { lat: loc1[0].latitude, lon: loc1[0].longitude };
  const loc2Coords = { lat: loc2[0].latitude, lon: loc2[0].longitude };

  return calculateDistance(loc1Coords, loc2Coords);
};

const getShortestPathDistance = async (origin, destination) => {
  const apiKey = process.env.GOOGLE_MAP_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    const routes = data.routes;

    if (routes.length > 0) {
      const distance = routes[0].legs[0].distance.value; // distance in meters
      return distance / 1000; // convert to kilometers
    } else {
      throw new Error("No routes found");
    }
  } catch (error) {
    throw new Error(`Failed to calculate shortest path: ${error.message}`);
  }
};

const calculateDistance = (loc1, loc2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lon - loc1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance / 1000; // convert to kilometers
};

export const calculateTotalDistance = async (pickup, dropoffs) => {
  let totalDistance = 0;
  let previousLocation = pickup;

  for (let i = 0; i < dropoffs.length; i++) {
    const distance = await getShortestPathDistance(
      previousLocation,
      dropoffs[i]
    );
    totalDistance += distance;
    previousLocation = dropoffs[i];
  }

  return totalDistance;
};

export const calculatePrice = (distance) => {
  const baseFare = 50; // Base fare in currency unit
  const perKmRate = 10; // Rate per kilometer in currency unit

  if (distance <= 2) {
    return baseFare;
  } else {
    const additionalDistance = distance - 2;
    return Math.round(baseFare + additionalDistance * perKmRate);
  }
};

export const deductAndTransferAmount = async ()=>{
  
}
