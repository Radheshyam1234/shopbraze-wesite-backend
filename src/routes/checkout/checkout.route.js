import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { verifyCustomer } from "../../middlewares/verify-customer.js";
import {
  getBuyNowCheckoutDetails,
  getCartCheckoutDetails,
} from "../../controllers/checkout/index.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/buyNow").get(getBuyNowCheckoutDetails);
router.route("/cart").get(getCartCheckoutDetails);

export default router;
