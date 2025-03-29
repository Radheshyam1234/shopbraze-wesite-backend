import { redis } from "../../../configurations/redis/index.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";
import { cartCalculationWithCoupons } from "../../../utils/cart/cart-calculation-with-coupons.js";
import { getCartItemDetails } from "../../../utils/cart/get-cart-item-details.js";

const getCartPageCouponsAndOffers = async (req, res) => {
  try {
    const visitorId = req?.visitorId;
    const cartKey = `cart:${visitorId}`;
    const cartData = await redis.lRange(cartKey, 0, -1);

    const cartItems = cartData?.map((item) => JSON.parse(item)) || [];
    const cartItemsDetails = await getCartItemDetails(cartItems);

    const couponsData = await Coupon.find({ seller: req?.seller?._id }).lean();

    const { allEligibleCouponsIds, appliedCouponId } =
      cartCalculationWithCoupons(cartItemsDetails, couponsData);

    const couponsResponseData = couponsData?.map((coupon) => {
      return {
        title: coupon?.title,
        code: coupon?.code,
        short_id: coupon?.short_id,
        min_order_value: coupon?.min_order_value,
        discount: coupon?.discount,
        discount_type: coupon?.discount_type,
        max_discount: coupon?.max_discount,
        only_for_new_customer: coupon?.only_for_new_customer,
        is_eligible: allEligibleCouponsIds?.includes(coupon?.short_id),
        is_applied: appliedCouponId === coupon?.short_id,
        valid_for_selected_products:
          coupon?.product_ids?.length > 0 ? true : false,
      };
    });

    res.status(200).json({ data: { coupons: couponsResponseData } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCartPageCouponsAndOffers };
