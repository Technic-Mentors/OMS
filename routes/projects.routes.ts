import { Router } from "express";
import {
  getAllProjects,
  addProject,
  updateProject,
  deleteProject,
} from "../controllers/projects.controller";

const router = Router();


router.get("/getProjects", getAllProjects);
router.post("/addProject", addProject);
router.put("/updateProject/:id", updateProject);
router.patch("/deleteProject/:id", deleteProject);

export default router;
