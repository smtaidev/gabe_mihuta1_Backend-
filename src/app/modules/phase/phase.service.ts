import axios from "axios";
import prisma from "../../utils/prisma";

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

// Map phases to AI API URLs
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

  try {
    const { data } = await axios.post<{ workout_plan: AIWorkoutDay[] }>(
      aiApiUrl,
      requestBody,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!data?.workout_plan) throw new Error("Invalid AI response");

    if (phase === 1) {
      await prisma.mission.create({
        data: {
          mission: requestBody.mission,
          timeCommitment: requestBody.time_commitment,
          gearCheck: requestBody.gear,
          squad: requestBody.squad,
          user: { connect: { id: userId } },
        },
      });
    }

    // Delete old phase if exists
    //await prisma.workoutPlanDay.deleteMany({ where: { userId, phase: phase-1 } });

    // ✅ Find last scheduled day for this user
    const lastDay = await prisma.workoutPlanDay.findFirst({
      where: { userId },
      orderBy: { scheduledDate: "desc" },
    });

    // ✅ Start next phase 1 day after lastDay, or today if first phase
    let startDate = new Date();
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
          motivationalQuote: day.motivational_quote,
          isWorkoutDay: day.is_workout_day,
          videoUrl: day.video_url,
          phase,
          scheduledDate,
          completed: false,
        },
      });

      savedDays.push(saved);
    }

    return savedDays;
  } catch (err: any) {
    console.error(`AI API Phase ${phase} error:`, err.response?.data || err.message);
    throw new Error(`AI API Phase ${phase} request failed`);
  }
};


// Auto-complete past days and generate next phases
const autoProgressPhases = async (userId: string, requestBody: FetchAIWorkoutPlanRequest) => {
  // 1️⃣ Mark past or today's days as completed
  await prisma.workoutPlanDay.updateMany({
    where: { userId, completed: false, scheduledDate: { lte: new Date() } },
    data: { completed: true },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    include: { plan: true },
  });

  if (!subscription) throw new Error("No active subscription");

  const maxPhase = subscription.plan.allowedPhases;

  if (maxPhase == null) {
    throw new Error("Allowed phases not defined in subscription plan");
  }

  // 3️⃣ Loop through phases
  for (let phase = 1; phase <= maxPhase; phase++) {
    const remaining = await prisma.workoutPlanDay.findMany({
      where: { userId, phase, completed: false },
    });

    // 4️⃣ If finished and user is allowed next phase → unlock it
    if (remaining.length === 0 && phase < maxPhase) {
      const nextPhaseExists = await prisma.workoutPlanDay.findFirst({
        where: { userId, phase: phase + 1 },
      });

      if (!nextPhaseExists) {
        await fetchAndSaveAIWorkoutPlan(phase + 1, requestBody, userId);
      }
    }
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
