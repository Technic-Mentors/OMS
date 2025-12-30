import { Router } from "express";
import {
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/astcat.controller";

const router = Router();

router.get("/assetCategories", getCategories);
router.get("/assetCategories/:id", getCategoryById);
router.post("/createAssetCategory", addCategory);
router.put("/updateAssetCategory/:id", updateCategory);
router.delete("/deleteAssetCategory/:id", deleteCategory);

export default router;
