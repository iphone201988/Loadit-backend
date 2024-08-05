import User from "../models/user.model.js";
import {
  generateRandomJti,
  getUserByEmail,
  getUserById,
  getUserByPhone,
} from "../services/user.services.js";
import {
  TryCatch,
  addMinutesToCurrentTime,
  generateJsonWebToken,
  generateOTP,
  sendOTPOnEmail,
  sendOTPOnPhone,
  getImages,
} from "../utils/helper.js";
import httpStatus from "http-status";
import ErrorHandler from "../utils/ErrorHandler.js";
import moment from "moment";
import { userRole } from "../utils/enums/enums.js";

const register = TryCatch(async (req, res, next) => {
  const { email, phone, address, password, deviceType, deviceToken } = req.body;

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
      deviceType,
      deviceToken,
    });
  }

  if (user)
    return res.status(httpStatus.CREATED).json({
      success: true,
      userId: user._id,
    });
});

const completeProfile = TryCatch(async (req, res, next) => {
  const {
    userId,
    name,
    role,
    dob,
    addressZipCode,
    addressType,
    drivingLicenseNumber,
    carInsuranceNumber,
    carInsuranceNumberExpDate,
    socialSecurityNumber,
    vehicleNumber,
    licensePlate,
    vehicleType,
  } = req.body;

  const allImages = getImages(req, [
    "driverImage",
    "drivingLicenseImage",
    "carInsuranceImage",
    "vehicleImage",
  ]);

  let user = await User.findById(userId);
  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  if (user.role != undefined && user.role != role)
    return next(
      new ErrorHandler("User role is different", httpStatus.BAD_REQUEST)
    );

  const jti = generateRandomJti(20);

  let data = {};

  if (role == userRole.DRIVER) {
    const updatedAddress = { ...user.address, addressZipCode };
    data = {
      role,
      name,
      dob: moment(dob).format("YYYY-MM-DD"),
      address: updatedAddress,
      drivingLicenseNumber,
      carInsuranceNumber,
      carInsuranceNumberExpDate: moment(carInsuranceNumberExpDate).format(
        "YYYY-MM-DD"
      ),
      socialSecurityNumber,
      vehicleNumber,
      licensePlate,
      vehicleType,
      jti,
      ...allImages,
    };
  } else {
    const updatedAddress = { ...user.address, addressZipCode, addressType };
    data = {
      role,
      name,
      dob,
      address: updatedAddress,
      jti,
    };
  }

  user = await User.findByIdAndUpdate(userId, data);

  const token = generateJsonWebToken({ id: user._id, jti });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "User registration completed successfully",
    token,
  });
});

const login = TryCatch(async (req, res, next) => {
  const { email, phone, password, deviceType, deviceToken } = req.body;

  let user;
  if (email) user = await User.findOne({ email });
  if (phone) user = await User.findOne({ phone });

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  if (!user?.role)
    return res.status(httpStatus.FORBIDDEN).json({
      success: false,
      messages: "Please complete your registration.",
      userId: user._id,
    });

  const isMatched = await user.matchPassword(password);
  if (!isMatched)
    return next(new ErrorHandler("Invalid password", httpStatus.BAD_REQUEST));

  const jti = generateRandomJti(20);
  user.jti = jti;
  user.deviceType = deviceType;
  user.deviceToken = deviceToken;
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

  const OTP = generateOTP();

  if (email) {
    const subject = "Email OTP";
    const text = `Hi ${user.name},\n\nTo verify your email address, please use the following OTP: ${OTP}\n\nIf you did not request this verification, please ignore this email.\n\nThanks,\nTeam Loadit`;
    const html = `
    <div style="margin: 30px; padding: 30px; border: 1px solid black; border-radius: 20px 10px;">
        <h4><strong>Hi ${user.name},</strong></h4>
        <p>To verify your email address, please use the following OTP: <strong>${OTP}</strong></p>
        <p>If you did not request this verification, please ignore this email.</p>
        <p>Thanks,</p>
        <p><strong>Team Loadit</strong></p>
    </div>
  `;
    await sendOTPOnEmail(user.email, subject, text, html);
  }

  if (phone) {
    const body = `OTP:${OTP}`;
    await sendOTPOnPhone(body);
  }

  user.otp = OTP;
  user.otpExpiry = addMinutesToCurrentTime(2);
  await user.save();

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

const getProfileInformation = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await User.findById(userId).select(
    "-password -otp -otpExpiry -createdAt -updatedAt  -__v -jti"
  );

  res.status(httpStatus.OK).json({
    success: true,
    user,
  });
});

