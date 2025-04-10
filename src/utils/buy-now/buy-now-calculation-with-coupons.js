export const buyNowCalculationWithCoupons = ({
  product_id,
  raw_bill_amount,
  couponsData,
}) => {
  const eligibleCouponsFromGloballyVisibleCoupons = couponsData?.filter(
    (coupon) =>
      coupon?.globally_visible &&
      coupon?.min_order_value <= raw_bill_amount &&
      new Date(coupon?.expires_at) > new Date()
  );

  const eligibleCouponsFromSpecificProductsCoupons = couponsData?.filter(
    (coupon) =>
      coupon?.product_ids?.includes(product_id) &&
      new Date(coupon?.expires_at) > new Date()
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
        raw_bill_amount * (1 - (coupon?.discount / 100).toFixed(2))
      );
      if (coupon?.max_discount < discountFromThisCoupon)
        discountFromThisCoupon = coupon.max_discount;
    }
    if (discountFromThisCoupon > max_discount) {
      max_discount = discountFromThisCoupon;
      appliedCouponId = coupon?.short_id;
    }
  });

  const allEligibleCouponsIds = allEligibleCoupons?.map(
    (coupon) => coupon?.short_id
  );

  return {
    appliedCouponId,
    applied_coupon_discount_value: max_discount,
    allEligibleCouponsIds,
  };
};
