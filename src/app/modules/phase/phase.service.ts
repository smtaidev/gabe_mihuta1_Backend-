import axios from "axios";
import prisma from "../../utils/prisma";

import { Prisma } from "@prisma/client";

// AI API response shape
interface AIWorkoutDay {
  day: number;
  name: string | null;
  sets: number | null;
  reps: string | null;
  description: string | null;
  rest: string | null;
  motivational_quote: string;
  is_workout_day: boolean;
  video_url: string | null;
}

interface FetchAIWorkoutPlanRequest {
  mission: string;
  time_commitment: string;
  gear: string;
  squad: string;
}

const PHASE_APIS: Record<number, string> = {
  1: process.env.AI_API_PHASE_1!,
  2: process.env.AI_API_PHASE_2!,
  3: process.env.AI_API_PHASE_3!,
};

const phase1Plan = async (
  phase: number,
  requestBody: FetchAIWorkoutPlanRequest,
  userId: string
) => {
  const aiApiUrl = PHASE_APIS[phase];
  if (!aiApiUrl) return []; // No API, skip

  try {
    // 1️⃣ Fetch from AI API
    const { data } = await axios.post<{ workout_plan: AIWorkoutDay[] }>(
      aiApiUrl,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!data?.workout_plan) throw new Error("Invalid AI response");

    await prisma.mission.create({
      data: {
        mission: requestBody.mission,
        timeCommitment: requestBody.time_commitment,
        gearCheck: requestBody.gear,
        squad: requestBody.squad,
        user: { connect: { id: userId } },
      },
    });
    // ✅ Find last scheduled day for this user
    const lastDay = await prisma.workoutPlanDay.findFirst({
      where: { userId },
      orderBy: { scheduledDate: "desc" },
    });

    // ✅ Start next phase 1 day after lastDay, or today if first phase
    let startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    if (lastDay) {
      startDate = new Date(lastDay.scheduledDate);
      startDate.setDate(startDate.getDate() + 1);
    }

    const savedDays = [];

    for (let i = 0; i < data.workout_plan.length; i++) {
      const day = data.workout_plan[i];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + i);

      const saved = await prisma.workoutPlanDay.create({
        data: {
          userId,
          day: day.day,
          name: day.name,
          sets: day.sets,
          reps: day.reps,
          description: day.description,
          rest: day.rest,
          motivationalQuote: day.motivational_quote, // map snake_case -> camelCase
          isWorkoutDay: day.is_workout_day,
          videoUrl: day.video_url,
          phase,
          scheduledDate,
          completed: false,
        },
      });

      savedDays.push(saved);
    }

    // 4️⃣ Return saved DB records
    return savedDays;
  } catch (err: any) {
    console.error("AI API error:", err.response?.data || err.message);
    return []; // return empty array if API fails
  }
};

const Phase2Plan = async (phase: number,
  requestBody: FetchAIWorkoutPlanRequest,
  userId: string) => {

  const latestSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      paymentStatus: "COMPLETED",
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }, // still active
      ],
    },
    orderBy: { startDate: "desc" },
  });

  if (!latestSubscription) {
    return { success: false, message: "No active subscription found" };
  }

  // 2️⃣ Calculate new end date: 60 days from today

  const subscription = await prisma.subscription.findFirst({
    where: { userId, paymentStatus: "COMPLETED" },
    orderBy: { startDate: "desc" },
  });

  if (!subscription) {
    throw new Error("No active subscription");
  }
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 60);

  //3️⃣ Update subscription endDate
  await prisma.subscription.update({
    where: { id: latestSubscription.id },
    data: { endDate: newEndDate },
  });

  const aiApiUrl = PHASE_APIS[phase];
  if (!aiApiUrl) return []; // No API, skip

  try {
    // 1️⃣ Fetch from AI API
    const { data } = await axios.post<{ workout_plan: AIWorkoutDay[] }>(
      aiApiUrl,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!data?.workout_plan) throw new Error("Invalid AI response");

    // ✅ Find last scheduled day for this user

    // ✅ Start next phase 1 day after lastDay, or today if first phase
    let startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const savedDays = [];

    for (let i = 0; i < data.workout_plan.length; i++) {
      const day = data.workout_plan[i];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + i);

      const saved = await prisma.workoutPlanDay.create({
        data: {
          userId,
          day: day.day,
          name: day.name,
          sets: day.sets,
          reps: day.reps,
          description: day.description,
          rest: day.rest,
          motivationalQuote: day.motivational_quote, // map snake_case -> camelCase
          isWorkoutDay: day.is_workout_day,
          videoUrl: day.video_url,
          phase,
          scheduledDate,
          completed: false,
        },
      });

      savedDays.push(saved);
    }
    // 4️⃣ Return saved DB records
    return savedDays;
  } catch (err: any) {
    console.error("AI API error:", err.response?.data || err.message);
    return []; // return empty array if API fails
  }
};

