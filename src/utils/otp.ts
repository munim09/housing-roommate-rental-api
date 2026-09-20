// import redis from "../lib/redis";
import { redisClient } from "../lib/redisClient";

const OTP_EXPIRY_SECONDS = 50 * 60; // 50 minutes

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOtp = async (email: string, otp: string): Promise<void> => {
    const key = `otp:${email}`;
    // await redis.set(key, otp, "EX", OTP_EXPIRY_SECONDS);
    await redisClient.set(key, otp, {
        expiration: {
            type: "EX",
            value: OTP_EXPIRY_SECONDS,
        },
    });
};

const storeOTPbyRedisClient = async (
    email: string,
    otp: string,
): Promise<void> => {
    const key = `otp:${email}`;
    await redisClient.set(key, otp, {
        expiration: {
            type: "EX",
            value: OTP_EXPIRY_SECONDS,
        },
    });
};

const getOtp = async (email: string): Promise<string | null> => {
    const key = `otp:${email}`;
    // return redis.get(key);
    const redisOtp = await redisClient.get(key);
    return redisOtp;
};

const getOPTbyRedisClient = async (email: string): Promise<string | null> => {
    const key = `otp:${email}`;
    const redisOtp = await redisClient.get(key);
    return redisOtp;
};

const deleteOtp = async (email: string): Promise<void> => {
    const key = `otp:${email}`;
    // await redis.del(key);
    await redisClient.del(key);
};

const deleteOTPbyRedisClient = async (email: string): Promise<void> => {
    const key = `otp:${email}`;
    await redisClient.del(key);
};

export const otpUtils = {
    generateOtp,
    storeOtp,
    getOtp,
    deleteOtp,
};
