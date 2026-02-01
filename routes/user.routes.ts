import { Router } from "express";
import {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

router.get("/getUsers", getAllUsers);
router.post("/addUser", addUser , );
router.put("/updateUser/:id", updateUser);
router.patch("/deleteUser/:id", deleteUser);

export default router;
