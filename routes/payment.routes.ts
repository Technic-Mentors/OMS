import { Router } from "express";
import {
  getPayments,
  addPayment,
  updatePayment,
  deletePayment,
} from "../controllers/payment.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getPayments", authenticateToken, getPayments);
router.post("/addPayment", authenticateToken, addPayment);
router.put("/updatePayment/:id", authenticateToken, updatePayment);
router.patch("/deletePayment/:id", authenticateToken, deletePayment);

export default router;
