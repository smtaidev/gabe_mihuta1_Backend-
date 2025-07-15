import prisma from "../../utils/prisma";

const createProject = async (payload:any) => {
    const result = await prisma.project.create({
    data: payload,
  });

  return result;
}

const getAllProjects = async () => {
  const result = await prisma.project.findMany();
  return result;
}

export const ProjectService = { createProject, getAllProjects };