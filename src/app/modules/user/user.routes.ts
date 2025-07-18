import status from "http-status";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { upload } from "../../utils/upload";
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

router.post(
  "/update-role",
  UserController.updateRole
);

router.patch("/suspend/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.suspendUser
);

router.patch(
  "/update",
  upload.single("file"),
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
  auth(UserRole.ADMIN, UserRole.ENGINEER, UserRole.USER),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

router.delete("/:userId", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), UserController.deleteUser);

export const UserRoutes = router;
