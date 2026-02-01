import { Router } from "express";
import {
  getAllConfigTime,
  addConfigTime,
  updateConfigTime,
  deleteConfigTime,
} from "../controllers/attendanceRule.controller";

const router = Router();


router.get("/getTimeConfigured", getAllConfigTime);
router.post("/configureTime", addConfigTime);
router.put("/updateTime/:id", updateConfigTime);
router.delete("/deleteTime/:id", deleteConfigTime);

export default router;