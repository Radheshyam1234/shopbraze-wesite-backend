import { redis } from "../../../configurations/redis/index.js";
import axios from "axios";

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // await redis.set(`otp:${phone}`, otp, "EX", 600); // expires in 10 mins

    await redis.set(`otp:${phone}`, otp, {
      EX: 600, // Expiry in 10 mins
    });

    // WhatsApp API config
    const phoneNumberId = "662429000287183";
    const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;

    const headers = {
      // Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      Authorization: `Bearer EAAJXc0JrXVUBOzyvvsO12gcmBCFhP8gfgvDRWg2hBbKTDap32HOZCPHhJj0n6uEFTVYyQ2hUcMcMomchPW70RvEBtZBJnLUV7BZADAfFBdoZBm55jXxAPhAxECmBdwtvHZCuKYWPSIGNP8iWnHQlcEasOVFHzYfTUiX55jNHZCkl5scAnxZCFLVpLmHHwHKuZASbrwZDZD`,
      "Content-Type": "application/json",
    };

    const body = {
      messaging_product: "whatsapp",
      to: `91${phone}`,
      type: "template",
      template: {
        name: "account_otp_verification",
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    };

    const response = await axios.post(url, body, { headers });
    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.error("Failed to send OTP", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export { sendOtp };
