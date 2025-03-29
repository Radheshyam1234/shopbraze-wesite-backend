import { Catalogue } from "../../models/catalogue/catalogue.model.js";

export const getCartItemDetails = async (cartItems) => {
  return await Promise.all(
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
};
