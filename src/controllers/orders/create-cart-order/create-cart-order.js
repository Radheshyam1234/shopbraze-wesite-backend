import crypto from "crypto";
import { CustomerCart } from "../../../models/cart/cart.model.js";
import { calculateCartCheckoutDetails } from "../../../utils/cart/calculate-cart-checkout-details.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";
import { Order } from "../../../models/order/order.model.js";
import { redis } from "../../../configurations/redis/index.js";

function generateOrderId() {
  return "SB" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

function getAlphaSuffix(index) {
  let suffix = "";
  index += 1;
  while (index > 0) {
    let rem = (index - 1) % 26;
    suffix = String.fromCharCode(65 + rem) + suffix;
    index = Math.floor((index - 1) / 26);
  }
  return suffix;
}

const createOrderFromCart = async (req, res) => {
  try {
    const customerId = req?.customer?._id;
    const sellerId = req?.seller?._id;
    const { checkoutToken, payment_mode } = req.body;

    if (!checkoutToken || !["cod", "online"].includes(payment_mode)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const sessionKey = `cart_checkout_token:${checkoutToken}`;
    const checkoutSessionData = await redis.get(sessionKey);

    if (!checkoutSessionData) {
      return res
        .status(404)
        .json({ error: "Checkout session expired or invalid" });
    }

    const { cart_id } = JSON.parse(checkoutSessionData);

    const customerCart = await CustomerCart.findOne({
      _id: cart_id,
      customer: customerId,
      seller: sellerId,
    }).lean();

    if (!customerCart || !customerCart.items?.length) {
      return res.status(400).json({ error: "Cart is empty or already used" });
    }

    const { products, bill_details, appliedCouponId } =
      await calculateCartCheckoutDetails({
        customerId,
        sellerId,
      });

    let couponDetails = null;
    if (appliedCouponId) {
      const coupon = await Coupon.findOne({ short_id: appliedCouponId }).lean();
      if (coupon) {
        couponDetails = {
          short_id: coupon.short_id,
          code: coupon.code,
          title: coupon.title,
          discount_type: coupon.discount_type,
          discount_amount_applied: bill_details?.coupon_discount,
        };
      }
    }

    const orderId = generateOrderId();

    const order = new Order({
      order_id: orderId,
      source: "cart",
      seller: sellerId,
      customer: customerId,
      customer_details: req.customer,
      products: products.map((item, index) => ({
        ...item,
        order_item_id: orderId + getAlphaSuffix(index),
        status_history: [{ status: "pending", timestamp: new Date() }],
      })),
      bill_details,
      payment_mode,
      coupon_details: couponDetails,
    });

    await order.save();

    await CustomerCart.updateOne({ _id: cart_id }, { $set: { items: [] } });

    await redis.del(sessionKey);
    await redis.del(`cart_checkout_token_user:${customerId}`);

    return res.status(200).json({ message: "Order placed successfully 🚀" });
  } catch (error) {
    console.error("❌ Error placing cart order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { createOrderFromCart };
