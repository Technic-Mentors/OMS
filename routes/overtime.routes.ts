import { Router } from "express";
import {
  getAllOvertime,
  getMyOvertime,
  createOvertime,
  updateOvertime,
  deleteOvertime,
} from "../controllers/overtime.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.post("/createOvertime", authenticateToken, createOvertime);
router.get("/admin/getAllOvertime", authenticateToken, isAdmin, getAllOvertime);
router.get("/user/getMyOvertime", authenticateToken, getMyOvertime);
router.put("/admin/updateOvertime/:id", authenticateToken, isAdmin, updateOvertime);
router.delete("/admin/deleteOvertime/:id",authenticateToken,isAdmin,deleteOvertime);
router.delete("/user/deleteOvertime/:id",authenticateToken,deleteOvertime);

export default router;
