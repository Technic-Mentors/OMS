import { Router } from "express";
import {
  getAllAssignProjects,
  getMyAssignProjects,
  getProjectsByUserId,
  addAssignProject,
  editAssignProject,
  deleteAssignProject,
} from "../controllers/assignproject.controller";

import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/admin/getAssignProjects", getAllAssignProjects);
router.get("/user/getMyAssignProjects", authenticateToken, getMyAssignProjects);
router.get("/admin/getUserProjects/:userId", authenticateToken, getProjectsByUserId);
router.post("/admin/assignProject", addAssignProject);
router.put("/admin/editAssignProject/:id", editAssignProject);
router.delete("/admin/deleteAssignProject/:id", deleteAssignProject);

export default router;
