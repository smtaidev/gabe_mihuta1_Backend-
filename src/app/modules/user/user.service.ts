import status from "http-status";
import { User, UserRole } from "@prisma/client";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import { sendEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";
import config from "../../config";
import { createToken } from "../auth/auth.utils";
import hashPassword from "../../helpers/hashPassword";

async function createUserIntoDB(payload: User) {
  console.log("Creating user with payload:", payload);
  const isUserExistByEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExistByEmail) {
    throw new ApiError(
      status.BAD_REQUEST,
      `User with this email: ${payload.email} already exists!`
    );
  }


  //hello world
  const hashedPassword = await hashPassword(payload.password);

  const userData = {
    ...payload,
    fullName: `${payload.firstName} ${payload.lastName}`,
    password: hashedPassword,
    isVerified: false,
  };

  const jwtPayload = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    fullName: `${payload.firstName} ${payload.lastName}`,
    email: payload.email,
    role: UserRole.USER,
    profilePic: payload?.profilePic || "",
    isVerified: false,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.resetPassword.expiresIn as string
  );
  await prisma.user.create({ data: userData });


  const confirmedLink = `${config.verifyEmailLink}?token=${accessToken}`;
  await sendEmail(payload.email, undefined, confirmedLink);

  return {
    message: "We have sent a confirmation email to your email address. Please check your inbox.",
  };
}

const updateRoleIntoDB = async (userId: string, payload: Partial<User>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (payload.role === "ENGINEER" && !payload.teeRegistration) {
    throw new ApiError(status.BAD_REQUEST, "TEE registration is required for Engineers");
  }

  if (payload.role === "COMPANY" && !payload.vatNumber) {
    throw new ApiError(status.BAD_REQUEST, "VAT number is required for Companies");
  }


  await prisma.user.update({
    where: { id: userId },
    data: {
      role: payload.role,
      teeRegistration: payload.teeRegistration || "",
      vatNumber: payload.vatNumber || "",
    },
  });

  return null;
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

const updateUserIntoDB = async (userId: string, payload: Partial<User>) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!payload.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      profilePic: payload.profilePic || "",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
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

const deleteUserFromDB = async (userId: string) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  await prisma.subscription.deleteMany({
    where: { userId: userId },
  });

  await prisma.billingInfo.deleteMany({
    where: { userId: userId },
  });

  await prisma.service.deleteMany({
    where: { createdById: userId },
  });

  await prisma.user.delete({
    where: { id: userId },
  });

  return null;
};




export const suspendUserAccount = async (userId: string): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  if (existingUser.status === "INACTIVE") {
    throw new ApiError(status.BAD_REQUEST, "User account is already suspended");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: "INACTIVE" },
  });

  return updatedUser;
};


export const UserService = {
  createUserIntoDB,
  getAllUserFromDB,
  updateUserIntoDB,
  deleteUserFromDB,
  getSingleUserByIdFromDB,
  updateRoleIntoDB,
  suspendUserAccount
};
