import { nanoid } from "nanoid";

const verifyCustomer = async (req, res, next) => {
  try {
    let visitorId = req.cookies?.visitor_id;

    if (!visitorId) {
      visitorId = nanoid(40);
      res.cookie("visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development" ? false : true,
        sameSite: process.env.NODE_ENV === "development" ? "Strict" : "None",
        maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
      });
    }

    req.visitorId = visitorId;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export { verifyCustomer };
