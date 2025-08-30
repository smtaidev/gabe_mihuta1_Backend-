// routes/workoutPlan.route.ts
import express from "express";
import { phaseController } from "./phase.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/generate-phase1", auth(UserRole.USER), phaseController.phase1Plan);

router.post("/generate-lastPhase", auth(UserRole.USER), phaseController.lastPhasePlan);

//router.post("/fetch-ai-plan", auth(UserRole.USER), phaseController.fetchAIPlanController);

router.get("/get-workout-plan", auth(UserRole.USER), phaseController.getTodayWorkoutController);

export const PhaseRoutes = router;
