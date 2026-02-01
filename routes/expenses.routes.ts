import { Router } from "express";
import {
  getExpenses,
  addExpense,
  getTotalExpenseAmount,
  updateExpense,
  deleteExpense,
  getExpenseById,
} from "../controllers/expenses.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getExpense", authenticateToken, getExpenses);
router.get("/getExpense/:id", authenticateToken, getExpenseById);
router.get("/getTotalExpense", getTotalExpenseAmount);
router.post("/addExpense", authenticateToken, addExpense);
router.put("/updateExpense/:id", authenticateToken, updateExpense);
router.delete("/deleteExpense/:id", authenticateToken, deleteExpense);

export default router;
