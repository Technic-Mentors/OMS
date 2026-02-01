import { Router } from "express";
import {
  withdrawEmployee,
  getWithdrawnEmployees,
  reActiveEmployee,
} from "../controllers/employeewithdraw.controller";

const router = Router();

router.post("/withdrawEmployee/:id", withdrawEmployee);
router.get("/getWithdrawEmployees", getWithdrawnEmployees);
router.put("/reActiveEmployee/:id", reActiveEmployee);

export default router;
