import express from "express";
import {
  getResignations,
  getMyResignations,
  addResignation,
  updateResignation,
  deleteResignation,
  getEmployeeLifeLine,
} from "../controllers/resignation.controller";
import { authenticateToken , isAdmin } from "../middleware/middleware";

const router = express.Router();

router.get("/admin/getResignations", authenticateToken,  isAdmin , getResignations);
router.get("/user/getMyResignations", authenticateToken, getMyResignations);
router.post("/admin/addResignation", authenticateToken,  isAdmin, addResignation);
router.post("/user/addResignation", authenticateToken,  addResignation);
router.put("/updateResignation/:id", authenticateToken,  updateResignation);
router.delete("/deleteResignation/:id", authenticateToken, deleteResignation);
router.get("/admin/getEmployeeLifeLine/:id", authenticateToken,  isAdmin, getEmployeeLifeLine);

export default router;
