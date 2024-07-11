import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import twilio from "twilio";

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

export const validate = (schema) =>
  TryCatch(async (req, res, next) => {
    const result = schema.validate(req.body, { abortEarly: false });
    const errorMessage = result?.error?.details[0].message;

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
        details: result?.error?.details.map((error) => error.message),
      });
    }

    next();
  });

export const generateJsonWebToken = (data) => {
  const token = jwt.sign(data, process.env.JWT_SECRET_KEY);
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

  return OTP;
};
