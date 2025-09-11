export const exerciseTypes = [
  "chestWorkout",
  "legWorkout",
  "cycling",
  "yoga",
  "meditation",
  "hiit",
  "walking",
  "jogging",
  "backWorkout",
  "shoulderWorkout",
] as const;

export type ExerciseType = (typeof exerciseTypes)[number];
