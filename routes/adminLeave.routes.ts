import { Router, Request, Response, NextFunction } from "express";
import {
  getUsersLeaves,
  getMyLeaves,
  addLeave,
  updateLeave,
  getAllUsers,
} from "../controllers/adminLeave.controller";

import type { RequestWithUser } from "../controllers/adminLeave.controller";

import { authenticateToken, isAdmin } from "../middleware/middleware";

const router = Router();

const wrapAsync =
  (
    fn: (
      req: RequestWithUser,
      res: Response,
      next?: NextFunction
    ) => Promise<any>
  ) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req as RequestWithUser, res, next).catch(next);

router.get(
  "/admin/getUsersLeaves",
  authenticateToken,
  isAdmin,
  wrapAsync(getUsersLeaves)
);
router.get("/admin/getUsers", wrapAsync(getAllUsers));
router.get("/user/getMyLeaves", authenticateToken, wrapAsync(getMyLeaves));
router.post("/addLeave", authenticateToken, wrapAsync(addLeave));
router.put("/admin/updateLeave/:id", wrapAsync(updateLeave));

export default router;
