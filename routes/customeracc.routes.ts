import { Router } from "express";
import {
  getCustomerAccountsList,
  getAllCustomers,
  addCustomerAccount,
  getCustomerById,
  getCustomerAccountsByCustomerId,
} from "../controllers/customeracc.controller";

const router = Router();

router.get("/getCustomerAcc", getCustomerAccountsList);
router.get("/getAllCustomers", getAllCustomers);
router.post("/addCustomerAccount", addCustomerAccount);
router.get("/getCustomerById/:id", getCustomerById);
router.get("/getCustomerAccounts/:id", getCustomerAccountsByCustomerId);

export default router;
