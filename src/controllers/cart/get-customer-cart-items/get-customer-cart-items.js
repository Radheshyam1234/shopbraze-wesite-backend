import { redis } from "../../../configurations/redis/index.js";
import { Catalogue } from "../../../models/catalogue/catalogue.model.js";

const getCustomerCartItems = async (req, res) => {
  try {
    const visitorId = req?.visitorId;

    const cartKey = `cart:${visitorId}`;
    const cartData = await redis.lRange(cartKey, 0, -1);

    const cartItems = cartData?.map((item) => JSON.parse(item)) || [];

    const cartItemsDetails = await Promise.all(
      cartItems?.map(async (cartItem) => {
        const catalogueDetails = await Catalogue.findOne({
          product_short_id: cartItem?.catalogue_id,
        }).lean();
        if (!catalogueDetails) return {};

        const sku_detail = catalogueDetails.customer_skus?.find(
          (sku) => sku?.short_id === cartItem?.sku_id
        );

        return {
          title: catalogueDetails.title,
          // description: catalogueDetails.description,
          color: catalogueDetails.color,
          product_short_id: catalogueDetails.product_short_id,
          images: catalogueDetails.media?.images,
          quantity_in_cart: cartItem?.count,
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

    const bag_savings_text = `Saving ₹ ${
      cartItems?.length * 300?.toLocaleString()
    }`;
    const cart_total_price = cartItemsDetails?.reduce(
      (priceSum, item) =>
        (priceSum += item?.effective_price * item?.quantity_in_cart),
      0
    );
    const cart_total_quantity = cartItems?.length;

    res.status(200).json({
      data: {
        bag_savings_text,
        cart_total_price,
        cart_total_quantity,
        catalogues: cartItemsDetails,
      },
    });
  } catch (error) {
    console.log("Error fetching cart items:", error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCustomerCartItems };
