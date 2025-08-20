import { Router } from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionValidation } from "./subscription.validation";

const router = Router();

router.post(
  "/create-subscription",
  auth(),
  validateRequest(SubscriptionValidation.SubscriptionValidationSchema),
  SubscriptionController.createSubscription
);



router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SubscriptionController.getAllSubscription
);

router.get(
  "/:subscriptionId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  SubscriptionController.getSingleSubscription
);

// router.put(
//   "/:subscriptionId",
//   auth(UserRole.USER, UserRole.ADMIN),
//   SubscriptionController.updateSubscription
// );

// router.delete(
//   "/:subscriptionId",
//   auth(UserRole.ADMIN),
//   SubscriptionController.deleteSubscription
// );

router.post("/stripe/webhook", SubscriptionController.handleStripeWebhook);

export const SubscriptionRoutes = router;
