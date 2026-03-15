import express from "express";
import {
  getSupplierAcc,
  addSupplierAcc,
  getSuppliers,
  getSupplierById,
  getSupplierAccounts,
  getAllSupplierAccounts,
} from "../controllers/supplieraccount.controller";

import { authenticateToken } from "../middleware/middleware";

const router = express.Router();

router.get("/getSupplierAcc", authenticateToken, getSupplierAcc);
router.get("/getSuppliers", authenticateToken, getSuppliers);
router.get("/getSupplierById/:id", authenticateToken, getSupplierById);
router.get("/getAllSupplierAccounts", authenticateToken,   getAllSupplierAccounts);

router.get(
  "/getSupplierAccounts/:supplierId",
  authenticateToken,
  getSupplierAccounts
);

router.post("/addSupplierAcc", authenticateToken, addSupplierAcc);

export default router;
