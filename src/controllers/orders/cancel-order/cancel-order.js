import { Coupon } from "../../../models/coupon/coupon.model.js";
import { Order } from "../../../models/order/order.model.js";
import { calculateBillDetailsByProductsData } from "../../../utils/calculate-bill-details-by-products-data.js";

const cancelOrderByOrderItemId = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const { cancellation_reason, customer_remarks } = req.body;

    const order = await Order.findOne({
      "products.order_item_id": orderItemId,
      seller: req?.seller?._id,
      customer: req?.customer?._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order item not found" });
    }

    const productIndex = order.products.findIndex(
      (item) => item.order_item_id === orderItemId
    );

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    order.products[productIndex].status_history.push({
      status: "cancelled",
      timestamp: new Date(),
    });

    order.products[productIndex].cancellation_reason = cancellation_reason;
    order.products[productIndex].customer_remarks = customer_remarks;

    // Recalculate the bill and update the bill details

    if (order.source === "cart") {
      const activeProducts = order.products.filter(
        (p) => p.order_item_id !== orderItemId
      );

      if (activeProducts.length > 0) {
        const { bill_details, appliedCouponId } =
          await calculateBillDetailsByProductsData(
            activeProducts?.map((item) => ({
              catalogue_id: item?.customer_product_short_id,
              sku_id: item?.customer_sku_short_id,
              quantity: item?.quantity_to_buy,
            })),
            req?.seller?._id
          );

        let couponDetails = null;
        if (appliedCouponId) {
          const coupon = await Coupon.findOne({
            short_id: appliedCouponId,
          }).lean();
          if (coupon) {
            couponDetails = {
              short_id: coupon.short_id,
              code: coupon.code,
              title: coupon.title,
              discount_type: coupon.discount_type,
              discount_amount_applied: bill_details?.coupon_discount,
            };
          }
        }

        order.bill_details = bill_details;
        order.coupon_details = couponDetails;

        await order.save();
      }
    }

    await order.save();

    res
      .status(200)
      .json({ message: "Order item has been cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelOrderByOrderItemId:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { cancelOrderByOrderItemId };
