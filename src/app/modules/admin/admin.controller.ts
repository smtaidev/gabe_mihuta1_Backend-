import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";
import { log } from "console";
import ApiError from "../../errors/ApiError";
import { AdminService } from "./admin.service";

const createGroup = catchAsync(async (req, res) => {
    const createdBy = req.user.id;
    const { name } = req.body;

    if (!name) {
        throw new ApiError(status.BAD_REQUEST, "Group name is required");
    }

    const group = await AdminService.createGroup(name, createdBy);
    sendResponse(res, {
        statusCode: status.CREATED,
        message: "Group created successfully",
        data: group,
    });
});

const getAllUser = catchAsync(async (req, res) => {
    const users = await AdminService.getAllUser();
    sendResponse(res, {
        statusCode: status.OK,
        message: "Users retrieved successfully",
        data: users,
    });
});


const getSubscribersPerMonth = catchAsync(async (req, res) => {
    const result = await AdminService.getSubscribersPerMonth();

    sendResponse(res, {
        statusCode: status.OK,
        message: "Subscribers per month fetched successfully",
        data: result,
    });
});

const updateAdmin = catchAsync(async (req, res) => {
    const userId = req.user.id;

    if (req.file) {
        req.body.profilePic = `${config.imageUrl}/uploads/${req.file.filename}`;
    }
    const updatedAdmin = await AdminService.updateAdmin(userId, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        message: "Admin updated successfully",
        data: updatedAdmin,
    });
});

const getSingleUser = catchAsync(async (req, res) => {
    const userId = req.params.userId;
    const user = await AdminService.getSingleUser(userId);

    sendResponse(res, {
        statusCode: status.OK,
        message: "User retrieved successfully",
        data: user,
    });
});

const suspendUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await AdminService.suspendUser(id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'User account suspended successfully',
    data: result,
  });
});

const getAllGroups = catchAsync(async (req, res) => {
    const groups = await AdminService.getAllGroups();
    sendResponse(res, {
        statusCode: status.OK,
        message: 'Groups retrieved successfully',
        data: groups,
    });
});

const getTotal = catchAsync(async (req, res) => {
    const total = await AdminService.getTotal();
    sendResponse(res, {
        statusCode: status.OK,
        message: 'Total subscribers retrieved successfully',
        data: total,
    });
});

export const AdminController = {
    createGroup,
    getAllUser,
    getSubscribersPerMonth,
    updateAdmin,
    getSingleUser,
    suspendUser,
    getAllGroups,
    getTotal,
};