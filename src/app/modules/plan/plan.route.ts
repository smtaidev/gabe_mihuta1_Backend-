import { Router } from "express";
import { PlanController } from "./plan.controller";

const router = Router();

router.post("/create-plan", PlanController.createPlan);

router.get("/", PlanController.getAllPlans);

router.get("/:planId", PlanController.getPlanById);

//router.delete("/:planId", PlanController.deletePlan);

export const PlanRoutes = router;
