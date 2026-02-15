import { Router } from "express";
import {
  getAllRejoinRequests,
  getMyRejoinRequests,
  getUsersWithAcceptedResignation,
  getMyLifeLine,
  getMyResignation,
  addRejoinRequest,
  updateRejoinRequest,
  deleteRejoinRequest,
} from "../controllers/rejoin.controller";
import { authenticateToken } from "../middleware/middleware";

const router = Router();

router.get(
  "/admin/getAllRejoinRequests",
  authenticateToken,
  getAllRejoinRequests,
);
router.post("/admin/addRejoin", authenticateToken, addRejoinRequest);
router.put("/admin/updateRejoin/:id", authenticateToken, updateRejoinRequest);
router.patch("/admin/deleteRejoin/:id", authenticateToken, deleteRejoinRequest);
router.get("/admin/getUsersWithAcceptedResignation", authenticateToken, getUsersWithAcceptedResignation);
router.get("/user/getMyRejoinRequests", authenticateToken, getMyRejoinRequests);
router.get("/user/getMyLifeLine", authenticateToken, getMyLifeLine);
router.get("/user/getMyResignation", authenticateToken, getMyResignation);
router.post("/user/addRejoin", authenticateToken, addRejoinRequest);
router.put("/user/updateMyRejoin/:id", authenticateToken, updateRejoinRequest);

export default router;
