import { WebsiteNavigationMenu } from "../../../models/website-navigation-menu/website-navigation-menu.js";

const filterVisible = (items) => {
  return items
    .filter((item) => item.is_visible)
    .map((item) => ({
      ...item?.toObject(),
      children: item.children ? filterVisible(item.children) : [],
    }));
};

const getNavigationMenuItems = async (req, res) => {
  try {
    const navigationData = await WebsiteNavigationMenu.find({
      seller: req?.seller?._id,
      parent_short_id: null,
    })
      .select("-createdAt -updatedAt -seller")
      .populate({
        path: "children",
        select: "-createdAt -updatedAt -seller",
        populate: {
          path: "children",
          select: "-createdAt -updatedAt -seller",
        },
      });

    const visibleNavigationData = filterVisible(navigationData);

    res.status(200).json({ data: visibleNavigationData || [] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { getNavigationMenuItems };
