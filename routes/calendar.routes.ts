import { Router } from "express";
import {
  getAllCalendarSessions,
  addCalendarSession,
} from "../controllers/calendar.controller";

const router = Router();

router.get("/getCalendarSession", getAllCalendarSessions);
router.post("/addCalendarSession", addCalendarSession);

export default router;
