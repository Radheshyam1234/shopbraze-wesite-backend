import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Collection } from "../../../models/collection/collection.model.js";

const getCatalogueFiltersForCollection = async (req, res) => {
  try {
    const { collection_id } = req?.params;

    const collection = await Collection.findOne({ short_id: collection_id });
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const [colorAggregation, sizeAggregation, priceAggregation] =
      await Promise.all([
        // Fetch distinct colors and counts
        Catalogue.aggregate([
          { $match: { collections_to_add: collection_id, color: { $ne: "" } } },
          { $group: { _id: "$color", count: { $sum: 1 } } },
          { $project: { _id: 0, value: "$_id", count: 1 } },
        ]),

        // Fetch distinct sizes from first customer_sku only
        Catalogue.aggregate([
          { $match: { collections_to_add: collection_id } },
          { $unwind: "$customer_skus" }, // Unwind to consider all SKUs
          { $group: { _id: "$customer_skus.size", count: { $sum: 1 } } },
          { $project: { _id: 0, value: "$_id", count: 1 } },
        ]),

        // Apply price range only on the first customer_sku
        Catalogue.aggregate([
          { $match: { collections_to_add: collection_id } },
          {
            $project: {
              first_sku_price: {
                $arrayElemAt: ["$customer_skus.selling_price", 0],
              },
            },
          },
          {
            $bucket: {
              groupBy: "$first_sku_price",
              boundaries: [
                0,
                200,
                500,
                700,
                1000,
                1500,
                2000,
                2500,
                4000,
                5000,
                10000,
                Infinity,
              ],
              default: "Above 10000",
              output: { count: { $sum: 1 } },
            },
          },
          {
            $project: {
              _id: 0,
              min: "$_id",
              max: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$_id", 0] }, then: 200 },
                    { case: { $eq: ["$_id", 200] }, then: 500 },
                    { case: { $eq: ["$_id", 500] }, then: 700 },
                    { case: { $eq: ["$_id", 700] }, then: 1000 },
                    { case: { $eq: ["$_id", 1000] }, then: 1500 },
                    { case: { $eq: ["$_id", 1500] }, then: 2000 },
                    { case: { $eq: ["$_id", 2000] }, then: 2500 },
                    { case: { $eq: ["$_id", 2500] }, then: 4000 },
                    { case: { $eq: ["$_id", 4000] }, then: 5000 },
                    { case: { $eq: ["$_id", 5000] }, then: 10000 },
                    { case: { $eq: ["$_id", 10000] }, then: "Infinity" },
                  ],
                  default: "Above 10000",
                },
              },
              count: 1,
            },
          },
        ]),
      ]);

    const sort_by_options = [
      {
        value: "popularity",
        label: "Popularity",
      },
      {
        value: "price_high_to_low",
        label: "Price High to Low",
      },
      {
        value: "price_low_to_high",
        label: "Price Low to High",
      },
      {
        value: "newest",
        label: "Newest",
      },
    ];

    return res.status(200).json({
      success: true,
      data: {
        filters: {
          colors: colorAggregation,
          sizes: sizeAggregation,
          price_ranges: priceAggregation,
        },
        sort_by_options,
      },
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
};

export { getCatalogueFiltersForCollection };
