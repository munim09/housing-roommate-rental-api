import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    limit: 100, // Maximum 100 requests per IP
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});
