import { Router } from "express";
import {
  getAllProjects,
  addProject,
  updateProject,
  updateCompletionStatus,
  deleteProject,
} from "../controllers/projects.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getProjects", getAllProjects);
router.post("/addProject", addProject);
router.put("/updateProject/:id", updateProject);
router.patch(
  "/updateProjectStatus/:id",
  authenticateToken,
  updateCompletionStatus,
);
router.patch("/deleteProject/:id", deleteProject);

export default router;
