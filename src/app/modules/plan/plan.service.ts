import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import ApiError from "../../errors/ApiError";

interface Plan {
  planName: string;
  amount: number;
  currency?: string;
  description?: string;
  allowedPhases?: number;
  facilities?: string[];
  active?: boolean;
}

const createPlan = async (payload: Plan) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1️⃣ Create Product in Stripe
    const product = await stripe.products.create({
      name: payload.planName,
      description: payload.description || "",
      active: true,
    });

    let priceId: string | null = null;
    if (payload.amount > 0) {
      const price = await stripe.prices.create({
        currency: payload.currency || "eur",
        unit_amount: Math.round(payload.amount * 100),
        product: product.id,
        active: true,
      });

      priceId = price.id;
    }

    // 2️⃣ Create Plan in DB
    const dbPlan = await tx.plan.create({
      data: {
        planName: payload.planName,
        amount: payload.amount,
        currency: payload.currency || "eur",
        productId: product.id,
        priceId: priceId,
        active: payload.active ?? true,
        description: payload.description,
        allowedPhases: payload.allowedPhases ?? 0,
        facilities: payload.facilities || [], // <-- Add facilities here
      },
    });

    return dbPlan;
  });

  return result;
};





const getAllPlans = async () => {
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      planName: true,
      amount: true,
      currency: true,
      description: true,
      allowedPhases: true,
      facilities: true,
      //active: true,
    },
  });
  return plans;
};

// Get a Single Plan by ID
const getPlanById = async (planId: string) => {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  return plan;
};

// // Delete Plan
// const deletePlan = async (planId: string) => {
//   return await prisma.$transaction(async (tx) => {
//     // Step 1: Find the plan record in the database
//     const plan = await tx.plan.findUnique({
//       where: { id: planId },
//     });

//     if (!plan) {
//       throw new Error(`Plan with ID ${planId} not found`);
//     }

//     // Step 2: Deactivate the price in Stripe
//     await stripe.prices.update(plan.priceId, {
//       active: false,
//     });

//     // Step 3: Deactivate the product in Stripe
//     await stripe.products.update(plan.productId, {
//       active: false,
//     });

//     // Step 4: Delete the plan record in the database
//     await tx.plan.delete({
//       where: { id: planId },
//     });

//     return {
//       message: `Plan with ID ${planId} archived and deleted successfully`,
//     };
//   });
// };

export const PlanServices = {
  createPlan,
  getAllPlans,
  getPlanById,
//  deletePlan,
};
