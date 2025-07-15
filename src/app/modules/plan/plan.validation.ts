import { z } from "zod";

const createPlanZodSchema = z.object({
  body: z.object({
    planName: z.string({
    required_error: "Plan name is required",
  }),

  amount: z.number({
    required_error: "Amount is required",
  }).min(0, "Amount cannot be negative"),

  currency: z.string({
    invalid_type_error: "Currency must be a string",
  }).default("usd").optional(),

  interval: z.enum(["month"]).optional(),

  intervalCount: z.number({
   invalid_type_error: "Interval count must be a number",
  }).optional(),

  productId: z.string().optional(),  // You may want to generate/store this after Stripe product creation

  priceId: z.string().optional(),    // Same as productId

  active: z.boolean().optional().default(true),

  description: z.string().optional(),

  features: z.any().optional(),      // Could be refined to z.array(z.string())
  })

});

export const PlanValidation = {
  createPlanZodSchema,
};
