import { Router } from "express";
import {
  getUsers,
  getAllAttendances,
  getMyAttendances,
  addAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/userAtndnc.controller";

import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.get("/admin/getUsers", getUsers);
router.get(
  "/admin/getAllAttendances",
  authenticateToken,
  isAdmin,
  getAllAttendances
);
router.get("/user/getMyAttendances", authenticateToken, getMyAttendances);
router.post("/admin/addAttendance/:userId", isAdmin, addAttendance);
router.patch("/admin/updateAttendance/:id", isAdmin, updateAttendance);
router.patch("/admin/deleteAttendance/:id", isAdmin,deleteAttendance);

export default router;
