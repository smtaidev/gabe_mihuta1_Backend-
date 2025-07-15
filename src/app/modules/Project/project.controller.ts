// modules/project/project.controller.ts
import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProjectService } from "./project.service";

const createProjectIntoDB = catchAsync(async (req: Request, res: Response) => {
  const result = await ProjectService.createProject(req.body);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Project created successfully!",
    data: result,
  });
});

const getAllProjects = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProjectService.getAllProjects();

  sendResponse(res, {
    statusCode: status.OK,
    message: "Projects fetched successfully!",
    data: result,
  });
});

export const ProjectController = { createProjectIntoDB, getAllProjects };