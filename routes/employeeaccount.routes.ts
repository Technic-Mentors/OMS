import { Router } from "express";
import {
  addEmployeeAccount,
  getEmployeeAccount,
  getEmployeeAccountForUser
} from "../controllers/employeeaccount.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router: Router = Router();

router.post("/admin/addEmployeeAccount", authenticateToken, isAdmin, addEmployeeAccount);
router.get("/admin/getEmployeeAccount/:employee_id", authenticateToken, isAdmin, getEmployeeAccount);

router.get("/user/getMyEmployeeAccount", authenticateToken, getEmployeeAccountForUser);

export default router;
