import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import {
  getCustomerData,
  sendOtp,
  verifyOtp,
} from "../../controllers/auth/index.js";
import { verifyCustomer } from "../../middlewares/verify-customer.js";

const router = Router();

router.use(verifySeller);

router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(verifyOtp);

router.use(verifyCustomer);

router.route("/customer").get(getCustomerData);

export default router;
