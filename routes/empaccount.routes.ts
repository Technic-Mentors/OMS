// routes/empaccount.routes.ts
import { Router } from "express";
import {
  addEmployeeAccount,
  getEmployeeAccount,
  getEmployeeAccountForUser
} from "../controllers/empaccount.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router: Router = Router();

// Admin routes
router.post("/admin/addEmployeeAccount", authenticateToken, isAdmin, addEmployeeAccount);
router.get("/admin/getEmployeeAccount/:employee_id", authenticateToken, isAdmin, getEmployeeAccount);

// User route
router.get("/user/getMyEmployeeAccount", authenticateToken, getEmployeeAccountForUser);

export default router;
