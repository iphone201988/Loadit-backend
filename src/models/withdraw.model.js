import { model, Schema } from "mongoose";

const withdrawSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    payoutId: { type: String, required: true },
    amount: { type: Number, required: true },
    transferId: { type: String },
    destinationAccount: { type: String },
    withdrawStatus: { type: Number, default: 1 }, // 1 For "pending"
  },
  { timestamps: true }
);
const Withdraw = model("Withdraw", withdrawSchema);
export default Withdraw;
