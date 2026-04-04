import { Router } from "express";
import {
  getSytemUsers,
  getRoles,
  addSystemUser,
  updateSystemUser,
  deleteUser,
} from "../controllers/systemuser.controller";
import upload from "../middleware/multer";

const router = Router();

router.get("/getSytemUsers", getSytemUsers);
router.get("/getRoles", getRoles);
router.post("/addSystemUser", upload.single("image"), addSystemUser);
router.put("/updateSystemUser/:id", upload.single("image"), updateSystemUser);
router.patch("/deleteUser/:id", deleteUser);

export default router;
