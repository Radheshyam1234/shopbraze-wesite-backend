import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";

import { verifyCustomer } from "../../middlewares/verify-customer.js";
import { createBuyNowOrder } from "../../controllers/orders/index.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/buy-now").post(createBuyNowOrder);

export default router;