// const autoProgressPhases = async (
//   userId: string,
//   requestBody: FetchAIWorkoutPlanRequest
// ) => {
//   // 1️⃣ Mark past days as completed automatically (optional: only if you want missed days to be auto-completed)
//   await prisma.workoutPlanDay.updateMany({
//     where: { userId, scheduledDate: { lte: new Date() }, completed: false },
//     data: { completed: true },
//   });

//   // 2️⃣ Find the latest phase the user has in DB
//   const latestPhase = await prisma.workoutPlanDay.aggregate({
//     where: { userId },
//     _max: { phase: true },
//   });

//   let currentPhase = latestPhase._max.phase ?? 0;
//   if (currentPhase >= 3) return; // No more phases

//   // 3️⃣ Check the last scheduled day of the current phase
//   const lastDayOfPhase = await prisma.workoutPlanDay.findFirst({
//     where: { userId, phase: currentPhase },
//     orderBy: { scheduledDate: "desc" },
//   });

//   //console.log("Last day of current phase:", lastDayOfPhase?.scheduledDate);

//   if (!lastDayOfPhase) return;

//   // 4️⃣ Unlock next phase if enough time has passed
//   const today = new Date();

//   if (today >= new Date(lastDayOfPhase.scheduledDate)) {
//     const nextPhase = currentPhase + 1;

//     // Generate only if it doesn't exist yet
//     const existingNext = await prisma.workoutPlanDay.findMany({
//       where: { userId, phase: nextPhase },
//     });

//     if (!existingNext.length) {
//       await phase1Plan(nextPhase, requestBody, userId);
//     }
//   }
// };

// const autoProgressPhases = async (
//   userId: string,
//   requestBody: FetchAIWorkoutPlanRequest
// ) => {
//   // 1️⃣ Mark past days as completed automatically (optional: only if you want missed days to be auto-completed)
//   await prisma.workoutPlanDay.updateMany({
//     where: { userId, completed: false, scheduledDate: { lte: new Date() } },
//     data: { completed: true },
//   });

//   // 2️⃣ Get latest subscription with plan
//   const subscription = await prisma.subscription.findFirst({
//     where: { userId,endDate: { gte: new Date() }, },
//     include: { plan: true },
//     orderBy: {
//       createdAt: "desc", // safest to ensure latest
//     },
//   });

//   if (!subscription) throw new Error("No active subscription");

//   const maxPhase = subscription.plan.allowedPhases;
//   if (maxPhase == null) {
//     throw new Error("Allowed phases not defined in subscription plan");
//   }

//   console.log("Max allowed phase:", maxPhase);

//   // 3️⃣ Find the latest unlocked phase in DB
//   const latestPhase = await prisma.workoutPlanDay.aggregate({
//     where: { userId },
//     _max: { phase: true },
//   });

//   let currentPhase = latestPhase._max.phase ?? 1;
//   if (currentPhase >= maxPhase) return; // reached max allowed phase

//   // 4️⃣ Check last scheduled day of current phase
//   const lastDayOfPhase = await prisma.workoutPlanDay.findFirst({
//     where: { userId, phase: currentPhase },
//     orderBy: { scheduledDate: "desc" },
//   });

//   if (!lastDayOfPhase) return;

//   const today = new Date();

//   // 5️⃣ Unlock next phase only if current phase fully finished
//   if (today >= new Date(lastDayOfPhase.scheduledDate)) {
//     const nextPhase = currentPhase + 1;

//     const existingNext = await prisma.workoutPlanDay.findMany({
//       where: { userId, phase: nextPhase },
//     });

