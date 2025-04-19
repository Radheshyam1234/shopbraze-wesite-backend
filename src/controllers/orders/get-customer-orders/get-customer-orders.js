import { Order } from "../../../models/order/order.model.js";

const getCustomerOrders = async (req, res) => {
  try {
    const ordersData = await Order.find({
      customer: req?.customer?._id,
      seller: req?.seller?._id,
    });

    const sale_discount_percentage = 50;

    const flattenedOrders = ordersData.reduce((acc, order) => {
      order.products.forEach((product) => {
        acc.push({
          // customer: order.customer,
          // seller: order.seller,
          order_date: order?.createdAt,
          customer_details: order?.customer_details,
          payment_mode: order.payment_mode,
          order_item_id: product.order_item_id,
          product_name: product.product_name,
          product_image: product.product_image,
          customer_product_short_id: product.customer_product_short_id,
          customer_sku_short_id: product.customer_sku_short_id,
          size: product.size,
          quantity_to_buy: product.quantity_to_buy,
          mrp: product.mrp,
          selling_price_per_unit: product.selling_price_per_unit,
          effective_price: product.effective_price,
          item_total:
            product.effective_price * (100 / sale_discount_percentage),
          cancellation_reason: product.cancellation_reason,
          customer_remarks: product.customer_remarks,
          current_order_status:
            product.status_history?.[product.status_history?.length - 1],
        });
      });
      return acc;
    }, []);

    res.status(200).json({ data: flattenedOrders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

const getOrderDetailsByOrderItemId = async (req, res) => {
  try {
    const { orderItemId } = req?.params;

    const order = await Order.findOne({
      "products.order_item_id": orderItemId,
      seller: req?.seller?._id,
      customer: req?.customer?._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order item not found" });
    }

    const product = order.products.find(
      (item) => item.order_item_id === orderItemId
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const sale_discount_percentage = 50;

    const orderDetails = {
      order_date: order?.createdAt,
      customer_details: order.customer_details,
      payment_mode: order.payment_mode,
      order_item_id: product.order_item_id,
      product_name: product.product_name,
      product_image: product.product_image,
      customer_product_short_id: product.customer_product_short_id,
      customer_sku_short_id: product.customer_sku_short_id,
      size: product.size,
      quantity_to_buy: product.quantity_to_buy,
      mrp: product.mrp,
      selling_price_per_unit: product.selling_price_per_unit,
      effective_price: product.effective_price,
      item_total: product.effective_price * (100 / sale_discount_percentage),
      current_order_status:
        product.status_history?.[product.status_history?.length - 1],
    };

    res.status(200).json({ data: orderDetails });
  } catch (error) {
    console.error("Error in getOrderDetailsByOrderItemId:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCustomerOrders, getOrderDetailsByOrderItemId };
