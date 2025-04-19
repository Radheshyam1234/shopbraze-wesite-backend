import { redis } from "../../../configurations/redis/index.js";
import { calculateBuyNowCheckoutDetails } from "../../../utils/buy-now/calculate-buy-now-checkout-details.js";
import crypto from "crypto";

const generateCheckoutSessionTokenForBuyNow = (
  userId,
  productId,
  skuId,
  quantity
) => {
  const data = `${userId}-${productId}-${skuId}-${quantity}-${Date.now()}`;
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
};

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

const getBuyNowCheckoutDetails = async (req, res) => {
  try {
    const { product_id, quantity, sku_id } = req.query;
    const user_id = req?.customer?._id;

    if (!user_id || !product_id || !sku_id || !quantity) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    const { products, bill_details } = await calculateBuyNowCheckoutDetails({
      product_id,
      sku_id,
      quantity,
      seller_id: req?.seller?._id,
    });

    /*----------------------Token System for Checkout------------------------*/

    // 1. Remove old token if exists (ensures one active token per user)
    const oldTokenKey = await redis.get(`checkout_token_user:${user_id}`);
    if (oldTokenKey) {
      await redis.del(oldTokenKey);
    }

    // 2. Generate new token
    const newToken = generateCheckoutSessionTokenForBuyNow(
      user_id,
      product_id,
      sku_id,
      quantity
    );
    const tokenKey = `checkout_token:${newToken}`;

    // 3. Store checkout session data in Redis
    const checkoutSessionData = {
      user_id,
      product_id,
      sku_id,
      quantity,
    };

    await redis.setEx(tokenKey, 3600, JSON.stringify(checkoutSessionData)); // Store main token
    await redis.setEx(`checkout_token_user:${user_id}`, 3600, tokenKey); // Store pointer to user's active token

    // 4. Send both checkout details and session token to frontend
    res.status(200).json({
      data: {
        products,
        bill_details: transformBillDetails(bill_details),
      },
      checkoutSessionToken: newToken,
    });
  } catch (error) {
    console.log(error);
    res.status(error?.status || 500).json({ error: error.message });
  }
};

export { getBuyNowCheckoutDetails };
