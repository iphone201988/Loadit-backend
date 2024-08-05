import httpStatus from "http-status";
import { getUserById } from "../services/user.services.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { TryCatch } from "../utils/helper.js";
import Stripe from "stripe";
import "dotenv/config";
import {
  deliveryStatus,
  paymentStatus,
  transactionType,
  userRole,
} from "../utils/enums/enums.js";
import Payment from "../models/payment.model.js";
import { getJobById } from "../services/job.services.js";
import Withdraw from "../models/withdraw.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// TODO: Get payment history for the customer based on different cards

// CUSTOMER API's

// Getting all the cards of customer
const getCustomerCards = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (!user.stripeCustomerId)
    return next(
      new ErrorHandler(
        "User doesn't have payment account!",
        httpStatus.BAD_REQUEST
      )
    );

  const cards = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  const customer = await stripe.customers.retrieve(user.stripeCustomerId);

  const allCards = cards.data.map((card) => {
    if (card.id == customer.invoice_settings.default_payment_method) {
      return { ...card, DEFAULT: true };
    } else {
      return { ...card, DEFAULT: false };
    }
  });

  res.status(httpStatus.OK).json({
    success: true,
    message: "Cards fetched successfully",
    cards: allCards,
  });
});

// Adding customer card
const addCustomerCard = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { cardId, isPrimary } = req.body;

  const user = await getUserById(userId);

  if (user.role !== userRole.CUSTOMER)
    return next(
      new ErrorHandler("User is not a customer", httpStatus.BAD_REQUEST)
    );

  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    });

    user.stripeCustomerId = customer.id;
    user.isStripeAccountConnected = true;
    await user.save();
  }

  await stripe.paymentMethods.attach(cardId, {
    customer: user.stripeCustomerId,
  });

  // Setting default card
  if (isPrimary) {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: cardId,
      },
    });
  }

  res.status(httpStatus.CREATED).json({
    success: true,
    message: "Card added successfully",
    customerId: user.stripCustomerId,
  });
});

// DRIVER API's

// Getting all the accounts of driver
const getDriverAccounts = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  if (!user.stripeCustomerId)
    return next(
      new ErrorHandler(
        "User doesn't have payment account!",
        httpStatus.BAD_REQUEST
      )
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

// Creating driver stripe connect account and genrating link for the verification
const createDriverAccount = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);

  if (user.role !== userRole.DRIVER)
    return next(new ErrorHandler("User is not driver", httpStatus.BAD_REQUEST));

  if (user.stripeCustomerId && user.isStripeAccountConnected)
    return next(
      new ErrorHandler("Account already created", httpStatus.BAD_REQUEST)
    );

  if (!user.stripeCustomerId) {
    const account = await stripe.accounts.create({
      country: "US",
      email: user.email,
      type: "express",
    });

    user.stripeCustomerId = account.id;
    await user.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeCustomerId,
    refresh_url: process.env.BACKEND_URL + "api/payment/account/refresh",
    return_url:
      process.env.BACKEND_URL +
      "api/payment/account/success?account_id=" +
      user.stripeCustomerId,
    type: "account_onboarding",
  });

  res.status(httpStatus.CREATED).json({
    success: true,
    accountId: user.stripeCustomerId,
    accountLink,
  });
});

export const giveTip = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId, amount } = req.boy;

  const job = await Job.findOne({
    _id: jobId,
    deliveryPartner: { $exists: true },
    deliveryStatus: deliveryStatus.DELIVERED,
  });

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

  const customer = await getUserById(userId);
  const driver = await getUserById(job.deliveryPartner);

  // Deducting amount from the customer account
  const stripeCustomer = await stripe.customers.retrieve(
    customer.stripeCustomerId
  );

  const cardId = stripeCustomer?.invoice_settings?.default_payment_method;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount ? amount * 100 : job.amount * 100,
    currency: "usd",
    customer: customer.stripeCustomerId,
    payment_method: cardId,
    off_session: true,
    confirm: true,
  });

  await Payment.create({
    userId: customer._id,
    jobId,
    cardId,
    amount,
    isTip: true,
    transactionType: transactionType.CUSTOMER_DEDUCTION,
    paymentIntentId: paymentIntent.id,
    status:
      paymentIntent.status == "succeeded"
        ? paymentStatus.COMPLETED
        : paymentStatus.FAILED,
  });

  if (paymentIntent.status == "succeeded") {
    const transfer = await stripe.transfers.create({
      amount: amount ? amount * 100 : job.amount * 100,
      currency: paymentIntent.currency,
      destination: driver.stripeCustomerId,
      source_transaction: paymentIntent?.charges?.data[0].id,
    });

    const driverAccount = await stripe.accounts.retrieve(
      driver.stripeCustomerId
    );

    await Payment.create({
      userId: driver._id,
      jobId,
      cardId: driverAccount.external_accounts.data[0].id,
      amount,
      isTip: true,
      transferId: transfer.id,
      transactionType: transactionType.DRIVER_TRANSFER,
      status: paymentStatus.COMPLETED,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment successful",
    });
  } else {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment Failed",
    });
  }
});

