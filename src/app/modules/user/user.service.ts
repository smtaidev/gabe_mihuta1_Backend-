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
    fullaName: fullName,
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

const updateUser = async (payload: UpdateUserPayload) => {
  const updatedUser = await prisma.user.update({
    where: { email: payload.email },
    data: { 
      gender: payload.gender,
      age: payload.age,
      height: payload.height,
      weight: payload.weight,
      level: payload.level,
     },
  });
  return updatedUser;
};

const deleteUser = async (id: string) => {

  //console.log("Deleting user with ID:", id);
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  // Delete user
  const deletedUser = await prisma.user.delete({
    where: { id },
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
};

