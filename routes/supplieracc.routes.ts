import express from "express";
import {
  getSupplierAcc,
  addSupplierAcc,
  getSuppliers,
  getSupplierById,
  getSupplierAccounts,
} from "../controllers/supplieracc.controller";

import { authenticateToken } from "../middleware/middleware";

const router = express.Router();

router.get("/getSupplierAcc", authenticateToken, getSupplierAcc);
router.get("/getSuppliers", authenticateToken, getSuppliers);
router.get("/getSupplierById/:id", authenticateToken, getSupplierById);
router.get(
  "/getSupplierAccounts/:supplierId",
  authenticateToken,
  getSupplierAccounts
);

router.post("/addSupplierAcc", authenticateToken, addSupplierAcc);

export default router;
