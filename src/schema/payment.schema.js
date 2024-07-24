import Joi from "joi";
import { transactionType } from "../utils/enums/enums.js";

const addCustomerCardValidation = {
  body: Joi.object().keys({
    cardId: Joi.string().required(),
  }),
};

const deductPaymentValidation = {
  body: Joi.object().keys({
    amount: Joi.number().optional(),
    cardId: Joi.string().required(),
    jobId: Joi.string().required(),
    transactionType: Joi.number()
      .valid(transactionType.CUSTOMER_DEDUCTION)
      .required(),
  }),
};

const transferAmountValidation = {
  body: Joi.object().keys({
    paymentIntentId: Joi.string().required(),
    driverAccountId: Joi.string().required(),
    amount: Joi.number().optional(),
    jobId: Joi.string().required(),
  }),
};

const withdrawMoneyValidation = {
  body: Joi.object().keys({
    driverAccountId: Joi.string().required(),
    amount: Joi.number().required(),
  }),
};

export default {
  addCustomerCardValidation,
  deductPaymentValidation,
  transferAmountValidation,
  withdrawMoneyValidation
};
