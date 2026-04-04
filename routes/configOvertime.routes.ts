import express from "express";
import {
  getOvertimeConfig,
  createOvertimeConfig,
  updateOvertimeConfig,
  deleteOvertimeConfig,
} from "../controllers/configOvertime.controller";

import { authenticateToken } from "../middleware/middleware";

const router = express.Router();

router.get("/getOvertimeConfig", authenticateToken, getOvertimeConfig);
router.post("/createOvertimeConfig", authenticateToken, createOvertimeConfig);
router.put("/updateOvertimeConfig/:id", authenticateToken, updateOvertimeConfig);
router.delete("/deleteOvertimeConfig/:id", authenticateToken, deleteOvertimeConfig);

export default router;
