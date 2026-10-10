// import { createClient } from "redis";
// import config from "../config";

// export const redisClient = createClient({
//     username: config.REDIS_USER,
//     password: config.REDIS_PASSWORD,
//     socket: {
//         host: config.REDIS_HOST,
//         port: Number(config.REDIS_PORT),
//     },
// });

import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
    username: config.REDIS_USER,
    password: config.REDIS_PASSWORD,
    socket: {
        host: config.REDIS_HOST,
        port: Number(config.REDIS_PORT),

        // Reconnect automatically after a connection failure.
        reconnectStrategy: (retries, cause) => {
            if (retries > 10) {
                console.error(
                    "Redis: Maximum reconnection attempts reached.",
                    cause.message,
                );

                // Stop automatic retries after 10 attempts.
                return new Error("Redis reconnection limit reached");
            }

            // Exponential backoff, capped at 5 seconds.
            const delay = Math.min(250 * 2 ** retries, 5000);

            console.warn(
                `Redis reconnecting in ${delay}ms (attempt ${retries + 1})`,
            );

            return delay;
        },

        connectTimeout: 15000,
    },
});

// IMPORTANT: Handle the EventEmitter error event.
redisClient.on("error", (error) => {
    console.error("Redis client error:", error.message);
});

redisClient.on("reconnecting", () => {
    console.warn("Redis reconnecting...");
});

redisClient.on("ready", () => {
    console.log("Redis is ready.");
});

redisClient.on("end", () => {
    console.warn("Redis connection closed.");
});
