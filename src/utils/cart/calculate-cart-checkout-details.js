import { redis } from "../../configurations/redis/index.js";
import { CustomerCart } from "../../models/cart/cart.model.js";
import { Coupon } from "../../models/coupon/coupon.model.js";
import { cartCalculationWithCoupons } from "./cart-calculation-with-coupons.js";
import { getCartItemDetails } from "./get-cart-item-details.js";

const calculateCartCheckoutDetails = async ({
  sellerId,
  customerId,
  visitor_id,
}) => {
  let cartItems = [];

  if (sellerId && customerId) {
    const customerCart = await CustomerCart.findOne({
      customer: customerId,
      seller: sellerId,
    }).lean();

    cartItems = customerCart?.items || [];
  } else if (visitor_id) {
    const cartKey = `cart:${visitor_id}`;
    const cartData = await redis.lRange(cartKey, 0, -1);
    cartItems = cartData?.map((item) => JSON.parse(item)) || [];
  }

  if (!cartItems.length) {
    const error = new Error("Your cart is empty.");
    error.status = 400;
    throw error;
  }

  const cartItemsDetails = await getCartItemDetails(cartItems);

  const couponsData = await Coupon.find({ seller: sellerId });

  const {
    cart_items_total,
    cart_total_price,
    coupon_discount,
    sale_discount_value,
    appliedCouponId,
    cart_total_mrp,
  } = cartCalculationWithCoupons(cartItemsDetails, couponsData);

  // Format products details
  const product_details = cartItemsDetails?.map((item) => ({
    customer_product_short_id: item.product_short_id,
    customer_sku_short_id: item.sku_data?.short_id,
    size: item.size,
    product_name: item.title,
    product_image: item.images?.[0]?.url || null,
    quantity_to_buy: item.quantity_in_cart,
    mrp: Number(item.mrp * item?.quantity_in_cart),
    selling_price_per_unit: Number(item.selling_price),
    effective_price: Number(item.selling_price) * Number(item.quantity_in_cart),
  }));

  // Format bill details
  const bill_details = {
    items: cartItems.length,
    item_total: cart_items_total,
    sale_discount: sale_discount_value,
    coupon_discount: coupon_discount,
    delivery_fee: 0,
    total_amount: cart_total_price,
    total_mrp: cart_total_mrp,
  };

  return {
    products: product_details,
    bill_details,
    appliedCouponId,
  };
};

export { calculateCartCheckoutDetails };
