import { Router } from "express";
import { getAttendance, markAttendance } from "../controllers/markAttendance.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();


router.get("/getAttendance/:id", authenticateToken, getAttendance);
router.post("/markAttendance/:id", authenticateToken, markAttendance);

export default router;
