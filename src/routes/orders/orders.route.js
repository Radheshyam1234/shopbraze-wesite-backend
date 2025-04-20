import { Router } from "express";
import { verifySeller } from "../../middlewares/verify-seller.js";

import { verifyCustomer } from "../../middlewares/verify-customer.js";
import {
  cancelOrderByOrderItemId,
  createBuyNowOrder,
  createOrderFromCart,
  getCustomerOrders,
  getOrderDetailsByOrderItemId,
} from "../../controllers/orders/index.js";

const router = Router();

router.use(verifySeller);
router.use(verifyCustomer);

router.route("/").get(getCustomerOrders);
router.route("/:orderItemId").get(getOrderDetailsByOrderItemId);
router.route("/buy-now").post(createBuyNowOrder);
router.route("/cart").post(createOrderFromCart);
router.route("/cancel/:orderItemId").put(cancelOrderByOrderItemId);

export default router;