const deductAndTransferPayment = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const { jobId } = req.params;

  const driver = await getUserById(userId);

  const job = await Job.findOne({
    _id: jobId,
    deliveryPartner: driver._id,
    deliveryStatus: deliveryStatus.DELIVERED,
  });

  if (driver.role != userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

  if (job.isAmountDeducted)
    return next(
      new ErrorHandler(
        "Amount is already deducted for this job",
        httpStatus.BAD_REQUEST
      )
    );

  const customer = await getUserById(job.userId);
  const amount = job.amount;

  const stripeCustomer = await stripe.customers.retrieve(
    customer.stripeCustomerId
  );

  const cardId = stripeCustomer?.invoice_settings?.default_payment_method;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount ? amount * 100 : job.amount * 100,
    currency: "usd",
    customer: customer.stripeCustomerId,
    payment_method: cardId,
    off_session: true,
    confirm: true,
  });

  // if (!paymentIntent || paymentIntent.status !== "succeeded")
  //   return next(new ErrorHandler("Payment failed", httpStatus.BAD_REQUEST));

  job.isAmountDeducted = true;
  await job.save();

  await Payment.create({
    userId: customer._id,
    jobId,
    cardId,
    amount,
    transactionType: transactionType.CUSTOMER_DEDUCTION,
    paymentIntentId: paymentIntent.id,
    status:
      paymentIntent.status == "succeeded"
        ? paymentStatus.COMPLETED
        : paymentStatus.FAILED,
  });

  // TODO: Send amount after commission deduction
  if (paymentIntent.status == "succeeded") {
    const transfer = await stripe.transfers.create({
      amount: amount ? amount * 100 : job.amount * 100,
      currency: paymentIntent.currency,
      destination: driver.stripeCustomerId,
      source_transaction: paymentIntent?.charges?.data[0].id,
    });

    const driverAccount = await stripe.accounts.retrieve(
      driver.stripeCustomerId
    );

    await Payment.create({
      userId: driver._id,
      jobId,
      cardId: driverAccount.external_accounts.data[0].id,
      amount,
      transferId: transfer.id,
      transactionType: transactionType.DRIVER_TRANSFER,
      status: paymentStatus.COMPLETED,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment successful",
    });
  } else {
    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment Failed",
    });
  }
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

  // if (job.isAmountDeducted)
  //   return next(
  //     new ErrorHandler(
  //       "Amount is already deducted for this job",
  //       httpStatus.BAD_REQUEST
  //     )
  //   );

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

  const user = await User.findOne({
    _id: driverAccountId,
    role: userRole.DRIVER,
  });

  if (!user)
    return next(new ErrorHandler("Driver not found", httpStatus.BAD_REQUEST));

  const job = await Job.findOne({
    _id: jobId,
    // deliveryPartner: driverAccountId,
    // deliveryStatus: deliveryStatus.DELIVERED,
  });

  if (!job)
    return next(new ErrorHandler("Job not found", httpStatus.BAD_REQUEST));

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

  if (user.role != userRole.DRIVER)
    return next(
      new ErrorHandler("User is not a driver", httpStatus.BAD_REQUEST)
    );

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

export const accountSuccess = TryCatch(async (req, res, next) => {
  const { account_id } = req.query;
  const account = await stripe.accounts.retrieve(account_id);

  if (account.details_submitted) {
    const user = await User.findOne({ stripeCustomerId: account_id });
    user.isStripeAccountConnected = true;
    await user.save();
  } else {
    return res.redirect("refresh");
  }

  res.status(httpStatus.OK).json({
    success: true,
    message: "Account created successfully",
  });
});

export const getAllTransactions = TryCatch(async (req, res, next) => {
  const { userId } = req;
  const user = await getUserById(userId);
  const transactions = await Payment.find({ userId: userId });
  res.status(httpStatus.OK).json({
    success: true,
    transactions,
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
  accountSuccess,
  deductAndTransferPayment,
};
