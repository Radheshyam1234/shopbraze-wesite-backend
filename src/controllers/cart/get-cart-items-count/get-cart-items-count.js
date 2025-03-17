import { redis } from "../../../configurations/redis/index.js";

const getCartItemsCount = async (req, res) => {
  try {
    const visitorId = req?.visitorId;

    const cartKey = `cart:${visitorId}`;
    const cartData = await redis.lRange(cartKey, 0, -1);

    const cartItems = cartData?.map((item) => JSON.parse(item)) || [];
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
