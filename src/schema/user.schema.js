import Joi from "joi";

const registerUserValidation = {
  body: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.number().optional(),
    address: Joi.object({
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
    }),
    password: Joi.string().required(),
  }).or("phone", "email"),
};

const completeProfileValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    role: Joi.number().valid(1, 2).required(),
    dob: Joi.date().required(),
    addressZipCode: Joi.string().required(),
    addressType: Joi.number().when("role", {
      is: 2,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    driverImage: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    drivingLicenseNumber: Joi.string().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    drivingLicenseImage: Joi.string().when("role", {
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
    carInsuranceImage: Joi.string().when("role", {
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
    vehicleType: Joi.number().when("role", {
      is: 1,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    vehicleImage: Joi.string().when("role", {
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

const resendOTPValidation = {
  body: Joi.object({
    userId: Joi.string().required(),
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
  resendOTPValidation,
};
