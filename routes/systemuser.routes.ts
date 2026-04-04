import { Router } from "express";
import {
  getSytemUsers,
  getRoles,
  addSystemUser,
  updateSystemUser,
  deleteUser,
} from "../controllers/systemuser.controller";

const router = Router();

router.get("/getSytemUsers", getSytemUsers);
router.get("/getRoles", getRoles);
router.post("/addSystemUser", addSystemUser);
router.put("/updateSystemUser/:id", updateSystemUser);
router.delete("/deleteUser/:id", deleteUser);

export default router;
