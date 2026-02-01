import { Router } from "express";
import {
  getExpenseCategory,
  addExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expensecategories.controller";

const router = Router();

router.get("/getExpenseCategory", getExpenseCategory);
router.post("/createExpenseCategory", addExpenseCategory);
router.put("/updateExpenseCategory/:id", updateExpenseCategory);
router.patch("/deleteExpenseCategory/:id", deleteExpenseCategory);

export default router;
