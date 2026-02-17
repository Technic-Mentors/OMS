import { Router } from "express";
import { runSalaryCycle } from "../controllers/salaryCycle.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.post("/admin/runSalaryCycle", authenticateToken, runSalaryCycle);

export default router;
