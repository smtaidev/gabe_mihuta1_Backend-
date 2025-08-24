// controllers/workoutPlan.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import { workoutPlanService } from "./phase.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import ApiError from "../../errors/ApiError";
import prisma from "../../utils/prisma";

const fetchAIPlanController = catchAsync(async (req, res) => {
  const user = req.user;
  const { mission, time_commitment, gear, squad } = req.body;

  if (!user) throw new ApiError(status.UNAUTHORIZED, "User not found");

  // Determine which phase to generate
  // 1. Find the last phase the user has
  const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
    where: { userId: user.id },
    orderBy: { phase: "desc" },
  });

  // default first phase
  let nextPhase = 1;

  if (lastPhaseRecord) {
    // 🔎 2. Check if the current phase is fully completed
    const incompleteWorkout = await prisma.workoutPlanDay.findFirst({
      where: {
        userId: user.id,
        phase: lastPhaseRecord.phase,
        completed: false,
      },
    });

    if (incompleteWorkout) {
      // ❌ still in progress → block request
      throw new ApiError(
        status.BAD_REQUEST,
        `You are still in Phase ${lastPhaseRecord.phase}. Complete it before generating the next phase.`
      );
    }

    // ✅ safe to move to next phase
    if (lastPhaseRecord.phase < 3) {
      nextPhase = lastPhaseRecord.phase + 1;
    } else {
      return sendResponse(res, {
        statusCode: status.OK,
        message: "Phase 3 completed. You can start a new Phase 1 manually.",
      });
    }
  }

  // Generate plan for next phase
  const savedPlan = await workoutPlanService.fetchAndSaveAIWorkoutPlan(
    nextPhase,
    { mission, time_commitment, gear, squad },
    user.id
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    message: `Phase ${nextPhase} AI workout plan fetched and saved successfully`,
    data: savedPlan,
  });
});


const getTodayWorkoutController = catchAsync(async (req, res) => {
  const user = req.user;

  // ✅ Always fetch preferences from Phase 1 (first record)
  const preferences = await prisma.mission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }, // Phase 1 = oldest
  });

  if (!preferences) {
    throw new ApiError(status.BAD_REQUEST, "User preferences not found in Phase 1");
  }

  const requestBody = {
    mission: preferences.mission,
    time_commitment: preferences.timeCommitment,
    gear: preferences.gearCheck,
    squad: preferences.squad,
  };

  // ✅ Auto-complete past days and generate next phase if needed
  await workoutPlanService.autoProgressPhases(user.id, requestBody);

  // ✅ Fetch today’s workout
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todayWorkout = await prisma.workoutPlanDay.findMany({
    where: {
      userId: user.id,
      scheduledDate: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { day: "asc" },
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "Today's workout fetched",
    data: todayWorkout,
  });
});

export const phaseController = {
  fetchAIPlanController,
  getTodayWorkoutController,
};

