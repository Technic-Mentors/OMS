import { Router } from "express";
import {
  addEmployeeAccount,
  getEmployeeAccount,
} from "../controllers/empaccount.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.post(
  "/admin/addEmployeeAccount",
  authenticateToken,
  isAdmin,
  addEmployeeAccount
);

router.get(
  "/admin/getEmployeeAccount/:employeeId",
  authenticateToken,
  isAdmin,
  getEmployeeAccount
);

export default router;
