import { Router } from "express";
import {
  getBusinessVariables,
  addBusinessVariable,
  editBusinessVariable,
  deleteBusinessVariable,
} from "../controllers/businessvariable.controller";

import upload  from "../middleware/multer";

const router = Router();

router.get("/business-variables", getBusinessVariables);

router.post(
  "/addBusinessVariable",
  upload.single("logo"),
  addBusinessVariable,
);

router.put(
  "/editBusinessVariable/:id",
  upload.single("logo"),
  editBusinessVariable,
);

router.delete("/business-variables/:id", deleteBusinessVariable);

export default router;