const exerciseMETs: Record<string, number> = {
  chestWorkout: 6.0, // moderate weightlifting (upper body)
  legWorkout: 7.0, // squats, lunges, etc. (heavier load, larger muscles)
  cycling: 7.5, // general moderate cycling (12–14 mph)
  yoga: 2.5, // Hatha yoga average
  meditation: 1.3, // sitting quietly, breathing
  hiit: 9.5, // vigorous interval training
  walking: 3.3, // brisk walk (~3.5 mph)
  jogging: 7.0, // steady jog (~5 mph)
  backWorkout: 5.5, // rows, pull-ups (upper/mid-back strength training)
  shoulderWorkout: 5.0, // overhead press, lateral raises (moderate effort)
  default: 5.0, // fallback for unknown types
};

export default exerciseMETs;
