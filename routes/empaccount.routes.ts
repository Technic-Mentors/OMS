import { Router } from "express";
import {
  addEmployeeAccount,
  getEmployeeAccount,
  getEmployeeAccountForUser
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

router.get(
  "/user/getMyEmployeeAccount",
  authenticateToken,
  getEmployeeAccountForUser
);


export default router;
