import { Router } from "express";
import {
  getSales,
  addSale,
  deleteSale,
} from "../controllers/sale.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getSales", authenticateToken, getSales);
router.post("/addSale", authenticateToken, addSale);
router.patch("/deleteSale/:id", authenticateToken, deleteSale);

export default router;
