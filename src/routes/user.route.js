import express from "express";
import { userController } from "../controllers/user.controller.js";
import userSchema from "../schema/user.schema.js";
import { validate } from "../utils/helper.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import { validateFiles } from "../middlewares/validateFiles.middleware.js";
import uploadS3 from "../middlewares/multerS3.middleware.js";

const userRoutes = express.Router();

userRoutes.post(
  "/register",
  validate(userSchema.registerUserValidation),
  userController.register
);

userRoutes.post(
  "/login",
  validate(userSchema.loginUserValidation),
  userController.login
);

userRoutes.post(
  "/forgotPassword",
  validate(userSchema.forgotPasswordValidation),
  userController.forgotPassword
);

userRoutes.post(
  "/verifyOTP",
  validate(userSchema.verifyOTPValidation),
  userController.verifyOTP
);

userRoutes.post(
  "/resetPassword",
  validate(userSchema.resetPasswordValidation),
  userController.resetPassword
);

userRoutes.post(
  "/changePassword",
  authenticationMiddleware,
  validate(userSchema.changePasswordValidation),
  userController.changePassword
);

userRoutes.get(
  "/getProfileInformation",
  authenticationMiddleware,
  userController.getProfileInformation
);

userRoutes.put(
  "/completeProfile",
  uploadS3.fields([
    { name: "driverImage", maxCount: 1 },
    { name: "drivingLicenseImage", maxCount: 1 },
    { name: "carInsuranceImage", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
  ]),
  validateFiles([
    "driverImage",
    "drivingLicenseImage",
    "carInsuranceImage",
    "vehicleImage",
  ]),
  validate(userSchema.completeProfileValidation),
  userController.completeProfile
);

userRoutes.post(
  "/logoutUser",
  authenticationMiddleware,
  userController.logoutUser
);

userRoutes.put(
  "/updateUserProfile",
  authenticationMiddleware,
  uploadS3.single("driverImage"),
  validate(userSchema.updateUserProfileValidation),
  userController.updateUserProfile
);

userRoutes.put(
  "/updateUserDocuments",
  authenticationMiddleware,
  uploadS3.fields([
    { name: "drivingLicenseImage", maxCount: 1 },
    { name: "carInsuranceImage", maxCount: 1 },
  ]),
  validate(userSchema.userDocumentsValidation),
  userController.updateUserDocuments
);

userRoutes.put(
  "/updateUserVehicleInformation",
  authenticationMiddleware,
  uploadS3.single("vehicleImage"),
  validate(userSchema.userVehicleInformationValidation),
  userController.updateUserVehicleInformation
);

export default userRoutes;
