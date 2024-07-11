import User from "../models/user.model.js";
import {
  generateRandomJti,
  getUserByEmail,
  getUserById,
  getUserByPhone,
  sendOTP,
} from "../services/user.services.js";
import {
  TryCatch,
  addMinutesToCurrentTime,
  generateJsonWebToken,
  generateOTP,
  sendOTPOnEmail,
  sendOTPOnPhone,
} from "../utils/helper.js";
import httpStatus from "http-status";
import ErrorHandler from "../utils/ErrorHandler.js";

const register = TryCatch(async (req, res, next) => {
  const { email, phone, address, password } = req.body;

  let user;
  if (email) user = await getUserByEmail(email);
  if (phone) user = await getUserByPhone(phone);

  if (user && user.role) {
    // If user role exists that means registration is complete.
    return next(
      new ErrorHandler(
        `A user is already exists with this ${email ? "email" : "phone"}`,
        httpStatus.BAD_REQUEST
      )
    );
  }

  if (!user) {
    user = await User.create({
      email,
      phone,
      address,
      password,
    });
  }

  if (user)
    return res.status(httpStatus.CREATED).json({
      success: true,
      userId: user._id,
    });
});

const singleUpload = TryCatch(async (req, res, next) => {
  console.log(process.env.BACKEND_URL + req.file.path.replace("src/", ""));
  res.status(httpStatus.CREATED).json({
    success: true,
    url: process.env.BACKEND_URL + req.file.path.replace("src/", ""),
  });
});

const completeProfile = TryCatch(async (req, res, next) => {
  const {
    userId,
    role,
    dob,
    address,
    driverImage,
    drivingLicenseNumber,
    drivingLicenseImage,
    carInsuranceNumber,
    carInsuranceNumberExpDate,
    carInsuranceImage,
    socialSecurityNumber,
    vehicleNumber,
    licensePlate,
    vehicleType,
    vehicleImage,
  } = req.body;

  let user = await User.findById(userId);
  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  const updatedAddress = { ...user.address, ...address };
  const jti = generateRandomJti(20);

  user = await User.findByIdAndUpdate(userId, {
    role,
    dob,
    address: updatedAddress,
    driverImage,
    drivingLicenseNumber,
    drivingLicenseImage,
    carInsuranceNumber,
    carInsuranceNumberExpDate,
    carInsuranceImage,
    socialSecurityNumber,
    vehicleNumber,
    licensePlate,
    vehicleType,
    vehicleImage,
    jti,
  });

  const token = generateJsonWebToken({ id: user._id, jti });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "User registration completed successfully",
    token,
  });
});

const login = TryCatch(async (req, res, next) => {
  const { email, phone, password } = req.body;

  let user;
  if (email) user = await User.findOne({ email });
  if (phone) user = await User.findOne({ phone });

  if (!user.role)
    return next(
      new ErrorHandler("Please complete your registration", httpStatus.OK)
    );

  if (!user)
    return next(new ErrorHandler("Invalid email", httpStatus.BAD_REQUEST));

  const isMatched = await user.matchPassword(password);
  if (!isMatched)
    return next(new ErrorHandler("Invalid  password", httpStatus.BAD_REQUEST));

  const jti = generateRandomJti(20);
  user.jti = jti;
  await user.save();
  const token = generateJsonWebToken({ id: user._id, jti });

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "User loggedin successfully", token });
});

const forgotPassword = TryCatch(async (req, res, next) => {
  const { email, phone } = req.body;

  let user;
  if (email) user = await User.findOne({ email });
  if (phone) user = await User.findOne({ phone });

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  await sendOTP(user);

  res.status(httpStatus.OK).json({
    success: true,
    message: `OTP has been sent on your ${email ? "email" : "phone number"}`,
    userId: user._id,
  });
});

const verifyOTP = TryCatch(async (req, res, next) => {
  const { userId, otp } = req.body;
  const user = await getUserById(userId);

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  if (user.otpExpiry < Date.now()) {
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    return next(new ErrorHandler("OTP Expired", httpStatus.BAD_REQUEST));
  }

  const isMatched = await user.matchOTP(otp);
  if (!isMatched)
    return next(new ErrorHandler("Invalid OTP", httpStatus.BAD_REQUEST));

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "OTP verified successfully", userId });
});

const resendOTP = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  const user = await getUserById(userId);
  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  await sendOTP(user);

  res.status(httpStatus.OK).json({
    success: true,
    message: `OTP has been sent on your ${
      user.email ? "email" : "phone number"
    }`,
    userId: user._id,
  });
});

const resetPassword = TryCatch(async (req, res, next) => {
  const { userId, password } = req.body;
  const user = await getUserById(userId);

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  user.password = password;
  await user.save();

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "Password has been changed successfully" });
});

const changePassword = TryCatch(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const { userId } = req;

  const user = await getUserById(userId);
  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  const isMatched = await user.matchPassword(oldPassword);
  if (!isMatched)
    return next(new ErrorHandler("Incorrect password", httpStatus.BAD_REQUEST));

  user.password = newPassword;
  await user.save();
  res.status(httpStatus.OK).json({
    success: true,
    messaage: "Password has been changed successfully",
  });
});

export const userController = {
  register,
  completeProfile,
  singleUpload,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  resendOTP
};
