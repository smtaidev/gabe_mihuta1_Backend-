import { NextFunction, Request, Response, Router } from "express";
import { ServiceController } from "./service.controller";
import auth from "../../middlewares/auth";;
import ApiError from "../../errors/ApiError";
import { UserRole } from "@prisma/client";
import { upload } from "../../utils/upload";
import status from "http-status";

const router = Router();

router.post(
  "/create-service",
  upload.single("file"), 
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), 
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
  ServiceController.createNewService
);

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  ServiceController.getAllServices
);

export const ServiceRoutes = router;