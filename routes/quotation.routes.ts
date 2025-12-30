import express from "express";
import {
  getQuotations,
  getQuotation,
  addQuotation,
} from "../controllers/quotation.controller";

const router = express.Router();

router.get("/getQuotations", getQuotations);
router.get("/getQuotation/:id", getQuotation);
router.post("/addQuotation", addQuotation);

export default router;
