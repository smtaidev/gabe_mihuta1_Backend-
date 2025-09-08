import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import { passwordCompare } from "../../utils/comparePasswords";
import { verifyToken } from "../../utils/verifyToken";
import { sendEmail } from "../../utils/sendEmail";
import hashPassword from "../../helpers/hashPassword";
import { sendOTPEmail } from "../../utils/sendOtp";
import { generateOTP } from "../../utils/generateOTP";
import { User } from '@prisma/client';

const createGroup = async (name: string, createdBy: string) => {
  if (!name) {
    throw new ApiError(status.BAD_REQUEST, "Group name is required");
  }

  const group = await prisma.group.create({
    data: {
      name,
      createdBy
    }
  });

  return group;
}

const getAllUser = async () => {
  const users = await prisma.user.findMany({
    select: {
      profilePic: true,
      fullName: true,
      email: true,
      subscribed: true,
      createdAt: true,
    }
  });
  return users;
}

interface SubscriberAggregate {
  _id: number;   // month number (1-12)
  total: number; // count
}

const getSubscribersPerMonth = async () => {
  const result = await prisma.subscription.aggregateRaw({
    pipeline: [
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ],
  });

  const data = result as unknown as SubscriberAggregate[];

  // Format to chart-friendly data
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return data.map((item: any) => ({
    month: months[item._id - 1],
    subscribers: item.total,
  }));
};

const updateAdmin = async (userId: string, payload: any = {}) => {
  const isUserExist = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!isUserExist) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }
  // Handle profilePic fallback
  if (!payload.profilePic) {
    payload.profilePic = isUserExist.profilePic;
  }

  if (!payload.fullName) {
    payload.fullName = isUserExist.fullName;
  }

  if (!payload.email) {
    payload.email = isUserExist.email;
  }

  if (!payload.phone) {
    payload.phone = isUserExist.phone;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      profilePic: payload.profilePic || "",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePic: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const getSingleUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      profilePic: true,
      fullName: true,
      email: true,
      gender: true,
      age: true,
      height: true,
      weight: true,
      level: true,
      subscribed: true,
      createdAt: true,
    }
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  return user;
};

export const suspendUser = async (userId: string): Promise<User> => {
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

const getAllGroups = async () => {
  const groups = await prisma.group.findMany();

  if (groups.length === 0) {
    throw new ApiError(status.NOT_FOUND, "No groups found");
  }

  return groups;
}

export const AdminService = {
  createGroup,
  getAllUser,
  getAllGroups,
  getSubscribersPerMonth,
  updateAdmin,
  getSingleUser,
  suspendUser,
};