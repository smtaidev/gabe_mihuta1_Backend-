import status from "http-status";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NextFunction, Request, Response, Router } from "express";
import {upload} from "../../utils/upload";


const router = Router();

router.get("/", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.getAllUser);

router.get("/:userId", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.getSingleUserById);
router.delete(
  "/delete-user",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER),
  UserController.deleteUser
);

router.post(
  "/register",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.post("/verify-otp", UserController.verifyOTP);

router.put("/update-user",
  upload.single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body?.data) {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch {
      next(new ApiError(status.BAD_REQUEST, "Invalid JSON in 'data' field"));
    }
  },
  auth(UserRole.USER), UserController.updateUser);



router.post(
  "/resend-otp",
  validateRequest(UserValidation.resendOtpValidationSchema),
  UserController.resendOtp
);

export const UserRoutes = router;
