import { Router } from "express";
import {
  addLoan,
  getAllLoans,
  getMyLoans,
} from "../controllers/loan.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.get("/admin/getLoans", authenticateToken, isAdmin, getAllLoans);
router.get("/user/getMyLoans", authenticateToken, getMyLoans);
router.post("/addLoan", authenticateToken, addLoan);

export default router;
