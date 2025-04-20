import { redis } from "../../../configurations/redis/index.js";
import crypto from "crypto";
import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Order } from "../../../models/order/order.model.js";
import { calculateBuyNowCheckoutDetails } from "../../../utils/buy-now/calculate-buy-now-checkout-details.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";

function generateOrderId() {
  return "SB" + crypto.randomBytes(12).toString("hex").toUpperCase();
}

const createBuyNowOrder = async (req, res) => {
  try {
    const { checkoutToken, payment_mode } = req?.body;

    if (!checkoutToken || !["cod", "online"].includes(payment_mode)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      /*--------------------------- Validating Checkout session token from redis---------------------------- */

      const checkoutSessionKey = `buy_now_checkout_token:${checkoutToken}`;
      const checkoutSessionData = await redis.get(checkoutSessionKey);

      if (!checkoutSessionData) {
        return res
          .status(404)
          .json({ error: "Checkout session not found or expired" });
      }

      const { product_id, sku_id, quantity } = JSON.parse(checkoutSessionData);

      /*--------------------------- Getting Product and sku details and inStock details---------------------------- */

      const selectedProductDetails = await Catalogue?.findOne({
        product_short_id: product_id,
      }).lean();

      if (!selectedProductDetails) {
        return res.status(404).json({ error: "Product not found" });
      }

      const selectedSkuDetails = selectedProductDetails?.customer_skus?.find(
        (sku) => sku?.short_id === sku_id
      );

      if (!selectedSkuDetails) {
        return res.status(404).json({ error: "SKU not found" });
      }

      if (selectedSkuDetails?.quantity < quantity) {
        return res.status(400).json({
          error: `Not enough stock for this product`,
        });
      }

      /*----------------------------Calcultaing Final amount befor order creation----------------------- */

      let appliedCouponData = null;

      const { products, bill_details, appliedCouponId } =
        await calculateBuyNowCheckoutDetails({
          product_id,
          sku_id,
          quantity,
          seller_id: req?.seller?._id,
        });

      // Check if coupon details are there
      if (appliedCouponId) {
        appliedCouponData = await Coupon.findOne({ short_id: appliedCouponId });
      }
      const couponDetails = appliedCouponData
        ? {
            short_id: appliedCouponData.short_id,
            code: appliedCouponData.code,
            title: appliedCouponData.title,
            discount_type: appliedCouponData.discount_type,
            discount_amount_applied: bill_details.coupon_discount,
          }
        : null;

      const order = new Order({
        seller: req?.seller,
        customer: req?.customer?._id,
        customer_details: req?.customer,
        products: products.map((item) => ({
          ...item,
          order_item_id: generateOrderId(),
          status_history: [{ status: "pending", timestamp: new Date() }],
        })),
        bill_details,
        payment_mode: payment_mode,
        coupon_details: couponDetails,
      });

      await order.save();

      await redis.del(checkoutSessionKey);
      await redis.del(`checkout_token_user:${req?.customer?._id}`);

      res.status(200).json({ message: "Order created successfully 🚀🚀" });
    } catch (error) {
      throw new Error(error);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { createBuyNowOrder };
