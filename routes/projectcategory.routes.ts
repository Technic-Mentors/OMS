import { Router } from "express";
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/projectcategory.controller";

const router = Router();

router.get("/getCategory", getAllCategories);
router.post("/createCategory", addCategory);
router.put("/updateCategory/:id", updateCategory);
router.patch("/deleteCategory/:id", deleteCategory);

export default router;
