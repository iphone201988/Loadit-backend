import httpStatus from "http-status";
import { getUserById } from "../services/user.services.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../utils/helper.js";
import Stripe from "stripe";
import "dotenv/config";
import { transactionType, userRole } from "../utils/enums/enums.js";
import Payment from "../models/payment.model.js";
import { getJobById } from "../services/job.services.js";
import Withdraw from "../models/withdraw.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Getting all the cards of customer
const getCustomerCards = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (!user.stripeCustomerId)
    return next(new ErrorHandler("No cards found!", httpStatus.BAD_REQUEST));

  const cards = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Cards fetched successfully",
    cards: cards.data,
  });
});

// Getting all the accounts of driver
const getDriverAccounts = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  const externalAccounts = await stripe.accounts.listExternalAccounts(
    user.stripeCustomerId
  );

  res.status(httpStatus.OK).json({
    success: true,
    message: "Accounts fetched successfully",
    externalAccounts,
  });
});

// Adding customer card
const addCustomerCard = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { cardId } = req.body;

  const user = await getUserById(userId);

  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  let stripeCustomerId = "";

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    });

    stripeCustomerId = customer.id;
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  stripeCustomerId = user.stripCustomerId;

  await stripe.paymentMethods.attach(cardId, {
    customer: user.stripeCustomerId,
  });

  // const token = await stripe.tokens.create({
  //   card: {
  //     number: '4242424242424242',
  //     exp_month: 12,
  //     exp_year: 2024,
  //     cvc: '123',
  //   },
  // });

  // const externalAccount = await stripe.accounts.createExternalAccount(
  //   user.stripeCustomerId,
  //   {
  //     external_account: cardId,
  //   }
  // );

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Card added successfully",
    customerId: user.stripCustomerId,
    externalAccount,
  });
});

// Creating driver stripe connect account and genrating link for the verification
const createDriverAccount = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(new ErrorHandler("User is not driver", httpStatus.BAD_REQUEST));

  if (user.stripeCustomerId)
    return next(
      new ErrorHandler("Account already created", httpStatus.BAD_REQUEST)
    );

  const account = await stripe.accounts.create({
    country: "US",
    email: user.email,
    type: "express",
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: process.env.BACKEND_URL,
    return_url: process.env.BACKEND_URL,
    type: "account_onboarding",
  });

  user.stripeCustomerId = account.id;
  await user.save();

  res.status(httpStatus.CREATED).json({
    success: true,
    account,
    accountLink,
  });
});

// Deducting payment from customer account
const deductPayment = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { amount, cardId, jobId, transactionType } = req.body;

  const user = await getUserById(userId);
  const job = await getJobById(jobId);

  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  if (!user.stripeCustomerId)
    return next(new ErrorHandler("Customer not found", httpStatus.BAD_REQUEST));

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

  if (job.isAmountDeducted)
    return next(
      new ErrorHandler(
        "Amount is already deducted for this job",
        httpStatus.BAD_REQUEST
      )
    );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount ? amount * 100 : job.amount * 100,
    currency: "usd",
    customer: user.stripeCustomerId,
    payment_method: cardId,
    off_session: true,
    confirm: true,
  });

  if (!paymentIntent || paymentIntent.status !== "succeeded")
    return next(new ErrorHandler("Payment failed", httpStatus.BAD_REQUEST));

  job.isAmountDeducted = true;
  await job.save();

  const payment = await Payment.create({
    userId,
    jobId,
    cardId,
    amount,
    transactionType,
    paymentIntentId: paymentIntent.id,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Payment successful",
    paymentIntentId: paymentIntent.id,
  });
});

const transferAmount = TryCatch(async (req, res, next) => {
  const { paymentIntentId, driverAccountId, amount, jobId } = req.body;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  const user = await getUserById(driverAccountId);
  const job = await getJobById(jobId);

  const payment = await Payment.findOne({
    paymentIntentId: paymentIntentId,
    transactionType: transactionType.CUSTOMER_DEDUCTION,
    paymentTransferredStatus: false,
  });

  if (!payment)
    return next(new ErrorHandler("Payment not found", httpStatus.BAD_REQUEST));

  if (!job.isAmountDeducted)
    return next(
      new ErrorHandler(
        "Amount is not deducted from the customer",
        httpStatus.BAD_REQUEST
      )
    );

  if (paymentIntent.status !== "succeeded")
    return next(
      new ErrorHandler("Payment was not successful", httpStatus.BAD_REQUEST)
    );

  const transfer = await stripe.transfers.create({
    amount: amount ? amount * 100 : job.amount * 100,
    currency: paymentIntent.currency,
    destination: user.stripeCustomerId,
    source_transaction: paymentIntent?.charges?.data[0].id,
  });

  payment.paymentTransferredStatus = true;
  payment.transactionType = transactionType.DRIVER_WITHDRAW;
  payment.transferId = transfer.id;
  await payment.save();

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Amount transferred successfully",
    transfer,
  });
});

const getBalance = TryCatch(async (req, res, next) => {
  const { userId } = req;

  const user = await getUserById(userId);

  if (!user.stripeCustomerId)
    return next(new ErrorHandler("Customer not found", httpStatus.BAD_REQUEST));

  const balance = await stripe.balance.retrieve({
    stripeAccount: user.stripeCustomerId,
  });

  const availableBalance = balance.available.reduce(
    (total, bal) => total + bal.amount,
    0
  );

  const pendingBalance = balance.pending.reduce(
    (total, bal) => total + bal.amount,
    0
  );

  console.log("balance:::", {
    available: availableBalance / 100,
    pending: pendingBalance / 100,
    total: (availableBalance + pendingBalance) / 100,
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Balance fetched successfully",
    balance,
  });
});

const withdrawMoney = TryCatch(async (req, res, next) => {
  const { amount, driverAccountId } = req.body;
  const { userId } = req;

  const user = await getUserById(userId);

  if (!user.stripeCustomerId)
    return next(new ErrorHandler("Customer not found", httpStatus.BAD_REQUEST));

  const amountInCents = amount * 100;

  // Create a payout to the user's connected account
  const payout = await stripe.payouts.create(
    {
      amount: amountInCents,
      currency: "usd",
      destination: driverAccountId, // ba_1Pdt9RQvVajkb5neELIOcxFv,
      method: "instant", // or 'standard' for standard payout
    },
    {
      stripeAccount: user.stripeCustomerId,
    }
  );

  if (!payout)
    return next(new ErrorHandler("Withdraw failed", httpStatus.BAD_REQUEST));

  await Withdraw.create({
    userId,
    payoutId: payout.id,
    amount: amountInCents / 100,
    destinationAccount: driverAccountId,
    withdrawStatus: payout.status === "pending" && 1,
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Withdraw successful",
    payout,
  });
});

export default {
  addCustomerCard,
  createDriverAccount,
  getCustomerCards,
  deductPayment,
  transferAmount,
  getBalance,
  withdrawMoney,
  getDriverAccounts,
};
