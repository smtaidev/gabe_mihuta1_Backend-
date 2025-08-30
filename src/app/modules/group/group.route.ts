import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { GroupController } from "./group.controller";

const router = Router();

router.post("/:groupId/join", auth("USER"), GroupController.joinGroup);

router.get("/getAllGroup", auth(UserRole.USER, UserRole.SUPER_ADMIN), GroupController.getAllGroups);

export const GroupRoutes = router;