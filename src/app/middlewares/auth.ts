import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import catchAsync from "../utils/catchAsync";
import { UserRole } from "@prisma/client";
import ApiError from "../errors/ApiError";
import status from "http-status";
import prisma from "../utils/prisma";

const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req, _res, next) => {
    let token = req.headers.authorization;
    

    if (token && token.startsWith("Bearer")) {
      token = req.headers.authorization?.split(" ")[1].trim();
    }

    // If the token send from the client
    if (!token) {
      throw new ApiError(status.UNAUTHORIZED, "You are not authorized");
    }

    // Check if the token is valid
    const verifiedUser = jwt.verify(
      token,
      config.jwt.access.secret as string
    ) as JwtPayload;


    const user = await prisma.user.findUnique({
      where: {
        email: verifiedUser.email,
      },
    });

    // Checking if the user is exist
    if (!user) {
      throw new ApiError(status.NOT_FOUND, "User not found!");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new ApiError(
        status.FORBIDDEN,
        "You don't have permission to access this resource"
      );
    }

    req.user = verifiedUser;

    next();
  });
};

export default auth;