//     if (!existingNext.length && nextPhase <= maxPhase) {
//       await fetchAndSaveAIWorkoutPlan(nextPhase, requestBody, userId);
//     }
//   }
// };
// const autoProgressPhases = async (userId: string, requestBody: FetchAIWorkoutPlanRequest) => {
//   // 1️⃣ Mark past or today's days as completed
//   await prisma.workoutPlanDay.updateMany({
//     where: { userId, completed: false, scheduledDate: { lte: new Date() } },
//     data: { completed: true },
//   });

//   const subscription = await prisma.subscription.findFirst({
//     where: { userId },
//     include: { plan: true },
//     orderBy: {
//       createdAt: "desc", // or startDate, endDate depending on your schema
//     },
//   });

//   if (!subscription) throw new Error("No active subscription");

//   const maxPhase = subscription.plan.allowedPhases;

//   console.log("Max allowed phase:", maxPhase);

//   if (maxPhase == null) {
//     throw new Error("Allowed phases not defined in subscription plan");
//   }

//   // 3️⃣ Loop through phases
//   for (let phase = 1; phase < maxPhase; phase++) {
//     const remaining = await prisma.workoutPlanDay.findMany({
//       where: { userId, phase, completed: false },
//     });

//     // 4️⃣ If finished and user is allowed next phase → unlock it
//     if (remaining.length === 0 && phase < maxPhase) {
//       const nextPhaseExists = await prisma.workoutPlanDay.findFirst({
//         where: { userId, phase: phase + 1 },
//       });

//       if (!nextPhaseExists) {
//         await fetchAndSaveAIWorkoutPlan(phase + 1, requestBody, userId);
//       }
//     }
//   }
// };
const Phase3Plan = async (phase: number,
  requestBody: FetchAIWorkoutPlanRequest,
  userId: string) => {

    console.log(phase);

  const latestSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      paymentStatus: "COMPLETED",
      startDate: { lte: new Date() },
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } }, // still active
      ],
    },
    orderBy: { startDate: "desc" },
  });

  if (!latestSubscription) {
    return { success: false, message: "No active subscription found" };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId, paymentStatus: "COMPLETED" },
    orderBy: { startDate: "desc" },
  });

  if (!subscription) {
    throw new Error("No active subscription");
  }

  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 30);

  //3️⃣ Update subscription endDate
  await prisma.subscription.update({
    where: { id: latestSubscription.id },
    data: { endDate: newEndDate },
  });

  // 2️⃣ Calculate new end date: 60 days from today

  const aiApiUrl = PHASE_APIS[phase];
  console.log(aiApiUrl)
  if (!aiApiUrl) return []; // No API, skip

  try {
    // 1️⃣ Fetch from AI API
    const { data } = await axios.post<{ workout_plan: AIWorkoutDay[] }>(
      aiApiUrl,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!data?.workout_plan) throw new Error("Invalid AI response");

    // ✅ Find last scheduled day for this user

    // ✅ Start next phase 1 day after lastDay, or today if first phase
    let startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const savedDays = [];

    for (let i = 0; i < data.workout_plan.length; i++) {
      const day = data.workout_plan[i];
      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(startDate.getDate() + i);

      const saved = await prisma.workoutPlanDay.create({
        data: {
          userId,
          day: day.day,
          name: day.name,
          sets: day.sets,
          reps: day.reps,
          description: day.description,
          rest: day.rest,
          motivationalQuote: day.motivational_quote, // map snake_case -> camelCase
          isWorkoutDay: day.is_workout_day,
          videoUrl: day.video_url,
          phase,
          scheduledDate,
          completed: false,
        },
      });

      savedDays.push(saved);
    }
    // 4️⃣ Return saved DB records
    return savedDays;
  } catch (err: any) {
    console.error("AI API error:", err.response?.data || err.message);
    return []; // return empty array if API fails
  }
};

const getTodayWorkoutPlan = async (userId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // start of today

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // end of today

  const todayWorkout = await prisma.workoutPlanDay.findMany({
    where: {
      userId,
      scheduledDate: {
        gte: todayStart,
        lte: todayEnd, // include all times today
      },
    },
    orderBy: { day: "asc" }, // optional: order by day number
  });

  return todayWorkout;
};

export const workoutPlanService = {
  phase1Plan,
  getTodayWorkoutPlan,
  Phase2Plan,
  Phase3Plan,
};
