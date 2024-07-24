import Joi from "joi";
import {
  addressType,
  deviceType,
  userRole,
  vehicleType,
} from "../utils/enums/enums.js";

const registerUserValidation = {
  body: Joi.object({
    email: Joi.string().email().optional().messages({
      "string.email": "Invalid email format",
    }),
    phone: Joi.number().optional().messages({
      "number.base": "Phone number must be a number",
    }),
    address: Joi.object({
      state: Joi.string().required().messages({
        "any.required": "State is required",
      }),
      zipCode: Joi.string().required().messages({
        "any.required": "Zip code is required",
      }),
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
    deviceType: Joi.number()
      .valid(deviceType.ANDROID, deviceType.IOS)
      .required()
      .messages({
        "any.required": "Device type is required",
        "any.only": "Invalid device type",
      }),
    deviceToken: Joi.string().required().messages({
      "any.required": "Device token is required",
    }),
  }).or("phone", "email").messages({
    "object.missing": "Either phone or email is required",
  }),
};

const completeProfileValidation = {
  body: Joi.object({
    userId: Joi.string().required().messages({
      "any.required": "User ID is required",
    }),
    name: Joi.string().required().messages({
      "any.required": "Name is required",
    }),
    role: Joi.number()
      .valid(userRole.DRIVER, userRole.CUSTOMER)
      .required()
      .messages({
        "any.required": "Role is required",
        "any.only": "Invalid role",
      }),
    dob: Joi.date().required().messages({
      "any.required": "Date of birth is required",
    }),
    addressZipCode: Joi.string().required().messages({
      "any.required": "Address zip code is required",
    }),
    addressType: Joi.number()
      .valid(addressType.COMPANY_USE, addressType.PERSONAL_USE)
      .when("role", {
        is: 2,
        then: Joi.required(),
        otherwise: Joi.optional(),
      })
      .messages({
        "any.required": "Address type is required for customers",
        "any.only": "Invalid address type",
      }),
    drivingLicenseNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "Driving license number is required for drivers",
    }),
    carInsuranceNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "Car insurance number is required for drivers",
    }),
    carInsuranceNumberExpDate: Joi.date().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "Car insurance expiration date is required for drivers",
    }),
    socialSecurityNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "Social security number is required for drivers",
    }),
    vehicleNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "Vehicle number is required for drivers",
    }),
    licensePlate: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }).messages({
      "any.required": "License plate is required for drivers",
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
      })
      .messages({
        "any.required": "Vehicle type is required for drivers",
        "any.only": "Invalid vehicle type",
      }),
  }),
};

const loginUserValidation = {
  body: Joi.object({
    email: Joi.string().email().optional().messages({
      "string.email": "Invalid email format",
    }),
    phone: Joi.number().optional().messages({
      "number.base": "Phone number must be a number",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
    deviceType: Joi.number()
      .valid(deviceType.ANDROID, deviceType.IOS)
      .required()
      .messages({
        "any.required": "Device type is required",
        "any.only": "Invalid device type",
      }),
    deviceToken: Joi.string().required().messages({
      "any.required": "Device token is required",
    }),
  }).or("phone", "email").messages({
    "object.missing": "Either phone or email is required",
  }),
};

const changePasswordValidation = {
  body: Joi.object({
    oldPassword: Joi.string().required().messages({
      "any.required": "Old password is required",
    }),
    newPassword: Joi.string().required().messages({
      "any.required": "New password is required",
    }),
  }),
};

const forgotPasswordValidation = {
  body: Joi.object({
    email: Joi.string().email().optional().messages({
      "string.email": "Invalid email format",
    }),
    phone: Joi.number().optional().messages({
      "number.base": "Phone number must be a number",
    }),
  }).or("phone", "email").messages({
    "object.missing": "Either phone or email is required",
  }),
};

const verifyOTPValidation = {
  body: Joi.object({
    userId: Joi.string().required().messages({
      "any.required": "User ID is required",
    }),
    otp: Joi.string().required().messages({
      "any.required": "OTP is required",
    }),
  }),
};

const resetPasswordValidation = {
  body: Joi.object({
    userId: Joi.string().required().messages({
      "any.required": "User ID is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),
};

const updateUserProfileValidation = {
  body: Joi.object({
    email: Joi.string().optional().messages({
      "string.email": "Invalid email format",
    }),
    phone: Joi.string().optional().messages({
      "string.base": "Phone number must be a string",
    }),
    state: Joi.string().optional().messages({
      "string.base": "State must be a string",
    }),
    zipCode: Joi.string().optional().messages({
      "string.base": "Zip code must be a string",
    }),
  }),
};

const userDocumentsValidation = {
  body: Joi.object({
    dob: Joi.date().optional().messages({
      "date.base": "Invalid date format for date of birth",
    }),
    state: Joi.string().optional().messages({
      "string.base": "State must be a string",
    }),
    drivingLicenseNumber: Joi.string().optional().messages({
      "string.base": "Driving license number must be a string",
    }),
    carInsuranceNumber: Joi.string().optional().messages({
      "string.base": "Car insurance number must be a string",
    }),
    carInsuranceNumberExpDate: Joi.date().optional().messages({
      "date.base": "Invalid date format for car insurance expiration date",
    }),
    socialSecurityNumber: Joi.string().optional().messages({
      "string.base": "Social security number must be a string",
    }),
    vehicleNumber: Joi.string().optional().messages({
      "string.base": "Vehicle number must be a string",
    }),
    licensePlate: Joi.string().optional().messages({
      "string.base": "License plate must be a string",
    }),
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
      .optional()
      .messages({
        "any.only": "Invalid vehicle type",
      }),
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
