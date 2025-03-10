import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Collection } from "../../../models/collection/collection.model.js";

export const getCollectionCatalogues = async (req, res) => {
  try {
    const { collection_id } = req?.params;

    const collection = await Collection.findOne({ short_id: collection_id });
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const catalogues = await Catalogue.find({
      collections_to_add: collection_id,
    });

    return res.status(200).json({
      data: {
        collection,
        catalogues,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.messsage });
  }
};
