import { Router } from "express";
import {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import upload from "../middleware/multer";

const router = Router();

router.get("/getUsers", getAllUsers);
router.post("/addUser", upload.single("image"), addUser);
router.put("/updateUser/:id", upload.single("image"), updateUser);
router.patch("/deleteUser/:id", deleteUser);

export default router;
