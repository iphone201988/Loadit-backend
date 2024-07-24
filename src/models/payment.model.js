import { Schema, model } from "mongoose";
import { transactionType } from "../utils/enums/enums.js";

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
        transactionType.DRIVER_WITHDRAW,
      ],
    },
    paymentIntentId: { type: String },
    paymentTransferredStatus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Payment = model("Payment", paymentSchema);
export default Payment;
