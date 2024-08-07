import Notification from "../models/notification.model.js";
import { getUserById } from "../services/user.services.js";
import { TryCatch } from "../utils/helper.js";
import { userRole } from "../utils/enums/enums.js";
import httpStatus from "http-status";
import ErrorHandler from "../utils/ErrorHandler.js";

const getAllNotifications = TryCatch(async (req, res, next) => {
  const { userId } = req;

  const user = await getUserById(userId);
  const role = user.role;
  let query = { isRead: false };

  if (role == userRole.DRIVER) query = { driverId: userId };
  if (role == userRole.CUSTOMER) query = { customerId: userId };

  //   const notifications = await Notification.aggregate([
  //     {
  //       $match: {
  //         ...query,
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: "$createdAt",
  //         notifications: { $push: "$$ROOT" },
  //       },
  //     },
  //     // {
  //     //   $project: {
  //     //     _id: 0,
  //     //     date: "$_id",
  //     //     notifications: 1,
  //     //   },
  //     // },
  //     {
  //       $sort: { date: 1 },
  //     },
  //   ]);

  const notifications = await Notification.find(query).sort({ createdAt: -1 });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Notifications fetched successfully",
    notifications,
  });
});

const readNotification = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { notificationId } = req.params;

  const user = await getUserById(userId);
  const role = user.role;
  let query = { _id: notificationId };

  if (role == userRole.DRIVER) query = { driverId: userId };
  if (role == userRole.CUSTOMER) query = { customerId: userId };

  const notification = await Notification.findOne(query);

  if (!notification) {
    return next(
      new ErrorHandler("Notification not found", httpStatus.BAD_REQUEST)
    );
  }

  notification.isRead = true;
  await notification.save();

  res.status(httpStatus.OK).json({
    success: true,
    notification,
  });
});

export default {
  getAllNotifications,
  readNotification,
};
