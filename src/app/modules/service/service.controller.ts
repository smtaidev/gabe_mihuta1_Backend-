import status from "http-status";
import { userService } from "./service.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import config from "../../config";
import ApiError from "../../errors/ApiError";

// Create a new service
const createNewService = catchAsync(async (req, res) => {
  console.log("Request body:", req.body);

  // Validate required field
  if (!req.body.serviceName) {
    throw new ApiError(status.BAD_REQUEST, "serviceName is required");
  }

  if (req.file) {
    req.body.imageUrl = `${config.imageUrl}/uploads/${req.file.filename}`;
  }

  const result = await userService.createServiceIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Service created successfully",
    data: result,
  });
});


const getAllServices = catchAsync(async (req, res) => {
  const result = await userService.getAllServiceFromDB(req.query);

  console.log("All Services data:", result.data);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Services are retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const ServiceController = {
  createNewService,
  getAllServices,
};
