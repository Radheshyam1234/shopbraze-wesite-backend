import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import { getCartPageCouponsAndOffers } from "../../controllers/coupons/index.js";
import { verifyCustomer } from "../../middlewares/verify-customer.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/offers/cart-page").get(getCartPageCouponsAndOffers);

export default router;
