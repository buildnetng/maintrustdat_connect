// import { createClient } from "redis";

// const REDIS_URL = process.env.REDIS_URL!;
// console.log(REDIS_URL)

// let redisClient: ReturnType<typeof createClient> | null = null;

// export function getRedis() {
//   if (!redisClient) {
//     redisClient = createClient({
//       url: REDIS_URL,
//     });

//     redisClient.on("error", (err) => {
//       console.error("Redis Client Error", err);
//     });

//     redisClient.connect().catch(console.error);
//   }

//   return redisClient;
// }

// //  redis.set("rediskey","key",{})



import dns from "dns";
import { createClient } from "redis";

dns.setDefaultResultOrder("ipv4first");

const REDIS_URL = process.env.REDIS_URL!;
console.log(process.env.REDIS_URL,"REDIS_URL");
let redisClient: ReturnType<typeof createClient> | null = null;

export function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: REDIS_URL,

      pingInterval: 10000,

      socket: {
        connectTimeout: 10000,

        reconnectStrategy(retries) {
          console.log("Redis retry:", retries);

          return Math.min(retries * 500, 5000);
        },
      },
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    redisClient.on("ready", () => {
      console.log("Redis ready");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting");
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    redisClient.connect().catch(console.error);
  }

  return redisClient;
}