const logoutUser = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  user.jti = undefined;
  await user.save();

  res
    .status(httpStatus.OK)
    .json({ success: true, message: "User logged out successfully" });
});

const updateUserProfile = TryCatch(async (req, res, next) => {
  const { email, phone, state, zipCode } = req.body;
  const { userId } = req;

  const driverImage = getImages(req, ["driverImage"]);

  const user = await getUserById(userId);

  if (email) {
    const existingUser = await getUserByEmail(email);
    if (existingUser)
      return next(
        new ErrorHandler("Email already exists", httpStatus.BAD_REQUEST)
      );
    user.email = email;
  }
  if (phone) {
    const existingUser = await getUserByPhone(phone);
    if (existingUser)
      return next(
        new ErrorHandler("Phone number already exists", httpStatus.BAD_REQUEST)
      );
    user.phone = phone;
  }
  if (state) user.address.state = state;
  if (zipCode) user.address.zipCode = zipCode;
  if (driverImage) user.driverImage = driverImage;

  await user.save();

  res.status(httpStatus.OK).json({
    success: true,
    mesage: "User details updated successfully",
  });
});

const updateUserDocuments = TryCatch(async (req, res, next) => {
  const {
    dob,
    state,
    drivingLicenseNumber,
    carInsuranceNumber,
    carInsuranceNumberExpDate,
    socialSecurityNumber,
    vehicleNumber,
    licensePlate,
  } = req.body;

  const { userId } = req;
  const existingUser = await getUserById(userId);
  const data = {};

  if (existingUser.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const images = getImages(req, ["drivingLicenseImage", "carInsuranceImage"]);

  if (dob) data.dob = dob;
  if (state) data.address.state = state;
  if (drivingLicenseNumber) data.drivingLicenseNumber = drivingLicenseNumber;

  if (images && images?.drivingLicenseImage)
    data.drivingLicenseImage = images.drivingLicenseImage;

  if (carInsuranceNumber) data.carInsuranceNumber = carInsuranceNumber;

  if (carInsuranceNumberExpDate)
    data.carInsuranceNumberExpDate = carInsuranceNumberExpDate;

  if (images && images?.carInsuranceImage)
    data.carInsuranceImage = images.carInsuranceImage;

  if (socialSecurityNumber) data.socialSecurityNumber = socialSecurityNumber;
  if (vehicleNumber) data.vehicleNumber = vehicleNumber;
  if (licensePlate) data.licensePlate = licensePlate;

  const user = await User.findByIdAndUpdate(userId, { ...data });

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  res.status(httpStatus.OK).json({
    success: true,
    message: "User documents updated successfully",
  });
});

const updateUserVehicleInformation = TryCatch(async (req, res, next) => {
  const { vehicleType } = req.body;
  const { userId } = req;
  const existingUser = await getUserById(userId);
  const data = {};

  if (existingUser.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const vehicleImage = getImages(req, ["vehicleImage"]);

  if (vehicleType) data.vehicleType = vehicleType;
  if (vehicleImage) data.vehicleImage = vehicleImage;

  const user = await User.findByIdAndUpdate(userId, { ...data });
  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  res.status(httpStatus.OK).json({
    success: true,
    message: "User vehicle information updated successfully",
  });
});

export const userController = {
  register,
  completeProfile,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  getProfileInformation,
  logoutUser,
  updateUserProfile,
  updateUserDocuments,
  updateUserVehicleInformation,
};
