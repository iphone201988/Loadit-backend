import express from "express";
import { authenticationMiddleware } from "../middlewares/auth.middleware.js";
import paymentController from "../controllers/payment.controller.js";
import { validate } from "../utils/helper.js";
import paymentSchema from "../schema/payment.schema.js";

const router = express.Router();

router.post(
  "/addCustomerCard",
  authenticationMiddleware,
  validate(paymentSchema.addCustomerCardValidation),
  paymentController.addCustomerCard
);

router.post(
  "/createDriver",
  authenticationMiddleware,
  paymentController.createDriverAccount
);

router.get(
  "/getCustomerCards",
  authenticationMiddleware,
  paymentController.getCustomerCards
);

router.get(
  "/getDriverAccounts",
  authenticationMiddleware,
  paymentController.getDriverAccounts
);

router.post(
  "/deductPayment",
  authenticationMiddleware,
  validate(paymentSchema.deductPaymentValidation),
  paymentController.deductPayment
);

router.post(
  "/transferAmount",
  authenticationMiddleware,
  validate(paymentSchema.transferAmountValidation),
  paymentController.transferAmount
);

router.get(
  "/getBalance",
  authenticationMiddleware,
  paymentController.getBalance
);

router.post(
  "/withdrawMoney",
  authenticationMiddleware,
  validate(paymentSchema.withdrawMoneyValidation),
  paymentController.withdrawMoney
);

export default router;
