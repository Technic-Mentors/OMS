import express from "express";
import {
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getCategories,
} from "../controllers/asset.controller";

const router = express.Router();

router.get("/assets", getAssets);
router.post("/createassets", addAsset);
router.put("/updateasset/:id", updateAsset);
router.delete("/deleteassets/:id", deleteAsset);

router.get("/categories", getCategories);

export default router;
