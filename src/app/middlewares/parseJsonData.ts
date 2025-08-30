import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status"; // if you're using `http-status`
import ApiError from "../errors/ApiError"; // adjust path to your ApiError class

// Middleware to parse JSON inside `req.body.data`
const parseJsonData = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body?.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  } catch {
    next(new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in 'data' field"));
  }
};

export default parseJsonData;
