import { Router } from "express";
import {
  addSupplier,
  updateSupplier,
  getAllSuppliers,
  getSupplier,
  deleteSupplier,
} from "../controllers/adminSupp.controller";

const router = Router();

router.get("/getSuppliers", getAllSuppliers);
router.get("/getSupplier/:supplierId", getSupplier);
router.post("/addSupplier", addSupplier);
router.post("/updateSupplier", updateSupplier);
router.delete("/deleteSupplier/:supplierId", deleteSupplier);

export default router;
