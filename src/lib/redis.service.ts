import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL!;
console.log(REDIS_URL)

let redisClient: ReturnType<typeof createClient> | null = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    redisClient.connect().catch(console.error);
  }

  return redisClient;
}

//  redis.set("rediskey","key",{})