import { Router } from "express";
import {
  addEmployeePayment,
  addEmployeeRefund,
  getEmployeePayments,
  getEmployeeRefunds,
} from "../controllers/empaccount.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.post("/admin/addEmployeeAccount", authenticateToken, addEmployeePayment);

router.get("/admin/getEmployeePayments/:id", authenticateToken, getEmployeePayments);
router.get("/user/getMyPayments", authenticateToken, getEmployeePayments);

router.get("/admin/getEmployeeRefunds/:id", authenticateToken, getEmployeeRefunds);
router.get("/user/getMyRefunds", authenticateToken, getEmployeeRefunds);


export default router;
