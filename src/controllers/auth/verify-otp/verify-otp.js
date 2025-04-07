import { redis } from "../../../configurations/redis/index.js";
import { Customer } from "../../../models/user/customer.model.js";
import jwt from "jsonwebtoken";

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const cachedOtp = await redis.get(`otp:${phone}`);
    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await redis.del(`otp:${phone}`);

    let customer = await Customer.findOne({ phone }).select(
      "-createdAt -updatedAt"
    );
    if (!customer) {
      customer = await Customer.create({ phone });
    }

    const sessionToken = jwt.sign(
      { customerId: customer._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    await redis.set(
      `session:${sessionToken}`,
      customer._id.toString(),
      "EX",
      60 * 60 * 24 * 30
    ); // 30 days

    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: process.env.NODE_ENV !== "development" ? "None" : "Strict",
      maxAge: 60 * 60 * 24 * 30 * 1000,
    });

    return res.status(200).json({ message: "Verified", customer });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { verifyOtp };
