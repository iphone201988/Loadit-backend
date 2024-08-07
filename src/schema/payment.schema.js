import Joi from "joi";
import { transactionType } from "../utils/enums/enums.js";

const addCustomerCardValidation = {
  body: Joi.object().keys({
    cardId: Joi.string().required().messages({
      "string.base": "Card ID must be a string.",
      "string.empty": "Card ID cannot be empty.",
      "any.required": "Card ID is required.",
    }),
    isPrimary: Joi.boolean().required().messages({
      "boolean.base": "isPrimary must be a boolean value.",
      "any.required": "isPrimary is required.",
    }),
  }),
};

const deductPaymentValidation = {
  body: Joi.object().keys({
    amount: Joi.number().optional().messages({
      "number.base": "Amount must be a number.",
    }),
    cardId: Joi.string().required().messages({
      "string.base": "Card ID must be a string.",
      "string.empty": "Card ID cannot be empty.",
      "any.required": "Card ID is required.",
    }),
    jobId: Joi.string().required().messages({
      "string.base": "Job ID must be a string.",
      "string.empty": "Job ID cannot be empty.",
      "any.required": "Job ID is required.",
    }),
    transactionType: Joi.number()
      .valid(transactionType.CUSTOMER_DEDUCTION)
      .required()
      .messages({
        "number.base": "Transaction Type must be a number.",
        "any.only": "Transaction Type must be CUSTOMER_DEDUCTION.",
        "any.required": "Transaction Type is required.",
      }),
  }),
};

const transferAmountValidation = {
  body: Joi.object().keys({
    paymentIntentId: Joi.string().required().messages({
      "string.base": "Payment Intent ID must be a string.",
      "string.empty": "Payment Intent ID cannot be empty.",
      "any.required": "Payment Intent ID is required.",
    }),
    driverAccountId: Joi.string().required().messages({
      "string.base": "Driver Account ID must be a string.",
      "string.empty": "Driver Account ID cannot be empty.",
      "any.required": "Driver Account ID is required.",
    }),
    amount: Joi.number().optional().messages({
      "number.base": "Amount must be a number.",
    }),
    jobId: Joi.string().required().messages({
      "string.base": "Job ID must be a string.",
      "string.empty": "Job ID cannot be empty.",
      "any.required": "Job ID is required.",
    }),
  }),
};

const withdrawMoneyValidation = {
  body: Joi.object().keys({
    driverAccountId: Joi.string().required().messages({
      "string.base": "Driver Account ID must be a string.",
      "string.empty": "Driver Account ID cannot be empty.",
      "any.required": "Driver Account ID is required.",
    }),
    amount: Joi.number().required().messages({
      "number.base": "Amount must be a number.",
      "any.required": "Amount is required.",
    }),
  }),
};

const deductAndTransferPaymentValidation = {
  params: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
  }),
};

const giveTipValidation = {
  body: Joi.object({
    jobId: Joi.string().required().messages({
      "any.required": "Job ID is required",
    }),
    amount: Joi.number().required().messages({
      "number.base": "Amount must be a number.",
    }),
  }),
};

export default {
  addCustomerCardValidation,
  deductPaymentValidation,
  transferAmountValidation,
  withdrawMoneyValidation,
  deductAndTransferPaymentValidation,
  giveTipValidation
};
