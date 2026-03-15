import { Router } from "express";
import {
  getOvertime,
  createOvertime,
} from "../controllers/overtime.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.get("/getOvertime", authenticateToken, isAdmin, getOvertime);
router.post("/createOvertime", authenticateToken, createOvertime);

export default router;
