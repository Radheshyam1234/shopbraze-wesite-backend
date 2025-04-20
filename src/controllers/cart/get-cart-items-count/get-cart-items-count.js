import { redis } from "../../../configurations/redis/index.js";
import { CustomerCart } from "../../../models/cart/cart.model.js";

const getCartItemsCount = async (req, res) => {
  try {
    const user_id = req?.customer?._id;
    const sellerId = req?.seller?._id;
    const visitor_id = req?.visitorId;

    let cartItems = [];

    if (user_id && sellerId) {
      const customerCart = await CustomerCart.findOne({
        customer: user_id,
        seller: sellerId,
      }).lean();

      cartItems = customerCart?.items || [];
    } else if (visitor_id) {
      const cartKey = `cart:${visitor_id}`;
      const cartData = await redis.lRange(cartKey, 0, -1);

      cartItems = cartData?.map((item) => JSON.parse(item)) || [];
    }

    res.status(200).json({
      data: {
        cart_total_quantity: cartItems?.length,
      },
    });
  } catch (error) {
    console.log("Error fetching cart items:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCartItemsCount };
