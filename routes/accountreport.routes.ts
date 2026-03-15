import { Router } from "express";
import { getAccountReport } from "../controllers/accountreport.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.get(
  "/getAccountReport",
  authenticateToken,
  isAdmin,
  getAccountReport,
);

export default router;
