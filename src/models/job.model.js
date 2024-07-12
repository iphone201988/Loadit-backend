import { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    title: {
      type: String,
    },
    pickUpLocation: {
      type: String,
    },
    pickUpDate: {
      type: String,
    },
    pickUpTime: {
      type: String,
    },

    dropOffDate: {
      type: String,
    },
    dropOffTime: {
      type: String,
    },
    dropOffs: [
      {
        dropOffLocation: {
          type: String,
        },
        numberOfItems: {
          type: Number,
        },
        weightOfItems: {
          type: Number,
        },
        lengthOfItems: {
          type: Number,
        },
        heightOfItems: {
          type: Number,
        },
        instructions: {
          type: String,
        },
      },
    ],
    jobType: {
      type: Number,
      enum: [
        jobType.SINGLE_DROPOFF,
        jobType.MULTIPLE_DROPOFF,
        jobType.TEAM_JOB,
      ],
    },
  },
  { timestamps: true }
);

const Job = model("Job", jobSchema);
export default Job;
