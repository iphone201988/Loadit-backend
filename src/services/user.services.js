import User from "../models/user.model.js";
import crypto from "crypto";

export const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (user) return user;
  return false;
};

export const getUserByPhone = async (phone) => {
  const user = await User.findOne({ phone });
  if (user) return user;
  return false;
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (user) return user;
  return false;
};

export const generateRandomJti = (length = 16) => {
  return crypto.randomBytes(length).toString("hex");
};
