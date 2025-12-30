import { Router } from "express";
import {
  getApplicants,
  addApplicant,
  updateApplicant,
  deleteApplicant,
} from "../controllers/applicant.controller";

const router = Router();

router.get("/getapplicants", getApplicants);
router.post("/addapplicant", addApplicant);
router.patch("/updateapplicant/:id", updateApplicant);
router.patch("/deleteapplicant/:id", deleteApplicant);

export default router;
