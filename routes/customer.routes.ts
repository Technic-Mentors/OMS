import { Router } from "express";
import {
  getAllCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getSingleCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.get("/getAllCustomers", getAllCustomers);

router.get("/getSingleCustomer/:id", getSingleCustomer);

router.post("/addCustomer", addCustomer);

router.patch("/updateCustomer/:id", updateCustomer);

router.patch("/deleteCustomer/:id", deleteCustomer);

export default router;
