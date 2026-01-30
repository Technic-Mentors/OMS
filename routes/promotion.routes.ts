import { Router } from "express";
import {
  addPromotion,
  getAllPromotions,
  getMyPromotions,
  getEmployeeLifeLine,
  updatePromotion,
  deletePromotion,
  getEmployeePromotionHistory
} from "../controllers/promotion.controller";
import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

router.get("/admin/getPromotions", authenticateToken, isAdmin, getAllPromotions);
router.get("/user/getMyPromotions", authenticateToken, getMyPromotions);
router.get("/admin/getPromotionHistory/:employeeId", authenticateToken, isAdmin, getEmployeePromotionHistory);
router.post("/admin/addPromotion", authenticateToken, isAdmin, addPromotion);
router.post("/user/addPromotion", authenticateToken, addPromotion);
router.put("/admin/updatePromotion/:id", authenticateToken, isAdmin, updatePromotion);
router.get("/admin/getEmployeeLifeLine", authenticateToken, isAdmin, getEmployeeLifeLine);
router.put("/user/updatePromotion/:id", authenticateToken, updatePromotion);
router.patch("/admin/deletePromotion/:id", authenticateToken, isAdmin, deletePromotion);
router.patch("/user/deletePromotion/:id", authenticateToken,  deletePromotion);


export default router;
