// controllers/workoutPlan.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import { workoutPlanService } from "./phase.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import ApiError from "../../errors/ApiError";
import prisma from "../../utils/prisma";

const phase1Plan = catchAsync(async (req, res) => {
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
    // 🔎 Find the last scheduled workout of this phase
    const lastWorkoutOfPhase = await prisma.workoutPlanDay.findFirst({
      where: { userId: user.id, phase: lastPhaseRecord.phase },
      orderBy: { scheduledDate: "desc" },
    });

    if (!lastWorkoutOfPhase) {
      throw new ApiError(
        status.BAD_REQUEST,
        `No workouts found in Phase ${lastPhaseRecord.phase}.`
      );
    }

    // 🔎 Check if today is BEFORE last scheduled date
    const today = new Date();
    if (today < lastWorkoutOfPhase.scheduledDate) {
      throw new ApiError(
        status.BAD_REQUEST,
        `You must finish Phase ${lastPhaseRecord.phase} (last workout on ${lastWorkoutOfPhase.scheduledDate.toDateString()}) before moving to the next phase.`
      );
    }

    // ✅ Safe to move to next phase
    // if (lastPhaseRecord.phase < 3) {
    //   nextPhase = lastPhaseRecord.phase + 1;
    // } else {
    //   return sendResponse(res, {
    //     statusCode: status.OK,
    //     message: "Phase 3 completed. You can start a new Phase 1 manually.",
    //   });
    // }
  }
  // Generate plan for next phase
  const savedPlan = await workoutPlanService.phase1Plan(
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

const Phase2Plan = catchAsync(async (req, res) => {
  const user = req.user;

  if (!user) throw new ApiError(status.UNAUTHORIZED, "User not found");


  const generatedMission = await prisma.mission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
    where: { userId: user.id },
    orderBy: { phase: "desc" },
  });

  if (!lastPhaseRecord || lastPhaseRecord?.phase !== 1) {
    throw new ApiError(status.BAD_REQUEST, "You have to complete phase 1 first.");
  }
  // default first phase
  if (lastPhaseRecord) {
    // 🔎 Find the last scheduled workout of this phase
    const lastWorkoutOfPhase = await prisma.workoutPlanDay.findFirst({
      where: { userId: user.id, phase: lastPhaseRecord.phase },
      orderBy: { scheduledDate: "desc" },
    });

    if (!lastWorkoutOfPhase) {
      throw new ApiError(
        status.BAD_REQUEST,
        `No workouts found in Phase ${lastPhaseRecord.phase}.`
      );
    }

    // 🔎 Check if today is BEFORE last scheduled date
    const today = new Date();
    if (today < lastWorkoutOfPhase.scheduledDate) {
      throw new ApiError(
        status.BAD_REQUEST,
        `You must finish Phase ${lastPhaseRecord.phase} (last workout on ${lastWorkoutOfPhase.scheduledDate.toDateString()}) before moving to the next phase.`
      );
    }
  }

  if (!generatedMission) {
    throw new ApiError(status.NOT_FOUND, "No generated mission found, please create one first.");
  }
  const nextPhase = 2;
  const lastPhase = await workoutPlanService.Phase2Plan(nextPhase, {
    mission: generatedMission.mission,
    time_commitment: generatedMission.timeCommitment,
    gear: generatedMission.gearCheck,
    squad: generatedMission.squad,
  }, user.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Last phase plan fetched successfully",
    data: lastPhase,
  });
});

const Phase3Plan = catchAsync(async (req, res) => {
  const user = req.user;

  if (!user) throw new ApiError(status.UNAUTHORIZED, "User not found");


  const generatedMission = await prisma.mission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
    where: { userId: user.id },
    orderBy: { phase: "desc" },
  });

  if (!lastPhaseRecord || lastPhaseRecord.phase !== 2) {
    throw new ApiError(status.BAD_REQUEST, "You have to complete phase 1 and phase 2 first.");
  }
  console.log(lastPhaseRecord.scheduledDate);
  // default first phase
  if (lastPhaseRecord) {
    // 🔎 Find the last scheduled workout of this phase
    const lastWorkoutOfPhase = await prisma.workoutPlanDay.findFirst({
      where: { userId: user.id, phase: lastPhaseRecord.phase },
      orderBy: { scheduledDate: "desc" },
    });

    if (!lastWorkoutOfPhase) {
      throw new ApiError(
        status.BAD_REQUEST,
        `No workouts found in Phase ${lastPhaseRecord.phase}.`
      );
    }

    // 🔎 Check if today is BEFORE last scheduled date
    const today = new Date();
    if (today < lastWorkoutOfPhase.scheduledDate) {
      throw new ApiError(
        status.BAD_REQUEST,
        `You must finish Phase ${lastPhaseRecord.phase} (last workout on ${lastWorkoutOfPhase.scheduledDate.toDateString()}) before moving to the next phase.`
      );
    }
  }

  if (!generatedMission) {
    throw new ApiError(status.NOT_FOUND, "No generated mission found, please create one first.");
  }
  const nextPhase = 3;
  const lastPhase = await workoutPlanService.Phase3Plan(nextPhase, {
    mission: generatedMission.mission,
    time_commitment: generatedMission.timeCommitment,
    gear: generatedMission.gearCheck,
    squad: generatedMission.squad,
  }, user.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Last phase plan fetched successfully",
    data: lastPhase,
  });
});

