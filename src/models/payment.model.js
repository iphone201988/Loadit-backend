import { Schema, model } from "mongoose";
import { paymentStatus, transactionType } from "../utils/enums/enums.js";

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    jobId: { type: Schema.Types.ObjectId, ref: "Job" },
    cardId: { type: String },
    transferId: { type: String },
    amount: { type: Number, required: true },
    transactionType: {
      type: Number,
      enum: [
        transactionType.CUSTOMER_DEDUCTION,
        transactionType.DRIVER_TRANSFER,
        // transactionType.DRIVER_WITHDRAW,
      ],
    },
    transactionDate: { type: Date },
    transactionId: { type: String },
    // paymentTransferredStatus: { type: Boolean, default: false },
    isTip: { type: Boolean },
    status: {
      type: Number,
      enum: [
        paymentStatus.PENDING,
        paymentStatus.COMPLETED,
        paymentStatus.FAILED,
      ],
    },
  },
  { timestamps: true }
);

const Payment = model("Payment", paymentSchema);
export default Payment;
