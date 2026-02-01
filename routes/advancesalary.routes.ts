import { Router } from "express";
import {
  getAllAdvanceSalary,
  getMyAdvanceSalary,
  createAdvanceSalary,
  updateAdvanceSalary,
  deleteAdvanceSalary,
} from "../controllers/advancesalary.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";


const router = Router();

router.get("/admin/getAdvanceSalary", authenticateToken, isAdmin, getAllAdvanceSalary);
router.get("/user/getMyAdvanceSalary", authenticateToken, getMyAdvanceSalary);
router.post("/createAdvanceSalary", authenticateToken,  createAdvanceSalary);
router.put("/admin/updateAdvanceSalary/:id", authenticateToken, updateAdvanceSalary);
router.delete("/admin/deleteAdvanceSalary/:id", authenticateToken,  deleteAdvanceSalary);

export default router;