// const fetchAIPlanController = catchAsync(async (req, res) => {
//   const user = req.user;
//   const { mission, time_commitment, gear, squad } = req.body;

//   if (!user) throw new ApiError(status.UNAUTHORIZED, "User not found");

//   // Determine which phase to generate
//   // 1. Find the last phase the user has
//   const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
//     where: { userId: user.id },
//     orderBy: { phase: "desc" },
//   });

//   // default first phase
//   let nextPhase = 1;
//   if (lastPhaseRecord) {
//     // 🔎 Find the last scheduled workout of this phase
//     const lastWorkoutOfPhase = await prisma.workoutPlanDay.findFirst({
//       where: { userId: user.id, phase: lastPhaseRecord.phase },
//       orderBy: { scheduledDate: "desc" },
//     });

//     if (!lastWorkoutOfPhase) {
//       throw new ApiError(
//         status.BAD_REQUEST,
//         `No workouts found in Phase ${lastPhaseRecord.phase}.`
//       );
//     }

//     // 🔎 Check if today is BEFORE last scheduled date
//     const today = new Date();
//     if (today < lastWorkoutOfPhase.scheduledDate) {
//       throw new ApiError(
//         status.BAD_REQUEST,
//         `You must finish Phase ${lastPhaseRecord.phase} (last workout on ${lastWorkoutOfPhase.scheduledDate.toDateString()}) before moving to the next phase.`
//       );
//     }

//     // ✅ Safe to move to next phase
//     if (lastPhaseRecord.phase < 3) {
//       nextPhase = lastPhaseRecord.phase + 1;
//     } else {
//       return sendResponse(res, {
//         statusCode: status.OK,
//         message: "Phase 3 completed. You can start a new Phase 1 manually.",
//       });
//     }
//   }


//   // Generate plan for next phase
//   const savedPlan = await workoutPlanService.fetchAndSaveAIWorkoutPlan(
//     nextPhase,
//     { mission, time_commitment, gear, squad },
//     user.id
//   );

//   sendResponse(res, {
//     statusCode: status.CREATED,
//     message: `Phase ${nextPhase} AI workout plan fetched and saved successfully`,
//     data: savedPlan,
//   });
// });

// const Phase3Plan = catchAsync(async (req, res) => {
//   const user = req.user;

//   if (!user) throw new ApiError(status.UNAUTHORIZED, "User not found");

//   const generatedMission = await prisma.mission.findFirst({
//     where: { userId: user.id },
//     orderBy: { createdAt: "desc" },
//   });

//   const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
//     where: { userId: user.id },
//     orderBy: { phase: "desc" },
//   });

//   // default first phase
//   if (lastPhaseRecord) {
//     // 🔎 Find the last scheduled workout of this phase
//     const lastWorkoutOfPhase = await prisma.workoutPlanDay.findFirst({
//       where: { userId: user.id, phase: lastPhaseRecord.phase },
//       orderBy: { scheduledDate: "desc" },
//     });

//     if (!lastWorkoutOfPhase) {
//       throw new ApiError(
//         status.BAD_REQUEST,
//         `No workouts found in Phase ${lastPhaseRecord.phase}.`
//       );
//     }

//     // 🔎 Check if today is BEFORE last scheduled date
//     const today = new Date();
//     if (today < lastWorkoutOfPhase.scheduledDate) {
//       throw new ApiError(
//         status.BAD_REQUEST,
//         `You must finish Phase ${lastPhaseRecord.phase} (last workout on ${lastWorkoutOfPhase.scheduledDate.toDateString()}) before moving to the next phase.`
//       );
//     }
//   }

//   if (!generatedMission) {
//     throw new ApiError(status.NOT_FOUND, "No generated mission found, please create one first.");
//   }
//   const nextPhase = 3;
//   const lastPhase = await workoutPlanService.Phase3Plan(nextPhase, {
//     mission: generatedMission.mission,
//     time_commitment: generatedMission.timeCommitment,
//     gear: generatedMission.gearCheck,
//     squad: generatedMission.squad,
//   }, user.id);

//   sendResponse(res, {
//     statusCode: status.OK,
//     message: "Last phase plan fetched successfully",
//     data: lastPhase,
//   });
// });

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
  const lastPhaseRecord = await prisma.workoutPlanDay.findFirst({
    where: { userId: user.id },
    orderBy: { phase: "desc" },
  });

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
  getTodayWorkoutController,
  phase1Plan,
  Phase2Plan,
  Phase3Plan
};

