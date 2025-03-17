import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: "redis-18902.crce179.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 18902,
  },
  username: "default",
  password: "SfhfAJbbAA0MEd1K2QSWkPYyrYAOweV5",
});

redis.on("error", (err) => console.error("❌ Redis Error:", err));

const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("🚀 Redis connected successfully");
  }
};

export { redis, connectRedis };
