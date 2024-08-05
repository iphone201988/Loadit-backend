import express from "express";
import notificationController from "../controllers/notification.controller.js";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";

const notificationRouter = express.Router();

notificationRouter.get(
  "/getAllNotifications",
//   authenticationMiddleware,
  notificationController.getAllNotifications
);

export default notificationRouter;
