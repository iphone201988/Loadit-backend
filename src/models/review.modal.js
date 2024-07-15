import { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
    },
    review: {
      type: String,
    },
  },
  { timeStamps: true }
);

const Review = model("Review", reviewSchema);
export default Review;
