import { redis } from "../../../configurations/redis/index.js";
import { calculateCartCheckoutDetails } from "../../../utils/cart/calculate-cart-checkout-details.js";

import crypto from "crypto";

const generateCheckoutSessionTokenForCart = (userId) => {
  const data = `${userId}-cart-${Date.now()}`;
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
};

export { generateCheckoutSessionTokenForCart };

function transformBillDetails(rawBill) {
  const formatINR = (val) => `₹${val.toLocaleString("en-IN")}`;

  return {
    title: "Bill Details",
    sub_title: `Yay! your total discount is ₹${(
      rawBill.total_mrp - rawBill.total_amount
    ).toLocaleString("en-IN")}`,
    entities: [
      { key: "Items", value: rawBill.items },
      { key: "Item total", value: formatINR(rawBill.item_total) },
      { key: "Sale Discount", value: `-${formatINR(rawBill.sale_discount)}` },
      ...(rawBill.coupon_discount > 0
        ? [
            {
              key: "Coupon Discount",
              value: `-${formatINR(rawBill.coupon_discount)}`,
            },
          ]
        : []),
      { key: "Delivery fee", value: formatINR(rawBill.delivery_fee) },
      { key: "Total amount", value: formatINR(rawBill.total_amount) },
    ],
  };
}

const getCartCheckoutDetails = async (req, res) => {
  try {
    const user_id = req?.customer?._id;
    const sellerId = req?.seller?._id;
    const visitor_id = req?.visitorId;

    const { products, bill_details } = await calculateCartCheckoutDetails({
      sellerId: sellerId,
      customerId: user_id,
      visitor_id,
    });

    /*----------------------Token System for Checkout (if user loggedIn)------------------------*/

    let newToken = "";

    // 1. Remove old token if exists (ensures one active token per user)
    if (user_id) {
      const oldTokenKey = await redis.get(
        `cart_checkout_token_user:${user_id}`
      );
      if (oldTokenKey) {
        await redis.del(oldTokenKey);
      }

      // 2. Generate new token
      newToken = generateCheckoutSessionTokenForCart(user_id);
      const tokenKey = `cart_checkout_token:${newToken}`;

      // 3. Store checkout session data in Redis
      const checkoutSessionData = {
        user_id,
        sellerId,
      };

      await redis.setEx(tokenKey, 3600, JSON.stringify(checkoutSessionData)); // Store main token
      await redis.setEx(`cart_checkout_token_user:${user_id}`, 3600, tokenKey); // Store pointer to user's active token
    }
    // 4. Send both checkout details and session token to frontend
    res.status(200).json({
      data: {
        products,
        bill_details: transformBillDetails(bill_details),
      },
      ...(user_id && { checkoutSessionToken: newToken }),
    });
  } catch (error) {
    console.log("Error in getCartCheckoutDetails:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCartCheckoutDetails };
