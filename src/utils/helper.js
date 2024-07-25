import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import twilio from "twilio";
import ErrorHandler from "./ErrorHandler.js";

export const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB successfully", process.env.MONGO_URI);
  } catch (error) {
    console.log("Error connecting to DB", error);
  }
};

export const TryCatch = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const removeEmptyValues = (obj) => {
  const newObj = {};
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        newObj[key] = obj[key].filter((value) => value !== null);
      } else {
        newObj[key] = removeEmptyValues(obj[key]);
      }
    } else if (obj[key] !== "" && obj[key] !== null) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};

export const validate = (schema) =>
  TryCatch(async (req, res, next) => {
    let errorMessage = "";
    let validationErrors = [];

    req.body = removeEmptyValues(req.body);
    req.query = removeEmptyValues(req.query);
    req.params = removeEmptyValues(req.params);

    if (schema.query) {
      const result = schema.query.validate(req.query, { abortEarly: false });
      errorMessage = result?.error?.details[0].message;
      validationErrors = result?.error?.details.map((error) => error.message);
    }
    if (schema.params && !validationErrors?.length) {
      const result = schema.params.validate(req.params, { abortEarly: false });
      errorMessage = result?.error?.details[0].message;
      validationErrors = result?.error?.details.map((error) => error.message);
    }

    if (schema.body && !validationErrors?.length) {
      const result = schema.body.validate(req.body, { abortEarly: false });
      errorMessage = result?.error?.details[0].message;
      validationErrors = result?.error?.details.map((error) => error.message);
    }

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
        details: validationErrors,
      });
    }

    next();
  });

export const generateJsonWebToken = (data) => {
  const token = jwt.sign(data, process.env.JWT_SECRET_KEY, {
    expiresIn: "3d",
  });
  return token;
};

export const generateOTP = () =>
  otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

export const addMinutesToCurrentTime = (minutes) => {
  return new Date().getTime() + minutes * 60000;
};

export const sendOTPOnEmail = async (receiverEmail, subject, text, body) => {
  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: "zohaib60610@gmail.com",
    to: receiverEmail,
    subject: subject,
    text: text,
    html: body,
  };

  transport.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      //console.log(info);
    }
  });
};

export const sendOTPOnPhone = async (body, receiverPhone = "") => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const message = await client.messages.create({
    body: body,
    from: process.env.TWILIO_ACCOUNT_FROM,
    to: "+91 8968607069",
  });

  console.log(message.sid);
};

export const getImages = (req, images) => {
  if (images.length === 1 && req.file) {
    return process.env.BACKEND_URL + "uploads/" + req.file.filename;
  }

  if (req.files) {
    return images.reduce((acc, image) => {
      if (req.files[image] !== undefined) {
        acc[image] =
          process.env.BACKEND_URL + "uploads/" + req.files[image][0].filename;
      }
      return acc;
    }, {});
  }

  throw new ErrorHandler("Images not found", 404);
};
