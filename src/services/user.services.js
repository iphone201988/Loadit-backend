import User from "../models/user.model.js";
import crypto from "crypto";
import {
  addMinutesToCurrentTime,
  generateOTP,
  sendOTPOnEmail,
  sendOTPOnPhone,
} from "../utils/helper.js";

export const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (user) return user;
  return false;
};

export const getUserByPhone = async (phone) => {
  const user = await User.findOne({ phone });
  if (user) return user;
  return false;
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (user) return user;
  return false;
};

export const generateRandomJti = (length = 16) => {
  return crypto.randomBytes(length).toString("hex");
};

export const sendOTP = async (user) => {
  const OTP = generateOTP();

  if (user.email) {
    const subject = "Reset you password";
    const text = `OTP:${OTP}`;
    const body = `OTP:${OTP}`;
    await sendOTPOnEmail(user.email, subject, text, body);
  }

  if (user.phone) {
    const body = `OTP:${OTP}`;
    await sendOTPOnPhone(body);
  }

  user.otp = OTP;
  user.otpExpiry = addMinutesToCurrentTime(2);
  await user.save();
};
