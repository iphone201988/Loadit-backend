import Stripe from "stripe";
import express from "express";
import Payment from "../models/payment.model.js";
import { transactionType } from "../utils/enums/enums.js";
import { getJobById } from "../services/job.services.js";
import { getUserById } from "../services/user.services.js";

export const stripeWebhook = async (app) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret =
    "whsec_ca8c9e03c4250887be86b2eff5101fd20648589d910511cc41661e95cdeed60e";

  app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (request, response) => {
      const sig = request.headers["stripe-signature"];

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          endpointSecret
        );
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the event
      switch (event.type) {
        case "charge.updated":
          const chargeUpdated = event.data.object;

          if (chargeUpdated.paid && chargeUpdated.status === "succeeded") {
            
            const customerDeductedPayment = await Payment.findOne({
              cardId: chargeUpdated.payment_method,
              paymentIntentId: chargeUpdated.payment_intent,
              transactionType: transactionType.CUSTOMER_DEDUCTION,
            });

            // console.log("customerDeductedPayment:::", customerDeductedPayment);

            const amount = customerDeductedPayment.amount;
            const paymentIntent = await stripe.paymentIntents.retrieve(
              chargeUpdated.payment_intent
            );
            const jobId = customerDeductedPayment.jobId;
            const job = await getJobById(jobId);
            const driver = await getUserById(job.deliveryPartner);
            console.log("driver:::", driver);

            const transfer = await stripe.transfers.create({
              amount: amount ? amount * 100 : job.amount * 100,
              currency: paymentIntent.currency,
              destination: driver.stripeCustomerId,
              source_transaction: paymentIntent?.charges?.data[0].id,
            });

            await Payment.create({
              userId: driver._id,
              jobId,
              cardId: driver.stripeCustomerId,
              amount,
              transferId: transfer.id,
              transactionType: transactionType.DRIVER_TRANSFER,
            });
          }
          // Then define and call a function to handle the event payment_intent.succeeded
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      response.send();
    }
  );
};
