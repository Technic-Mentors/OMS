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
router.post("/addAttendance/:userId", addAttendance);
router.patch("/updateAttendance/:id", updateAttendance);
router.patch("/deleteAttendance/:id", deleteAttendance);

export default router;
