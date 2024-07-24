import mongoose from "mongoose";
import {
  addressType,
  deviceType,
  userRole,
  vehicleType,
} from "../utils/enums/enums.js";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    stripeCustomerId: {
      type: String,
    },
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    address: {
      state: String,
      zipCode: String,
      addressZipCode: String,
      addressType: {
        // For Customer registration
        type: Number,
        enum: [addressType.PERSONAL_USE, addressType.COMPANY_USE],
      },
    },
    dob: {
      type: String,
    },
    driverImage: {
      type: String,
    },
    drivingLicenseNumber: {
      type: String,
    },
    drivingLicenseImage: {
      type: String,
    },
    carInsuranceNumber: {
      type: String,
    },
    carInsuranceNumberExpDate: {
      type: String,
    },
    carInsuranceImage: {
      type: String,
    },
    socialSecurityNumber: {
      type: String,
    },
    vehicleNumber: {
      type: String,
    },
    licensePlate: {
      type: String,
    },
    vehicleType: {
      type: Number,
      enum: [
        vehicleType.BOX_TRUCK,
        vehicleType.CAR,
        vehicleType.MINI_VAN,
        vehicleType.SMALL_TRUCK,
        vehicleType.SPRINTER_VAN,
      ],
    },
    vehicleImage: {
      type: String,
    },
    role: {
      type: Number,
      enum: [userRole.DRIVER, userRole.CUSTOMER],
    },
    jti: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: String,
    },
    deviceToken: {
      type: String,
    },
    deviceType: {
      type: Number,
      enum: [deviceType.ANDROID, deviceType.IOS],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }

  if (this.isModified("otp") && this.otp) {
    const hashedOTP = await bcrypt.hash(this.otp, 10);
    this.otp = hashedOTP;
  }
});

userSchema.methods.matchPassword = async function (password) {
  if (!this.password) return false;
  const isCompared = await bcrypt.compare(password, this.password);
  return isCompared;
};

userSchema.methods.matchOTP = async function (otp) {
  if (!this.otp) return false;
  const isCompared = await bcrypt.compare(otp, this.otp);
  return isCompared;
};

const User = mongoose.model("User", userSchema);
export default User;
