import status from "http-status";
import config from "../../config";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";
import ApiError from "../../errors/ApiError";

const createUser = catchAsync(async (req, res) => {
  const result = await UserService.createUserIntoDB(req.body);

  if (!result) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, "User creation failed.");
  }

  sendResponse(res, {
    statusCode: status.CREATED,
    message: result.message, // Always return a data field to standardize
  });
});



export const updateRole = catchAsync(async (req, res) => {
  const result = await UserService.updateRoleIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserService.getAllUserFromDB(req.query);

  //console.log("All users data:", result.data);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Users are retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});




const updateUser = catchAsync(async (req, res) => {
  const userId = req.user.id;

  if (req.file) {
    req.body.profilePic = `${config.imageUrl}/uploads/${req.file.filename}`;
  }
  
  console.log(userId);

  const result = await UserService.updateUserIntoDB(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});

const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getSingleUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User retrieved successfully!",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  await UserService.deleteUserFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
  });
});

export const suspendUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await UserService.suspendUserAccount(id);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User account suspended successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUser,
  updateUser,
  deleteUser,
  getSingleUserById,
  updateRole,
  suspendUser,
};
