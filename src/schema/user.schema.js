import Joi from "joi";
import {
  addressType,
  deviceType,
  userRole,
  vehicleType,
} from "../utils/enums/enums.js";

const registerUserValidation = {
  body: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.number().optional(),
    address: Joi.object({
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
    }),
    password: Joi.string().required(),
    deviceType: Joi.number()
      .valid(deviceType.ANDROID, deviceType.IOS)
      .required(),
    deviceToken: Joi.string().required(),
  }).or("phone", "email"),
};

const completeProfileValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    role: Joi.number().valid(userRole.DRIVER, userRole.CUSTOMER).required(),
    dob: Joi.date().required(),
    addressZipCode: Joi.string().required(),
    addressType: Joi.number()
      .valid(addressType.COMPANY_USE, addressType.PERSONAL_USE)
      .when("role", {
        is: 2,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    drivingLicenseNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    carInsuranceNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    carInsuranceNumberExpDate: Joi.date().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    socialSecurityNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    vehicleNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    licensePlate: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    vehicleType: Joi.number()
      .valid(
        vehicleType.BOX_TRUCK,
        vehicleType.CAR,
        vehicleType.SMALL_TRUCK,
        vehicleType.MINI_VAN,
        vehicleType.SPRINTER_VAN
      )
      .when("role", {
        is: 1,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
  }),
};

const loginUserValidation = {
  body: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.number().optional(),
    password: Joi.string().required(),
    deviceType: Joi.number()
      .valid(deviceType.ANDROID, deviceType.IOS)
      .required(),
    deviceToken: Joi.string().required(),
  }).or("phone", "email"),
};

const changePasswordValidation = {
  body: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  }),
};

const forgotPasswordValidation = {
  body: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.number().optional(),
  }).or("phone", "email"),
};

const verifyOTPValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    otp: Joi.string().required(),
  }),
};

const resetPasswordValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const updateUserProfileValidation = {
  body: Joi.object({
    email: Joi.string().optional(),
    phone: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }),
};

const userDocumentsValidation = {
  body: Joi.object({
    dob: Joi.date().optional(),
    state: Joi.string().optional(),
    drivingLicenseNumber: Joi.string().optional(),
    carInsuranceNumber: Joi.string().optional(),
    carInsuranceNumberExpDate: Joi.date().optional(),
    socialSecurityNumber: Joi.string().optional(),
    vehicleNumber: Joi.string().optional(),
    licensePlate: Joi.string().optional(),
  }),
};

const userVehicleInformationValidation = {
  body: Joi.object({
    vehicleType: Joi.number()
      .valid(
        vehicleType.BOX_TRUCK,
        vehicleType.CAR,
        vehicleType.SMALL_TRUCK,
        vehicleType.MINI_VAN,
        vehicleType.SPRINTER_VAN
      )
      .optional(),
  }),
};

export default {
  registerUserValidation,
  completeProfileValidation,
  loginUserValidation,
  forgotPasswordValidation,
  changePasswordValidation,
  verifyOTPValidation,
  resetPasswordValidation,
  updateUserProfileValidation,
  userDocumentsValidation,
  userVehicleInformationValidation,
};
