import status from "http-status";
import { PlanServices } from "./plan.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";

// // Create Plan
const createPlan = catchAsync(async (req, res) => {
    const result = await PlanServices.createPlan(req.body);
    
    sendResponse(res, {
        statusCode: status.CREATED,
        message: "Plan created successfully!",
        data: result,
    });
});

export const PlanController = {
    createPlan,
};