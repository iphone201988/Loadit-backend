import express from "express";
import { userController } from "../controllers/user.controller.js";
import userSchema from "../schema/user.schema.js";
import { validate } from "../utils/helper.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";

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
  "/resendOTP",
  validate(userSchema.resendOTPValidation),
  userController.resendOTP
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

userRoutes.post(
  "/singleUpload",
  upload.single("file"),
  userController.singleUpload
);

userRoutes.put(
  "/completeProfile",
  validate(userSchema.completeProfileValidation),
  userController.completeProfile
);

userRoutes.post(
  "/logoutUser",
  authenticationMiddleware,
  userController.logoutUser
);

export default userRoutes;
