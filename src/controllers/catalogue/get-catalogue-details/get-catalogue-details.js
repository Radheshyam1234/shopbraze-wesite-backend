import { Catalogue } from "../../../models/catalogue/catalogue.model.js";
import { SizeChart } from "../../../models/size-chart/size-chart.model.js";

const getCatalogueDetails = async (req, res) => {
  try {
    const { catalogue_id } = req?.params;
    const catalogue = await Catalogue.findOne({
      product_short_id: catalogue_id,
    })
      .select("-size_charts")
      .populate({
        path: "active_size_chart_id",
        model: "SizeChart",
        select: "-_id -name -product_short_ids -seller -createdAt -updatedAt",
      });

    if (!catalogue)
      return res.status(404).json({ error: "Catalogue Not Found" });

    res.status(200).json({
      data: {
        catalogue,
        templates: [],
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getCatalogueDetails };
