import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";
import { buyNowCalculationWithCoupons } from "../../../utils/buy-now/buy-now-calculation-with-coupons.js";

const getBuyNowPageOffersAndCoupons = async (req, res) => {
  try {
    const { product_id, quantity, sku_id } = req?.query;

    const selectedProductDetails = await Catalogue?.findOne({
      product_short_id: product_id,
    }).lean();

    if (!selectedProductDetails)
      return res.status(404).json({ error: "Product not found" });

    const selectedSkuDetails = selectedProductDetails?.customer_skus?.find(
      (sku) => sku?.short_id === sku_id
    );

    if (!selectedSkuDetails)
      return res.status(404).json({ error: "Sku not found" });

    const sale_discount_percentage = 50;

    const items_total_price = (
      Number(selectedSkuDetails?.selling_price) *
      Number(quantity) *
      (100 / sale_discount_percentage)
    ).toFixed(0);

    const sale_discount_value = (
      items_total_price *
      (1 - sale_discount_percentage / 100)
    ).toFixed(0);

    const raw_bill_amount =
      Number(items_total_price) - Number(sale_discount_value);

    // Get Coupon Discount Details
    const couponsData = await Coupon.find({ seller: req?.seller?._id });
    const { allEligibleCouponsIds, appliedCouponId } =
      buyNowCalculationWithCoupons({
        product_id,
        raw_bill_amount,
        couponsData,
      });

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

export { getBuyNowPageOffersAndCoupons };
