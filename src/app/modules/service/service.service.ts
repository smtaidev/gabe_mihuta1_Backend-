import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";
import status from "http-status";
import { User, UserRole } from "@prisma/client";

const createServiceIntoDB = async (payload: Prisma.ServiceCreateInput) => {
  const isServiceExist = await prisma.service.findUnique({
    where: { serviceName: payload.serviceName },
  });

  if (isServiceExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Service with name "${payload.serviceName}" already exists!`
    );
  }


  const defaultAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (!defaultAdmin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Default admin user not found");
  }

  

  // Create service with explicit fields from payload
  const service = await prisma.service.create({
    data: {
      serviceTitle: payload.serviceTitle,
      serviceName: payload.serviceName,
      serviceDescription: payload.serviceDescription,
      imageUrl: payload.imageUrl ?? "", // Use empty string if undefined
      createdBy: { connect: { id: defaultAdmin.id } },
    },
  });

  return {
    success: true,
    message: "Service created successfully",
    data: service,
  };
};


const getAllServiceFromDB = async (query: Record<string, unknown>) => {
  try {
    const serviceQuery = new QueryBuilder(prisma.service, query)
      .search(["serviceName"])
      .select([
        "serviceName",
        "serviceTitle",
        "updatedAt",
        "serviceDescription",
        "createdById",
      ])
      .paginate();

    const [result, meta] = await Promise.all([
      serviceQuery.execute(),
      serviceQuery.countTotal(),
    ]);

    console.log("All Services data:", result.length);

    if (!result.length) {
      throw new ApiError(status.NOT_FOUND, "No services found!");
    }

    return {
      meta,
      data: result,
    };
  } catch (err) {
    console.error("🔥 Error in getAllServiceFromDB:", err);
    throw err; 
  }
};


export const userService = {
  createServiceIntoDB,
  getAllServiceFromDB,
};


