import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthService } from "./auth.service";
import config from "../../config";
import { log } from "console";
import ApiError from "../../errors/ApiError";



const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.loginUser(email, password);

  const { accessToken, refreshToken } = result;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // config.NODE_ENV === "production"
    sameSite: "lax", // config.NODE_ENV === "production" ? true : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "User logged in successfully!",
    data: { accessToken },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const email = req.user?.email as string;

  const { currentPassword, newPassword, confirmPassword } = req.body;

  await AuthService.changePassword(
    email,
    currentPassword,
    newPassword,
    confirmPassword
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "User password changed successfully!",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const result = await AuthService.verifyOTP(email, otp);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  const result = await AuthService.resetPassword(
    email,
    newPassword,
    confirmPassword
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  const result = await AuthService.resendOtp(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

const getMe = catchAsync(async (req, res) => {
  const email = req.user?.email as string;

  const result = await AuthService.getMe(email);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'User fetched successfully!',
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Access token is retrieved successfully!",
    data: result,
  });
});

export const AuthController = {
  login,
  refreshToken,
  resetPassword,
  forgotPassword,
  changePassword,
  verifyOTP,
  resendOtp,
  getMe,
};
