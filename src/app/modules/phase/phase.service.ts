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

const fetchAndSaveAIWorkoutPlan = async (
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

    // 2️⃣ Delete old workouts for this phase
    await prisma.workoutPlanDay.deleteMany({
      where: { userId, phase },
    });

    // 3️⃣ Save into DB
    const savedDays: Prisma.WorkoutPlanDayGetPayload<{}>[] = [];
    const startDate = new Date();

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

const autoProgressPhases = async (
  userId: string,
  requestBody: FetchAIWorkoutPlanRequest
) => {
  // 1️⃣ Mark past or today’s scheduled days as completed
  await prisma.workoutPlanDay.updateMany({
    where: { userId, completed: false, scheduledDate: { lte: new Date() } },
    data: { completed: true },
  });

  // 2️⃣ Find the highest completed phase
  const maxCompletedPhase = await prisma.workoutPlanDay.aggregate({
    where: { userId, completed: true },
    _max: { phase: true },
  });

  let nextPhase = (maxCompletedPhase._max.phase ?? 0) + 1;
  if (nextPhase > 3) return; // No more phases

  // 3️⃣ Generate next phase if needed
  const remaining = await prisma.workoutPlanDay.findMany({
    where: { userId, phase: nextPhase },
  });

  if (!remaining.length) {
    await fetchAndSaveAIWorkoutPlan(nextPhase, requestBody, userId);
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
  fetchAndSaveAIWorkoutPlan,
  autoProgressPhases,
  getTodayWorkoutPlan,
};
