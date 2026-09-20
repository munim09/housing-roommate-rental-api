import Redis from "ioredis";
import config from "../config";

const redis = new Redis({
    password: config.REDIS_PASSWORD,
    host: config.REDIS_HOST,
    port: Number(config.REDIS_PORT),
});

redis.on("connect", () => {
    console.log("Redis connected");
});

redis.on("error", (err) => {
    console.error("Redis connection error:", err);
});

// export default redis;

// export const redisClient = createClient({
// 	username: config.redis_user,
// 	password: config.redis_password,
// 	socket: {
// 		host: config.redis_host,
// 		port: Number(config.redis_port),
// 	},
// });
