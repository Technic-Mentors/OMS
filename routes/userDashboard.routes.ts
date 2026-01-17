import { Router } from "express";
import { getUserDashboard } from "../controllers/userDashboard.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/user/dashboard", authenticateToken, getUserDashboard);

export default router;
