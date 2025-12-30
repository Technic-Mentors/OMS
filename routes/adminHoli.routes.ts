import { Router } from "express";
import {
  getHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/adminHoli.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getHolidays", authenticateToken, getHolidays);
router.post("/configHolidays", authenticateToken, addHoliday);
router.put("/updateHoliday/:id", authenticateToken, updateHoliday);
router.delete("/deleteHoliday/:id", authenticateToken, deleteHoliday);

export default router;
