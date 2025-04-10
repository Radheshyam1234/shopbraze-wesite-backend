import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Coupon } from "../../../models/coupon/coupon.model.js";
import { buyNowCalculationWithCoupons } from "../../../utils/buy-now/buy-now-calculation-with-coupons.js";

const getBuyNowCheckoutDetails = async (req, res) => {
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
    const couponsData = await Coupon.find({ seller: req?.seller?._id });
    const { applied_coupon_discount_value } = buyNowCalculationWithCoupons({
      product_id,
      raw_bill_amount,
      couponsData,
    });

    const final_bill_amount =
      Number(items_total_price) -
      Number(sale_discount_value) -
      Number(applied_coupon_discount_value);

    const bill_details = {
      title: "Bill Details",
      sub_title: `Yay! your total discount is ₹${
        Number(total_mrp) - Number(final_bill_amount)
      }`,
      entities: [
        { key: "Items", value: 1 },
        {
          key: "Item total",
          value: `₹${items_total_price?.toLocaleString("en-IN")}`,
        },
        {
          key: "Sale Discount",
          value: `-₹${sale_discount_value?.toLocaleString("en-IN")}`,
        },
        ...(applied_coupon_discount_value > 0
          ? [
              {
                key: "Coupon Discount",
                value: `-₹${applied_coupon_discount_value?.toLocaleString(
                  "en-IN"
                )}`,
              },
            ]
          : []),
        { key: "Delivery fee", value: `₹0` },
        {
          key: "Total amount",
          value: `₹${final_bill_amount?.toLocaleString("en-IN")}`,
        },
      ],
    };

    const checkoutDetails = {
      products: [product_details],
      bill_details,
    };

    res.status(200).json({ data: checkoutDetails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getBuyNowCheckoutDetails };
