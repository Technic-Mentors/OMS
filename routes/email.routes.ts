import express from "express";
import { sendSalesReportEmail } from "../controllers/email.controller";

const router = express.Router();

router.post("/send-report", sendSalesReportEmail);

export default router;