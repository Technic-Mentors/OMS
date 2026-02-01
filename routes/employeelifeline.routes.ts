import { Router } from "express";
import {
  getUsers,
  addEmpll,
  getEmpll,
  updateEmpll,
  deleteEmpll,
} from "../controllers/employeelifeline.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get("/getUsers", authenticateToken, getUsers);
router.post("/addEmpll", authenticateToken, addEmpll);
router.get("/getEmpll", authenticateToken, getEmpll);
router.put("/updateEmpll/:id", authenticateToken, updateEmpll);
router.delete("/deleteEmpll/:id", authenticateToken, deleteEmpll);

export default router;
