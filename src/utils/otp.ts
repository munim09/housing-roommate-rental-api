import redis from "../lib/redis";

const OTP_EXPIRY_SECONDS = 50 * 60; // 50 minutes

const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOtp = async (email: string, otp: string): Promise<void> => {
    const key = `otp:${email}`;
    await redis.set(key, otp, "EX", OTP_EXPIRY_SECONDS);
};

const getOtp = async (email: string): Promise<string | null> => {
    const key = `otp:${email}`;
    return redis.get(key);
};

const deleteOtp = async (email: string): Promise<void> => {
    const key = `otp:${email}`;
    await redis.del(key);
};

export const otpUtils = {
    generateOtp,
    storeOtp,
    getOtp,
    deleteOtp,
};
