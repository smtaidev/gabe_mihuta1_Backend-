import { all } from "axios";
import { z } from "zod";


const planValidationSchema = z.object({
  body: z.object({
    planName: z.string().min(1, "Plan name is required"),
    description: z.string().max(500).optional(),
    amount: z.number().min(0, "Amount must be positive"),
    currency: z.string().default("eur").optional(),
    active: z.boolean().default(true).optional(),
    allowedPhases: z.number().min(0).optional(),
  }),
});

export const PlanValidation = {
  planValidationSchema,
};
