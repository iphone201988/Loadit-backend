import { Schema, model, mongo } from "mongoose";
import {
  deliveryStatus,
  dropOffPoint,
  dropOffStatus,
  jobType,
} from "../utils/enums/enums.js";

const dropOffSchema = new Schema({
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
  pickupImage: {
    type: String,
  },
  dropOffImage: {
    type: String,
  },
  dropOffStatus: {
    type: Number,
    enum: [
      dropOffStatus.ON_THE_WAY_TO_PICKUP,
      dropOffStatus.ON_THE_WAY_TO_DROPOFF,
      dropOffStatus.COMPLETED,
    ],
  },
  dropOffPoint: {
    type: Number,
    enum: [
      dropOffPoint.AT_FRONT_DOOR,
      dropOffPoint.AT_BACK_DOOR,
      dropOffPoint.AT_SIDE_DOOR,
      dropOffPoint.ON_THE_PORCH,
      dropOffPoint.AT_FRONT_DESK,
      dropOffPoint.AT_CONCIERGE,
      dropOffPoint.IN_MAILROOM,
      dropOffPoint.IN_LOBBY,
      dropOffPoint.AT_GARAGE,
      dropOffPoint.HANDED_TO_RECIPIENT,
      dropOffPoint.WITH_RECIPIENTIST,
      dropOffPoint.WITH_SECURITY,
      dropOffPoint.WITH_DOOR_PERSON,
    ],
  },
  dropOffDetails: {
    type: String,
  },
});

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
    amount: {
      type: Number,
      default: 40,
    },
    isAmountDeducted: {
      type: Boolean,
      default: false,
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
    dropOffs: [dropOffSchema],
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
    apply: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryPartnerImageVerification: {
      type: Boolean,
    },
    deliveryStatus: {
      type: Number,
      enum: [
        deliveryStatus.IN_PROGRESS,
        deliveryStatus.DELIVERED,
        deliveryStatus.CANCELED,
      ],
    },
    isJobQuit: [
      {
        driverId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
        },
      },
    ],
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
