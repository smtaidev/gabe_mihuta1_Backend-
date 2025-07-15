import express from "express";
import { ProjectController } from "./project.controller";

const route = express.Router();

route.post("/create", ProjectController.createProjectIntoDB);
route.get("/all", ProjectController.getAllProjects);

export const ProjectRoute = route;
