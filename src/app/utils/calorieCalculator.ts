import exerciseMETs from "../config/exerciseMETs";

export const calculateCalories = (
  weightKg: number,
  exerciseType: string,
  durationMin: number
): number => {
  const MET = exerciseMETs[exerciseType] || exerciseMETs.default;
  return (MET * weightKg * durationMin) / 60;
};
