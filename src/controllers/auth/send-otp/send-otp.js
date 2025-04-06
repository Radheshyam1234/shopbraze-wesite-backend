import { redis } from "../../../configurations/redis/index.js";

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(`otp:${phone}`, otp, "EX", 300); // expires in 5 mins

    console.log("OTP sent:", otp);

    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error?.message });
  }
};

export { sendOtp };
