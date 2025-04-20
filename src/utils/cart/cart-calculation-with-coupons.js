export const cartCalculationWithCoupons = (cartItemsDetails, couponsData) => {
  const cart_total_mrp = cartItemsDetails?.reduce(
    (priceSum, item) => (priceSum += item?.mrp * item?.quantity_in_cart),
    0
  );
  const cart_total_raw_price = cartItemsDetails?.reduce(
    (priceSum, item) =>
      (priceSum += item?.selling_price * item?.quantity_in_cart),
    0
  );
  let cart_total_final_price = cart_total_raw_price; // just for initialize final price value (will get updated if coupon appiled)

  const cartItemsShortIds = cartItemsDetails?.map(
    (item) => item?.product_short_id
  );

  const eligibleCouponsFromGloballyVisibleCoupons = couponsData?.filter(
    (coupon) =>
      coupon?.globally_visible &&
      coupon?.min_order_value <= cart_total_raw_price &&
      new Date(coupon?.expires_at) > new Date()
  );

  const eligibleCouponsFromSpecificProductsCoupons = couponsData?.filter(
    (coupon) =>
      cartItemsShortIds?.every((itemShortId) =>
        coupon?.product_ids?.includes(itemShortId)
      ) && new Date(coupon?.expires_at) > new Date()
  );

  let max_discount = 0;
  let appliedCouponId = "";

  const allEligibleCoupons = [
    ...eligibleCouponsFromGloballyVisibleCoupons,
    ...eligibleCouponsFromSpecificProductsCoupons,
  ];

  allEligibleCoupons?.map((coupon) => {
    let discountFromThisCoupon = 0;
    if (coupon?.discount_type === "fixed")
      discountFromThisCoupon = coupon?.discount;
    else if (coupon?.discount_type === "percentage") {
      discountFromThisCoupon = Number(
        cart_total_raw_price * (1 - (coupon?.discount / 100).toFixed(2))
      );
      if (coupon?.max_discount < discountFromThisCoupon)
        discountFromThisCoupon = coupon.max_discount;
    }
    if (discountFromThisCoupon > max_discount) {
      max_discount = discountFromThisCoupon;
      appliedCouponId = coupon?.short_id;
    }
  });

  cart_total_final_price = (
    Number(cart_total_raw_price) - Number(max_discount)
  ).toFixed(0);

  const allEligibleCouponsIds = allEligibleCoupons?.map(
    (coupon) => coupon?.short_id
  );

  /*-----------For Sale Discount and cart_items_total calculation------------------ */

  const sale_discount_percentage = 50;

  const cart_items_total = cartItemsDetails?.reduce(
    (priceSum, item) =>
      (priceSum +=
        item?.selling_price *
        item?.quantity_in_cart *
        (100 / sale_discount_percentage)),
    0
  );

  const sale_discount_value = Number(
    (cart_items_total * (1 - sale_discount_percentage / 100)).toFixed(0)
  );

  /*--------------------------------------------------------------------------- */

  return {
    bag_savings_text:
      max_discount > 0 ? `Saving ₹${max_discount.toFixed(0)}` : "",
    cart_total_mrp,
    cart_items_total,
    cart_total_price: cart_total_final_price,
    allEligibleCouponsIds,
    appliedCouponId,
    coupon_discount: max_discount,
    sale_discount_value,
  };
};
