import status from "http-status";
import config from "../../config";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import { RefreshPayload } from "./auth.interface";
import { createToken } from "./auth.utils";
import { passwordCompare } from "../../utils/comparePasswords";
import { verifyToken } from "../../utils/verifyToken";
import { sendEmail } from "../../utils/sendEmail";
import hashPassword from "../../helpers/hashPassword";
import { sendOTPEmail } from "../../utils/sendOtp";
import { generateOTP } from "../../utils/generateOTP";

const otpStore: { [key: string]: { otp: string; timestamp: number } } = {};
const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const isPasswordMatched = await passwordCompare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(status.UNAUTHORIZED, "Password is incorrect!");
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
    role: user.role,
  };
  const accessToken = createToken(
    jwtPayload,
    config.jwt.access.secret as string,
    config.jwt.access.expiresIn as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return {
    accessToken,
    refreshToken,
    user
  };
};


const changePassword = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  if (!newPassword) {
    throw new ApiError(status.BAD_REQUEST, "New password is required!");
  }

  if (!confirmPassword) {
    throw new ApiError(status.BAD_REQUEST, "Confirm password is required!");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      status.BAD_REQUEST,
      "New password and confirm password do not match!"
    );
  }

  const isPasswordMatch = await passwordCompare(currentPassword, user.password);

  if (!isPasswordMatch) {
    throw new ApiError(status.UNAUTHORIZED, "Current password is incorrect!");
  }

  const hashedNewPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedNewPassword,
      passwordChangedAt: new Date(),
    },
  });

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");

   if (!user.isVerified) {
    throw new ApiError(status.UNAUTHORIZED, "User account is not verified!");
  }

  await prisma.user.update({
    where: { email },
    data: { isResetPassword: true, canResetPassword: false },
  });

  const otp = generateOTP();
  otpStore[email] = { otp, timestamp: Date.now() };

  try {
    await sendOTPEmail(email, otp);
  } catch (error) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "OTP sending failed. Please try again."
    );
  }

  return { message: "OTP sent to your email." };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword)
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match!");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(status.NOT_FOUND, "User not found!");

  if (!user.canResetPassword)
    throw new ApiError(status.BAD_REQUEST, "OTP not verified or expired.");

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      isResetPassword: false,
      canResetPassword: false,
    },
  });

  return { message: "Password reset successfully!" };
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



const getMe = async (email: string) => {
  const result = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      profilePic: true,
      role: true,
      isVerified: true,
      subscribed: true,
    },
  });

  return result;
};

export const refreshToken = async (token: string) => {
  const decoded = verifyToken(
    token,
    config.jwt.refresh.secret as string
  ) as RefreshPayload;

  const { email, iat } = decoded;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  /* Reject if password changed after token was issued */
  if (
    user.passwordChangedAt &&
    /* convert both to seconds since epoch */
    Math.floor(user.passwordChangedAt.getTime() / 1000) > iat
  ) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Password was changed after this token was issued"
    );
  }

  const jwtPayload = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user?.profilePic,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt.refresh.secret as string,
    config.jwt.refresh.expiresIn as string
  );

  return { accessToken };
};

// service
// service
const logout = async () => {
  // Nothing to invalidate on server
  return { message: "User logged out successfully!" };
};




const verifyOTP = async (email: string, otp: string) => {
  if (!email || !otp)
    throw new ApiError(status.BAD_REQUEST, "Email and OTP are required.");

  const storedData = otpStore[email];
  if (!storedData) throw new ApiError(status.BAD_REQUEST, "No OTP found.");

  if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
    delete otpStore[email];
    throw new ApiError(status.BAD_REQUEST, "OTP expired.");
  }

  if (storedData.otp !== otp)
    throw new ApiError(status.BAD_REQUEST, "Invalid OTP.");

  delete otpStore[email];

  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      canResetPassword: true, // ✅ Allow password reset
    },
  });

  return { message: "OTP verified successfully. You may now reset your password." };
};

export const AuthService = {
  getMe,
  loginUser,
  refreshToken,
  resetPassword,
  changePassword,
  forgotPassword,
  verifyOTP,
  resendOtp,
  logout,
};
