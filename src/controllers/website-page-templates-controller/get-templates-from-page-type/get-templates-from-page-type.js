import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { Collection } from "../../../models/collection/collection.model.js";
import { WebsitePageTemplate } from "../../../models/website-page-template/website-page-template.model.js";
import { WebsitePage } from "../../../models/website-page/website-page.model.js";

const getTemplatesFromPageType = async (req, res) => {
  try {
    const { page_type } = req?.params;
    if (
      ![
        "home_page",
        "product_page",
        "order_status_page",
        "featured_page",
      ].includes(page_type)
    )
      return res.status(404).json({ error: "Page not found" });

    const pageInfo = await WebsitePage.findOne({
      seller: req?.seller?._id,
      type: page_type,
    });

    if (!pageInfo) return res.status(404).json({ error: "Page not found" });

    const allTemplates = await WebsitePageTemplate.find({
      short_id: { $in: pageInfo?.template_short_ids },
    });

    const sortedTemplates = pageInfo?.template_short_ids?.map((shortId) =>
      allTemplates.find((template) => template?.short_id === shortId)
    );

    const visibleTemplates = (sortedTemplates ?? [])?.filter(
      (item) => item?.is_visible
    );

    // To return 10 products of each collection that are going to be render on home_page
    let collectionMappedCatalogues = {};
    if (page_type === "home_page" || page_type === "product_page") {
      collectionMappedCatalogues = await getCollectionMappedProducts(
        visibleTemplates
      );
    }

    res.status(200).json({
      data: {
        templates: visibleTemplates,
        collectionMappedCatalogues,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getTemplatesFromPageType };

const getCollectionMappedProducts = async (visibleTemplates) => {
  let mappedCatalogues = {};
  let collectionIds = [];

  visibleTemplates?.forEach((template) => {
    if (
      template?.type === "product_group" &&
      template?.product_group_data?.collection_short_id
    ) {
      collectionIds.push(template?.product_group_data?.collection_short_id);
    }

    if (
      template?.type === "category_tabbed" &&
      template?.category_tabbed_data?.length
    ) {
      template.category_tabbed_data?.forEach((tab) => {
        if (tab?.collection_short_id)
          collectionIds.push(tab?.collection_short_id);
      });
    }
  });

  collectionIds = [...new Set(collectionIds)];

  const visibleCollections = (
    (await Collection.find({
      short_id: { $in: collectionIds },
    })) || []
  )?.filter((item) => item?.is_visible);

  if (visibleCollections?.length > 0) {
    await Promise.all(
      visibleCollections?.map(async (collection) => {
        const catalogues = await Catalogue.find({
          collections_to_add: collection?.short_id,
        })
          .sort({ createdAt: -1 })
          .limit(10);

        mappedCatalogues[collection.short_id] = catalogues;
      })
    );
  }

  return mappedCatalogues;
};
