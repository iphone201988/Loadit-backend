import { Schema, model, mongo } from "mongoose";
import { deliveryStatus, jobType } from "../utils/enums/enums.js";

const jobSchema = new Schema(
  {
    orderNo: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
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
    distance: {
      type: String,
    },
    jobType: {
      type: Number,
      enum: [
        jobType.SINGLE_DROPOFF,
        jobType.MULTIPLE_DROPOFF,
        jobType.TEAM_JOB,
      ],
    },
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryStatus: {
      type: Number,
      enum: [
        deliveryStatus.IN_PROGRESS,
        deliveryStatus.DELIVERED,
        deliveryStatus.CANCELED,
      ],
    },
  },
  { timestamps: true }
);

jobSchema.pre("save", async function () {
  const job = this;
  if (job.isNew) {
    const lastJob = await Job.findOne({}, {}, { sort: { createdAt: -1 } });
    if (lastJob) {
      const lastOrderNo = Number(lastJob.orderNo.replace("#", ""));
      job.orderNo = `#${lastOrderNo + 1}`;
    } else {
      job.orderNo = "#1000";
    }
  }
});

const Job = model("Job", jobSchema);
export default Job;
