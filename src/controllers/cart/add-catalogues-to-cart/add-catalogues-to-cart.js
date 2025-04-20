import { redis } from "../../../configurations/redis/index.js";
import { CustomerCart } from "../../../models/cart/cart.model.js";

const addCataloguesToCart = async (req, res) => {
  try {
    const visitorId = req?.visitorId;
    const customerId = req?.customer?._id;

    const { catalogue_id, sku_id, addCount, remove_catalogue } =
      req?.body?.data;

    if (!visitorId && !customerId) {
      return res
        .status(400)
        .json({ error: "visitorId or customerId is required" });
    }

    if (!catalogue_id || !sku_id || (!remove_catalogue && !addCount)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /*-----------------------------Logged-in User (MongoDB) ---------------------------*/
    if (customerId) {
      let customerCart = await CustomerCart.findOne({
        customer: customerId,
        seller: req?.seller?._id,
      });

      if (!customerCart) {
        customerCart = new CustomerCart({
          customer: customerId,
          seller: req?.seller?._id,
          items: [],
        });
      }

      let updatedItems = customerCart.items || [];

      if (remove_catalogue) {
        updatedItems = updatedItems.filter(
          (item) =>
            !(
              item?.sku_id?.toString() === sku_id &&
              item?.catalogue_id?.toString() === catalogue_id
            )
        );
      } else {
        const existingItemIndex = updatedItems.findIndex(
          (item) =>
            item?.catalogue_id?.toString() === catalogue_id &&
            item?.sku_id?.toString() === sku_id
        );

        if (existingItemIndex !== -1) {
          updatedItems[existingItemIndex].count += addCount;
        } else {
          updatedItems.push({ catalogue_id, sku_id, count: addCount });
        }
      }

      customerCart.items = updatedItems;
      await customerCart.save();

      return res
        .status(200)
        .json({ message: "Cart updated successfully (Customer)" });
    }

    /*-----------------------------Guest User (Redis) ---------------------------*/

    const cartKey = `cart:${visitorId}`;
    const cartItems = await redis.lRange(cartKey, 0, -1);
    let updatedCart = cartItems?.map((item) => JSON.parse(item)) || [];

    if (remove_catalogue) {
      updatedCart = updatedCart.filter(
        (item) =>
          !(item?.sku_id === sku_id && item?.catalogue_id === catalogue_id)
      );
    } else {
      const existingItemIndex = updatedCart.findIndex(
        (item) => item?.catalogue_id === catalogue_id && item?.sku_id === sku_id
      );

      if (existingItemIndex !== -1) {
        updatedCart[existingItemIndex].count += addCount;
      } else {
        updatedCart.push({ catalogue_id, sku_id, count: addCount });
      }
    }

    await redis.del(cartKey);
    await redis.rPush(
      cartKey,
      updatedCart.map((item) => JSON.stringify(item))
    );
    await redis.expire(cartKey, 60 * 60 * 24 * 7); // Set 7-day expiry

    return res
      .status(200)
      .json({ message: "Cart updated successfully (Guest)" });
  } catch (error) {
    console.error("Error adding items to cart:", error);
    res.status(500).json({ error: error?.message || "Internal Server Error" });
  }
};

export { addCataloguesToCart };

// import { redis } from "../../../configurations/redis/index.js";

// const addCataloguesToCart = async (req, res) => {
//   try {
//     const visitorId = req?.visitorId;
//     const { catalogue_id, sku_id, addCount, remove_catalogue } =
//       req?.body?.data;

//     if (!visitorId) {
//       return res.status(400).json({ error: "visitorId is required" });
//     }

//     if (!catalogue_id || !sku_id || (!remove_catalogue && !addCount)) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const cartKey = `cart:${visitorId}`;
//     const cartItems = await redis.lRange(cartKey, 0, -1);
//     let updatedCart = cartItems?.map((item) => JSON.parse(item)) || [];

//     if (remove_catalogue) {
//       updatedCart = updatedCart?.filter(
//         (item) =>
//           !(item?.sku_id === sku_id && item?.catalogue_id === catalogue_id)
//       );
//     } else {
//       const existingItemIndex = updatedCart.findIndex(
//         (item) => item?.catalogue_id === catalogue_id && item?.sku_id === sku_id
//       );

//       if (existingItemIndex !== -1) {
//         updatedCart[existingItemIndex].count += addCount;
//       } else {
//         updatedCart.push({ catalogue_id, sku_id, count: addCount });
//       }
//     }

//     await redis.del(cartKey);
//     await redis.rPush(
//       cartKey,
//       updatedCart?.map((item) => JSON.stringify(item))
//     );
//     await redis.expire(cartKey, 60 * 60 * 24 * 7); // Set 7-day expiry

//     return res.status(200).json({ message: "Cart updated successfully" });
//   } catch (error) {
//     console.error("Error adding items to cart:", error);
//     res.status(500).json({ error: error?.message || "Internal Server Error" });
//   }
// };

// export { addCataloguesToCart };
