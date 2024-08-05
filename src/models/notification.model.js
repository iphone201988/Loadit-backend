import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    icons: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["info", "alert", "warning"],
      default: "info",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = model("Notification", notificationSchema);
export default Notification;
