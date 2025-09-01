// routes/workoutPlan.route.ts
import express from "express";
import { phaseController } from "./phase.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/generate-phase1", auth(UserRole.USER), phaseController.phase1Plan);

router.post("/generate-Phase2", auth(UserRole.USER), phaseController.Phase2Plan);

router.post("/generate-Phase3", auth(UserRole.USER), phaseController.Phase3Plan);

//router.post("/fetch-ai-plan", auth(UserRole.USER), phaseController.fetchAIPlanController);

router.get("/get-workout-plan", auth(UserRole.USER), phaseController.getTodayWorkoutController);

export const PhaseRoutes = router;
