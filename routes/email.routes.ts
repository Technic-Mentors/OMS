import express from "express";
import { sendReportEmail } from "../controllers/email.controller";

const router = express.Router();

router.post("/send-report", sendReportEmail);

export default router;