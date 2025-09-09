import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import parseJsonData from "../../middlewares/parseJsonData";
import { upload } from "../../utils/upload";

const router = Router();

router.get("/getAllGroups", auth(), AdminController.getAllGroups);

router.post("/create-group", auth(UserRole.SUPER_ADMIN), AdminController.createGroup);

router.get("/getAllUser", auth(UserRole.SUPER_ADMIN), AdminController.getAllUser);

router.get("/subscribers-per-month", auth(UserRole.SUPER_ADMIN), AdminController.getSubscribersPerMonth);

router.put("/update-admin", upload.single("file"),parseJsonData, auth(UserRole.SUPER_ADMIN), AdminController.updateAdmin);

router.get("/getSingleUser/:userId", auth(UserRole.SUPER_ADMIN), AdminController.getSingleUser);

router.patch("/suspend/:id",auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), AdminController.suspendUser);


export const AdminRoutes = router;