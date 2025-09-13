import { PaymentStatus } from '@prisma/client';
import status from "http-status";
import ApiError from "../errors/ApiError";
import prisma from "./prisma";
import Stripe from "stripe";

// Helper function to calculate end date based on plan interval
// const calculateEndDate = (startDate: Date, phase: number): Date => {
//   const endDate = new Date(startDate);

//   switch (phase) {
//     case 1:
//       endDate.setDate(endDate.getDate() + 30); // Phase 1 = 30 days total
//       break;
//     case 2:
//       endDate.setDate(endDate.getDate() + 60); // Phase 2 = 60 days total
//       break;
//     case 3:
//       endDate.setDate(endDate.getDate() + 90); // Phase 3 = 90 days total
//       break;
//     default:
//       throw new ApiError(status.BAD_REQUEST, `Unsupported phase: ${phase}`);
//   }

//   return endDate;
// };

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  // Find payment in database with plan details
  const payment = await prisma.subscription.findFirst({
    where: { stripePaymentId: paymentIntent.id },
    include: {
      plan: true,
    },
  });

  if (!payment) {
    throw new ApiError(
      status.NOT_FOUND,
      `Payment not found for ID: ${paymentIntent.id}`
    );
  }

  if (!payment.plan) {
    throw new ApiError(
      status.NOT_FOUND,
      "Plan not found for this subscription"
    );
  }

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(
      status.BAD_REQUEST,
      "Payment intent is not in succeeded state"
    );
  }

  const startDate = new Date();
  // const endDate = calculateEndDate(
  //   startDate, payment.plan.allowedPhases ?? 1
  // );

  // Execute both updates in a transaction
  await prisma.$transaction([

    prisma.subscription.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        startDate,
        //endDate,
      },
    }),
  ]);
  await prisma.user.update({
    where: { id: payment.userId },
    data: {
      subscribed: "SUBSCRIBED",
      //planExpiration: endDate,
    },
  });
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  // Find payment in the database
  const payment = await prisma.subscription.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (!payment) {
    throw new ApiError(
      status.NOT_FOUND,
      `Payment not found for ID: ${paymentIntent.id}`
    );
  }

  // Update payment status to failed
  await prisma.subscription.update({
    where: { id: payment.id },
    data: {
      paymentStatus: PaymentStatus.CANCELED,
      endDate: new Date(),
      stripePaymentId: paymentIntent.id,
    },
  });
};

export { handlePaymentIntentSucceeded, handlePaymentIntentFailed };
