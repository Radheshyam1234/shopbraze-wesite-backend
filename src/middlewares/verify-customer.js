import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { redis } from "../configurations/redis/index.js";
import { Customer } from "../models/user/customer.model.js";

const verifyCustomer = async (req, res, next) => {
  try {
    // Ensure visitor_id cookie (always present)
    let visitorId = req.cookies?.visitor_id;
    if (!visitorId) {
      visitorId = nanoid(40);
      res.cookie("visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: process.env.NODE_ENV === "development" ? "Strict" : "None",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
    req.visitorId = visitorId;

    // Check for session_token
    const token = req.cookies?.session_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const session = await redis.get(`session:${token}`);

        if (session && session === decoded.customerId) {
          const customer = await Customer.findById(decoded.customerId).select(
            "-createdAt -updatedAt"
          );
          if (customer) {
            req.customer = customer;
          }
        }
      } catch (err) {
        console.warn("Invalid or expired session token", err.message);
        // res.clearCookie("session_token");
      }
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export { verifyCustomer };
