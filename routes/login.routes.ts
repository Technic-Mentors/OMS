import express from "express";
import {
  login,
  changePassword,
  confirmPassword,
} from "../controllers/login.controller";
const router = express.Router();

router.post("/login", login);
router.put("/changePassword/:id", changePassword);
router.put("/confirmPassword/:id", confirmPassword);

export default router;
