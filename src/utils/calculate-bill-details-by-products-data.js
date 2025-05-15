import { Catalogue } from "../models/catalogue/catalogue.model.js";
import { Coupon } from "../models/coupon/coupon.model.js";

export const calculateBillDetailsByProductsData = async (
  products,
  sellerId
) => {
  const orderItemsDetails = await getOrderProductDetails(products);

  const couponsData = await Coupon.find({ seller: sellerId });

  const {
    order_items_total,
    order_total_price,
    coupon_discount,
    sale_discount_value,
    appliedCouponId,
    order_total_mrp,
  } = orderCalculationWithCoupons(orderItemsDetails, couponsData);

  // Format products details
  const product_details = orderItemsDetails?.map((item) => ({
    customer_product_short_id: item.product_short_id,
    customer_sku_short_id: item.sku_data?.short_id,
    size: item.size,
    product_name: item.title,
    product_image: item.images?.[0]?.url || null,
    quantity_to_buy: item.quantity,
    mrp: Number(item.mrp * item?.quantity),
    selling_price_per_unit: Number(item.selling_price),
    effective_price: Number(item.selling_price) * Number(item.quantity),
  }));

  // Format bill details
  const bill_details = {
    items: orderItemsDetails.length,
    item_total: order_items_total,
    sale_discount: sale_discount_value,
    coupon_discount: coupon_discount,
    delivery_fee: 0,
    total_amount: order_total_price,
    total_mrp: order_total_mrp,
  };

  return {
    products: product_details,
    bill_details,
    appliedCouponId,
  };
};

const getOrderProductDetails = async (products) => {
  return await Promise.all(
    products?.map(async (product) => {
      const catalogueDetails = await Catalogue.findOne({
        product_short_id: product?.catalogue_id,
      }).lean();
      if (!catalogueDetails) return {};

      const sku_detail = catalogueDetails.customer_skus?.find(
        (sku) => sku?.short_id === product?.sku_id
      );

      return {
        title: catalogueDetails.title,
        // description: catalogueDetails.description,
        color: catalogueDetails.color,
        product_short_id: catalogueDetails.product_short_id,
        images: catalogueDetails.media?.images,
        quantity: product?.quantity,
        size: sku_detail?.size,
        mrp: sku_detail?.mrp,
        selling_price: sku_detail?.selling_price,
        effective_price: sku_detail?.selling_price,
        sku_data: {
          mrp: sku_detail?.mrp,
          selling_price: sku_detail?.selling_price,
          short_id: sku_detail?.short_id,
        },
      };
    })
  );
};

export const orderCalculationWithCoupons = (orderItemsDetails, couponsData) => {
  const order_total_mrp = orderItemsDetails?.reduce(
    (priceSum, item) => (priceSum += item?.mrp * item?.quantity),
    0
  );
  const order_total_raw_price = orderItemsDetails?.reduce(
    (priceSum, item) => (priceSum += item?.selling_price * item?.quantity),
    0
  );
  let order_total_final_price = order_total_raw_price; // just for initialize final price value (will get updated if coupon appiled)

  const orderItemsShortIds = orderItemsDetails?.map(
    (item) => item?.product_short_id
  );

  const eligibleCouponsFromGloballyVisibleCoupons = couponsData?.filter(
    (coupon) =>
      coupon?.globally_visible &&
      coupon?.min_order_value <= order_total_raw_price &&
      new Date(coupon?.expires_at) > new Date()
  );

  const eligibleCouponsFromSpecificProductsCoupons = couponsData?.filter(
    (coupon) =>
      orderItemsShortIds?.every((itemShortId) =>
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
        order_total_raw_price * (1 - (coupon?.discount / 100).toFixed(2))
      );
      if (coupon?.max_discount < discountFromThisCoupon)
        discountFromThisCoupon = coupon.max_discount;
    }
    if (discountFromThisCoupon > max_discount) {
      max_discount = discountFromThisCoupon;
      appliedCouponId = coupon?.short_id;
    }
  });

  order_total_final_price = (
    Number(order_total_raw_price) - Number(max_discount)
  ).toFixed(0);

  const allEligibleCouponsIds = allEligibleCoupons?.map(
    (coupon) => coupon?.short_id
  );

  /*-----------For Sale Discount and order_items_total calculation------------------ */

  const sale_discount_percentage = 50;

  const order_items_total = orderItemsDetails?.reduce(
    (priceSum, item) =>
      (priceSum +=
        item?.selling_price *
        item?.quantity *
        (100 / sale_discount_percentage)),
    0
  );

  const sale_discount_value = Number(
    (order_items_total * (1 - sale_discount_percentage / 100)).toFixed(0)
  );

  /*--------------------------------------------------------------------------- */

  return {
    bag_savings_text:
      max_discount > 0 ? `Saving ₹${max_discount.toFixed(0)}` : "",
    order_total_mrp,
    order_items_total,
    order_total_price: order_total_final_price,
    allEligibleCouponsIds,
    appliedCouponId,
    coupon_discount: max_discount,
    sale_discount_value,
  };
};
