import { Subscription } from './../../../node_modules/.prisma/client/index.d';
import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.routes";
import { PhaseRoutes } from "../modules/phase/phase.route";
import { PlanRoutes } from "../modules/plan/plan.route";
import { SubscriptionRoutes } from '../modules/subscription/subscription.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { GroupRoutes } from '../modules/group/group.route';

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/phase",
    route: PhaseRoutes,
  },
  {
    path: "/plans",
    route: PlanRoutes,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/groups",
    route: GroupRoutes,
  }

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
