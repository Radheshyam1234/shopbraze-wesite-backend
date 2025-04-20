import { Order } from "../../../models/order/order.model.js";

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
