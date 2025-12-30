import { Router } from "express";
import {
  getJobs,
  addJob,
  updateJob,
  deleteJob,
} from "../controllers/job.controller";

const router = Router();

router.get("/getjob", getJobs);
router.post("/addjob", addJob);
router.put("/updatejob/:id", updateJob);
router.patch("/deletejob/:id", deleteJob);

export default router;
