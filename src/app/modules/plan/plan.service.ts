import status from "http-status";
import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import ApiError from "../../errors/ApiError";
import { Interval, Plan } from "@prisma/client";

const createPlan = async (payload: Plan) => {
  const result = await prisma.$transaction(async (tx) => {
    const product = await stripe.products.create({
      name: payload.planName,
      description: payload.description!,
      active: true,
    });

    if (payload.interval && !payload.intervalCount) {
      throw new ApiError(status.BAD_REQUEST, "Interval count is required when interval is specified.");
    }

    if (payload.intervalCount && !payload.interval) {
      throw new ApiError(status.BAD_REQUEST, "Interval is required when interval count is specified.");
    }

    let price: any = {};

    if (payload.interval && payload.intervalCount) {
      const recurringData: any = {
        interval: payload.interval,
        interval_count: payload.intervalCount,
      };

       price = await stripe.prices.create({
        currency: "usd",
        unit_amount: Math.round(payload.amount * 100),
        active: true,
        recurring: recurringData,
        product: product.id,
      });
    }else {
      price = await stripe.prices.create({
        currency: "usd",
        unit_amount: Math.round(payload.amount * 100),
        active: true,
        product: product.id,
      });
    }



    const dbPlan = await tx.plan.create({
      data: {
        amount: payload.amount || 0,
        planName: payload.planName,
        currency: "usd",
        interval: payload?.interval,
        intervalCount: payload?.intervalCount,
        productId: product.id,
        priceId: price.id,
        description: payload.description,
        features: payload.features,
      },
    });

    return dbPlan;
  });

  return result;
};

export const PlanServices = {
  createPlan,
};
