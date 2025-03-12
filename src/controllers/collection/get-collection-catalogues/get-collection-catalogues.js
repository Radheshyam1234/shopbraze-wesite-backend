import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Collection } from "../../../models/collection/collection.model.js";

export const getCollectionCatalogues = async (req, res) => {
  try {
    const { collection_id } = req?.params;
    const page = parseInt(req?.query?.page) || 1;
    const limit = parseInt(req?.query?.limit) || 12;
    const skip = (page - 1) * limit;

    const sortBy = req?.query?.sort_type;

    const selected_filters = req?.query?.selected_filters
      ? JSON.parse(req?.query?.selected_filters)
      : {};

    const { color = [], size = [], price_range = [] } = selected_filters;

    const collection = await Collection.findOne({ short_id: collection_id });
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    let sortQuery = {};

    if (sortBy === "price_high_to_low") {
      sortQuery["customer_skus.0.selling_price"] = -1;
    } else if (sortBy === "price_low_to_high") {
      sortQuery["customer_skus.0.selling_price"] = 1;
    } else if (sortBy === "newest") {
      sortQuery["createdAt"] = -1;
    }

    let filterQuery = { collections_to_add: collection_id };

    if (color.length > 0) {
      filterQuery.color = { $in: color };
    }
    if (size.length > 0) {
      filterQuery["customer_skus.size"] = { $in: size };
    }
    if (price_range.length > 0) {
      filterQuery["customer_skus.0.selling_price"] = {
        $gte: price_range[0].min,
        $lte: price_range[0].max,
      };
    }

    const catalogues = await Catalogue.find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const totalCatalogues = await Catalogue.countDocuments(filterQuery);

    return res.status(200).json({
      data: {
        collection,
        catalogues,
        hasMore: totalCatalogues > page * limit,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};
