import { Seller } from "../models/user/seller.model.js";

const verifySeller = async (req, res, next) => {
  try {
    const hostname = req?.hostname;

    // Extract subdomain (assuming format: seller.shopbraze.in)
    const subdomain = hostname?.split(".")[0];

    if (!subdomain || subdomain === "www") {
      return res
        .status(400)
        .json({ message: "Invalid request: No seller detected" });
    }

    // Find seller by subdomain
    const seller = await Seller.findOne({ preferred_web_prefix: "ram" });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    req.seller = seller;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export { verifySeller };
