import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";
import {
  getCustomerCartItems,
  addCataloguesToCart,
  getCartItemsCount,
} from "../../controllers/cart/index.js";
import { verifyCustomer } from "../../middlewares/verify-customer.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/add-items").post(addCataloguesToCart);
router.route("/cart-details").get(getCustomerCartItems);
router.route("/count").get(getCartItemsCount);

export default router;
