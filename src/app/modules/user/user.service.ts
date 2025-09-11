import status from "http-status";
import { User } from "@prisma/client";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import QueryBuilder from "../../builder/QueryBuilder";
import hashPassword from "../../helpers/hashPassword";
import { sendOTPEmail } from "../../utils/sendOtp";
import { generateOTP } from "../../utils/generateOTP";
import { adminSockets } from "../../helpers/chat";
import { calculateCalories } from "../../utils/calorieCalculator";
import { ExerciseType, exerciseTypes } from "../../interface/exerciseTypes";

const otpStore: { [key: string]: { otp: string; timestamp: number } } = {};

const createUserIntoDB = async (payload: any) => {
  const { fullName, email, password } = payload;

  // 1️⃣ Check if email already exists
  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${email} already exists!`
    );
  }

  // 2️⃣ Hash password
  const hashedPassword = await hashPassword(password);

  // 3️⃣ Create new user
  const userData = {
    fullName: fullName,
    email,
    password: hashedPassword,
    subscribed: "FREE_USER",
  };

  await prisma.user.create({ data: userData });

  // 4️⃣ Generate OTP
  const otp = generateOTP();

  // 5️⃣ Store OTP in memory (expires in 5 min)
  otpStore[email] = {
    otp,
    timestamp: Date.now(),
  };

  // 6️⃣ Send OTP email (fail-safe)
  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "User created but failed to send OTP email. Please try again."
    );
  }

  // 7️⃣ Return success message

  // 7️⃣ Notify all connected admins via WebSocket
  const notification = {
    event: "newUserRegistered",
    payload: {
      fullName: userData.fullName,
      email: userData.email,
    },
  };

  for (const adminSocket of adminSockets) {
    if (adminSocket.readyState === adminSocket.OPEN) {
      adminSocket.send(JSON.stringify(notification));
    }
  }
  return {
    message:
      "We have sent a confirmation email to your email address. Please check your inbox.",
  };
};

export const verifyOTP = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new ApiError(status.BAD_REQUEST, "Email and OTP are required.");
  }

  const storedData = otpStore[email];

  if (!storedData) {
    throw new ApiError(status.BAD_REQUEST, "No OTP found for this email.");
  }

  // Check if OTP is expired (5 minutes validity)
  if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
    delete otpStore[email];
    throw new ApiError(status.BAD_REQUEST, "OTP has expired.");
  }

  if (storedData.otp !== otp) {
    throw new ApiError(status.BAD_REQUEST, "Invalid OTP.");
  }

  // Clear the OTP after successful verification
  delete otpStore[email];

  await prisma.user.update({
    where: { email: email },
    data: { isVerified: true },
  });

  return { message: "OTP verified successfully" };
};

const getAllUserFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(prisma.user, query)
    .search(["fullName", "email"])
    .select(["createdAt", "fullName", "email", "role", "status"])
    .paginate();

  const [result, meta] = await Promise.all([
    userQuery.execute(),
    userQuery.countTotal(),
  ]);

  if (!result.length) {
    throw new ApiError(status.NOT_FOUND, "No users found!");
  }

  // Remove password from each user
  const data = result.map((user: User) => {
    const { password, ...rest } = user;
    return rest;
  });

  // console.log("User data:", data);

  return {
    meta,
    data,
  };
};

type UpdateUserPayload = Partial<User> & {
  newPassword?: string;
  confirmPassword?: string;
};

const getSingleUserByIdFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const { password, ...rest } = user;

  return rest;
};

const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!payload.fullName) {
    payload.fullName = isUserExist.fullName;
  }
  if (!payload.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }
  if (!payload.gender) {
    payload.gender = isUserExist.gender;
  }
  if (!payload.age) {
    payload.age = isUserExist.age;
  }
  if (!payload.height) {
    payload.height = isUserExist.height;
  }
  if (!payload.weight) {
    payload.weight = isUserExist.weight;
  }
  if (!payload.level) {
    payload.level = isUserExist.level;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: payload.fullName,
      profilePic: payload.profilePic,
      gender: payload.gender,
      age: payload.age,
      height: payload.height,
      weight: payload.weight,
      level: payload.level,
    },
    select: {
      id: true,
      fullName: true,
      profilePic: true,
      gender: true,
      age: true,
      height: true,
      weight: true,
      level: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  // Generate new OTP
  const otp = generateOTP();

  await prisma.user.update({
    where: { email },
    data: {
      isResentOtp: true,
      isResetPassword: true,
      canResetPassword: false,
    },
  });

  otpStore[email] = { otp, timestamp: Date.now() };

  await sendOTPEmail(email, otp);

  return {
    message: "New OTP has been sent to your email for reset password.",
  };
};

const deleteUser = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  console.log(existingUser);

  // Delete user
  const deletedUser = await prisma.user.delete({
    where: { id: userId },
  });

  return deletedUser;
};

//rs
const logWorkoutService = async (
  userId: string,
  exerciseType: string,
  duration: number
) => {
  // ✅ Validate exerciseType
  if (!exerciseTypes.includes(exerciseType as ExerciseType)) {
    throw new Error(
      `Invalid exerciseType. Must be one of: ${exerciseTypes.join(", ")}`
    );
  }

  // 1. Get user info
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // 2. Calculate calories burned
  const weight = user.weight ?? 0;
  const calories = calculateCalories(weight, exerciseType, duration);

  // 3. Check if progress exists
  let progress = await prisma.userProgress.findUnique({ where: { userId } });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId,
        totalWorkouts: 0,
        totalTrainingTime: 0,
        caloriesBurned: 0,
        xp: 0,
        streakCounter: 0,
        badges: [],
      },
    });
  }

  // 4. Update progress
  const updatedProgress = await prisma.userProgress.update({
    where: { userId },
    data: {
      totalWorkouts: progress.totalWorkouts + 1,
      totalTrainingTime: progress.totalTrainingTime + duration / 60,
      caloriesBurned: progress.caloriesBurned + calories,
      xp: progress.xp + Math.floor(calories / 10),
    },
  });

  return {
    caloriesBurned: calories,
    totalCalories: updatedProgress.caloriesBurned,
    xp: updatedProgress.xp,
  };
};

const getUserProgressService = async (userId: string) => {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!progress) throw new Error("Progress not found");
  return progress;
};

export const UserService = {
  createUserIntoDB,
  getAllUserFromDB,
  getSingleUserByIdFromDB,
  updateUser,
  verifyOTP,
  deleteUser,
  resendOtp,
  // rs
  logWorkoutService,
  getUserProgressService,
};
