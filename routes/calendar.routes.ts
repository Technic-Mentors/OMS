import { Router } from "express";
import {
  getAllCalendarSessions,
  addCalendarSession,
  activateCalendarSession,
  updateCalendarSession,
  deleteCalendarSession,
} from "../controllers/calendar.controller";

const router = Router();

router.get("/getCalendarSession", getAllCalendarSessions);
router.post("/addCalendarSession", addCalendarSession);
router.post("/activate-calendar-session", activateCalendarSession);
router.put("/updateCalendarSession/:id", updateCalendarSession);
router.delete("/deleteCalendarSession/:id", deleteCalendarSession);

export default router;
