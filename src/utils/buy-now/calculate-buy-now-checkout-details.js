import { Catalogue } from "../../models/catalogue/catalogue.model.js";
import { Coupon } from "../../models/coupon/coupon.model.js";
import { buyNowCalculationWithCoupons } from "./buy-now-calculation-with-coupons.js";

const calculateBuyNowCheckoutDetails = async ({
  product_id,
  quantity,
  sku_id,
  seller_id,
}) => {
  const selectedProductDetails = await Catalogue?.findOne({
    product_short_id: product_id,
  }).lean();

  if (quantity <= 0) {
    const error = new Error("Quantity is not valid");
    error.status = 404;
    throw error;
  }

  if (!selectedProductDetails) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  const selectedSkuDetails = selectedProductDetails?.customer_skus?.find(
    (sku) => sku?.short_id === sku_id
  );

  if (!selectedSkuDetails) {
    const error = new Error("Sku not found");
    error.status = 404;
    throw error;
  }

  const sale_discount_percentage = 50;

  /*----------------- For Product Details -------------- */

  const total_mrp = Number(selectedSkuDetails?.mrp) * Number(quantity);

  const product_details = {
    customer_product_short_id: product_id,
    customer_sku_short_id: selectedSkuDetails?.short_id,
    size: selectedSkuDetails?.size,
    product_name: selectedProductDetails?.title,
    product_image: selectedProductDetails?.media?.images?.[0]?.url,
    quantity_to_buy: quantity,
    mrp: total_mrp,
    selling_price_per_unit: Number(selectedSkuDetails?.selling_price),
    effective_price:
      Number(selectedSkuDetails?.selling_price) * Number(quantity),
  };

  /*----------------- For Bill Details -------------- */

  const items_total_price = Number(
    (
      Number(selectedSkuDetails?.selling_price) *
      Number(quantity) *
      (100 / sale_discount_percentage)
    ).toFixed(0)
  );

  const sale_discount_value = Number(
    (items_total_price * (1 - sale_discount_percentage / 100)).toFixed(0)
  );

  const raw_bill_amount =
    Number(items_total_price) - Number(sale_discount_value);

  // Get Coupon Discount Details
  const couponsData = await Coupon.find({ seller: seller_id });
  const { applied_coupon_discount_value, appliedCouponId } =
    buyNowCalculationWithCoupons({
      product_id,
      raw_bill_amount,
      couponsData,
    });

  const final_bill_amount =
    Number(items_total_price) -
    Number(sale_discount_value) -
    Number(applied_coupon_discount_value);

  const bill_details = {
    items: 1,
    item_total: items_total_price,
    sale_discount: sale_discount_value,
    coupon_discount: applied_coupon_discount_value,
    delivery_fee: 0,
    total_amount: final_bill_amount,
    total_mrp: total_mrp,
  };

  return {
    products: [product_details],
    bill_details,
    appliedCouponId,
  };
};

export { calculateBuyNowCheckoutDetails };
