import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { PlanRoutes } from "../modules/plan/plan.route";
import { UserRoutes } from "../modules/user/user.routes";
import { ServiceRoutes } from "../modules/service/service.route";
import { ProjectRoute } from "../modules/Project/project.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";

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
    path: "/services",
    route: ServiceRoutes,
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
    path: "/projects",
    route: ProjectRoute,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
