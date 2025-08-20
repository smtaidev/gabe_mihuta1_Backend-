import status from "http-status";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NextFunction, Request, Response, Router } from "express";


const router = Router();

router.get("/", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.getAllUser);

router.get("/:userId", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.getSingleUserById);




router.post(
  "/register",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser
);

router.post("/verify-otp", UserController.verifyOTP);

router.put("/update-user", auth(UserRole.USER), UserController.updateUser);

router.delete(
  "/delete-user/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER),
  UserController.deleteUser
);




export const UserRoutes = router;
