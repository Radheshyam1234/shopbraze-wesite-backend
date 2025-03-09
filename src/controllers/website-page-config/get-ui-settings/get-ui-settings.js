import { WebsitePageConfig } from "../../../models/website-page-config/website-page-config.model.js";

const getUiSettings = async (req, res) => {
  try {
    const websitePageConfig = await WebsitePageConfig.findOne({
      seller: req?.seller?._id,
    });

    const ui_settings = websitePageConfig.ui_settings;
    res.status(200).json({ data: ui_settings });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getUiSettings };
