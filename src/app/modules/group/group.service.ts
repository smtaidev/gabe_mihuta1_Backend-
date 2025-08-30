import { Group } from './../../../../node_modules/.prisma/client/index.d';
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

const joinGroup = async (userId: string, groupId: string) => {
    const existing = await prisma.groupMembership.findFirst({ where: { userId, groupId } });
    if (existing) {
        throw new ApiError(status.BAD_REQUEST, "User already a member of the group");
    }

    return prisma.groupMembership.create({
        data: { userId, groupId },
    });
}

const getAllGroups = async () => {
    return prisma.group.findMany({
    });
};

export const GroupService = {
    joinGroup,
    getAllGroups,
};