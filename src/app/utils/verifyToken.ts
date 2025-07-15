import jwt, { JwtPayload } from "jsonwebtoken";
import ApiError from "../errors/ApiError";
import status from "http-status";
import config from "../config";

export const verifyToken = (
  token: string,
  secret = config.jwt.access.secret as string
): JwtPayload => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(status.UNAUTHORIZED, "JWT token is expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(status.UNAUTHORIZED, "Invalid JWT token");
    } else {
      throw new ApiError(status.UNAUTHORIZED, "Failed to verify token");
    }
  }
};
