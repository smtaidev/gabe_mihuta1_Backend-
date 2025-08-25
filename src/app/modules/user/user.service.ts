import status from "http-status";
import { User, UserRole } from "@prisma/client";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import { sendEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";
import config from "../../config";
import { createToken } from "../auth/auth.utils";
import hashPassword from "../../helpers/hashPassword";
import { passwordCompare } from "../../utils/comparePasswords";
import { sendOTPEmail } from "../../utils/sendOtp";
import { generateOTP } from "../../utils/generateOTP";
import { CLIENT_RENEG_LIMIT } from "tls";

const otpStore: { [key: string]: { otp: string; timestamp: number } } = {};

// Helper to generate 6-digit OTP


const createUserIntoDB = async (payload: any) => {
  const { fullName, email, password, confirmPassword } = payload;

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

  if (password !== confirmPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Password and confirm password do not match!"
    );
  }
  // 2️⃣ Hash password
  const hashedPassword = await hashPassword(password);
  
  // 3️⃣ Create new user
  const userData = {
    fullName: fullName,
    email,
    password: hashedPassword,
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
  return {
    message:
      "We have sent a confirmation email to your email address. Please check your inbox.",
  };
}

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

  if(!payload.fullName){
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
      profilePic: payload.profilePic || "",
      gender: payload.gender || isUserExist.gender,
      age: payload.age || isUserExist.age,
      height: payload.height || isUserExist.height,
      weight: payload.weight || isUserExist.weight,
      level: payload.level || isUserExist.level,
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

export const UserService = {
  createUserIntoDB,
  getAllUserFromDB,
  getSingleUserByIdFromDB,
  updateUser,
  verifyOTP,
  deleteUser,
  resendOtp,
};

