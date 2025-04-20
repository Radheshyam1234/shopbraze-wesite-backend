import { redis } from "../../../configurations/redis/index.js";
import { CustomerCart } from "../../../models/cart/cart.model.js";
import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";
import { cartCalculationWithCoupons } from "../../../utils/cart/cart-calculation-with-coupons.js";
import { getCartItemDetails } from "../../../utils/cart/get-cart-item-details.js";

const getCustomerCartItems = async (req, res) => {
  try {
    const customer_id = req?.customer?._id;
    const visitor_id = req?.visitorId;

    if (!customer_id && !visitor_id) {
      return res.status(400).json({ error: "No user or visitor found." });
    }

    let cartItems = [];

    if (customer_id) {
      const customerCart = await CustomerCart.findOne({
        customer: customer_id,
      });
      cartItems = customerCart?.items || [];
    } else if (visitor_id) {
      const cartKey = `cart:${visitor_id}`;
      const cartData = await redis.lRange(cartKey, 0, -1);
      cartItems = cartData?.map((item) => JSON.parse(item)) || [];
    }

    const cartItemsDetails = await getCartItemDetails(cartItems);

    const couponsData = await Coupon.find({ seller: req?.seller?._id });

    const { bag_savings_text, cart_total_price } = cartCalculationWithCoupons(
      cartItemsDetails,
      couponsData
    );

    res.status(200).json({
      data: {
        bag_savings_text,
        cart_total_price,
        cart_total_quantity: cartItems?.length,
        catalogues: cartItemsDetails,
      },
    });
  } catch (error) {
    console.log("Error fetching cart items:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCustomerCartItems };
