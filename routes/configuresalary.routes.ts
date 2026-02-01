import express from "express";
import {
  getSalaries,
  getSalaryById,
  addSalary,
  updateSalary,
  deleteSalary,
} from "../controllers/configuresalary.controller";

const router = express.Router();

router.get("/getsalaries", getSalaries);
router.get("/getsalaries/:id", getSalaryById);
router.post("/addsalaries", addSalary);
router.put("/updatesalaries/:id", updateSalary);
router.patch("/deletesalaries/:id", deleteSalary);

export default router;
