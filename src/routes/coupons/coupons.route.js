import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import {
  getBuyNowPageOffersAndCoupons,
  getCartPageCouponsAndOffers,
} from "../../controllers/coupons/index.js";
import { verifyCustomer } from "../../middlewares/verify-customer.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/offers/cart-page").get(getCartPageCouponsAndOffers);
router.route("/offers/buy-now-page").get(getBuyNowPageOffersAndCoupons);

export default router;
