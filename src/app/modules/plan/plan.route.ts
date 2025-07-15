
import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { PlanController } from "./plan.controller";
import { PlanValidation } from "./plan.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.post("/create-plan", 
    validateRequest(PlanValidation.createPlanZodSchema),
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    PlanController.createPlan);

export const PlanRoutes = router;