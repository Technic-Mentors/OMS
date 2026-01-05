import { Router } from "express";
import {
  addEmployeePayment,
  addEmployeeRefund,
  getEmployeePayments,
  getEmployeeRefunds,
} from "../controllers/empaccount.controller";

const router = Router();

router.post("/addEmployeePayment", addEmployeePayment);
router.post("/addEmployeeRefund", addEmployeeRefund);
router.get("/getEmployeePayments/:id", getEmployeePayments);
router.get("/getEmployeeRefunds/:id", getEmployeeRefunds);

export default router;
