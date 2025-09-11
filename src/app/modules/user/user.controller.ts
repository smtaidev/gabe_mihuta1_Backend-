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

const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await UserService.verifyOTP(email, otp);

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

const getSingleUserById = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getSingleUserByIdFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User retrieved successfully!",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req.user.id;

  console.log(userId);

  if (!userId) {
    throw new ApiError(status.BAD_REQUEST, "User ID is required");
  }

  if (req.file) {
    req.body.profilePic = `${config.imageUrl}/uploads/${req.file.filename}`;
  }

  const result = await UserService.updateUser(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User updated successfully!",
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await UserService.resendOtp(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.user.id;

  //console.log("Deleting user with ID:", userId);

  if (!userId) {
    throw new ApiError(status.BAD_REQUEST, "User ID is required");
  }

  const result = await UserService.deleteUser(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User deleted successfully!",
    data: result,
  });
});

// rs
const logWorkout = catchAsync(async (req, res) => {
  const { exerciseType, duration } = req.body;
  const { userId } = req.params;

  const result = await UserService.logWorkoutService(
    userId,
    exerciseType,
    duration
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Workout logged successfully!",
    data: result,
  });
});

export const getUserProgress = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const result = await UserService.getUserProgressService(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "User progress retrieved successfully!",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUser,
  getSingleUserById,
  updateUser,
  verifyOTP,
  deleteUser,
  resendOtp,
  // rs
  logWorkout,
  getUserProgress,
};
