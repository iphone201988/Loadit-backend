import jwt from "jsonwebtoken";
import { TryCatch } from "../utils/helper.js";
import { getUserById } from "../services/user.services.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import httpStatus from "http-status";

export const authenticationMiddleware = TryCatch(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return next(
      new ErrorHandler(
        "Please login to access the route",
        httpStatus.BAD_REQUEST
      )
    );

  const token = authHeader.split(" ")[1];
  const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);

  if (!decode)
    return next(new ErrorHandler("Invalid token", httpStatus.BAD_REQUEST));

  const user = await getUserById(decode.id);

  if (!user)
    return next(new ErrorHandler("User not found", httpStatus.BAD_REQUEST));

  if (decode.jti !== user.jti)
    return next(new ErrorHandler("Unauthorized", httpStatus.UNAUTHORIZED));

  req.userId = user._id;
  // req.token = token;
  next();
});
