import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { SignOptions } from "jsonwebtoken";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import { otpUtils } from "../../utils/otp";
import sendEmail from "../../utils/sendEmail";

const login = async (payload: { email: string; password: string }) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid email or password",
        );
    }

    const isPasswordValid = await bcrypt.compare(
        payload.password,
        user.password,
    );

    if (!isPasswordValid) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid email or password",
        );
    }

    if (!user.emailVerified) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Email not verified. Please verify your email first.",
        );
    }

    if (user.status === UserStatus.SUSPENDED) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Your account has been suspended. Please contact support.",
        );
    }

    if (user.status === UserStatus.REJECTED) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "Your account has been rejected. Please contact support.",
        );
    }

    const jwtPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_ACCESS_EXPIRES_IN as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_REFRESH_SECRET as string,
        config.JWT_REFRESH_EXPIRES_IN as SignOptions,
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
        },
    };
};

const register = async (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
}) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (payload.role == Role.ADMIN) {
        throw new AppError(httpStatus.FORBIDDEN, "Invalid role");
    }

    if (existingUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
    }

    const saltRounds = Number(config.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(payload.password, saltRounds);

    const otp = otpUtils.generateOtp();

    await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: payload.role as any,
            phone: payload.phone || null,
            status: "PENDING_APPROVAL",
        },
    });

    await otpUtils.storeOtp(payload.email, otp);

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Housing & Roommate Platform</h2>
        <p>Hi ${payload.name},</p>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in <strong>50 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
    </div>
    `;

    await sendEmail(
        payload.email,
        "Verify Your Email - Housing Platform",
        emailHtml,
    );

    return {
        message: "Registration successful. OTP sent to your email.",
        email: payload.email,
    };
};

const verify = async (payload: { email: string; otp: string }) => {
    const storedOtp = await otpUtils.getOtp(payload.email);

    if (!storedOtp) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "OTP has expired or was not requested",
        );
    }

    if (storedOtp !== payload.otp) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    const user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.emailVerified) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already verified");
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
        });

        if (user.role === Role.OWNER) {
            await tx.ownerProfile.create({ data: { userId: user.id } });
        } else if (user.role === Role.MANAGER) {
            await tx.managerProfile.create({ data: { userId: user.id } });
        } else if (user.role === Role.TENANT) {
            await tx.tenantProfile.create({ data: { userId: user.id } });
        }
    });

    await otpUtils.deleteOtp(payload.email);

    return { message: "Email verified successfully. Profile created." };
};

const updateProfile = async (
    userId: string,
    payload: { nid?: string; address?: string; occupation?: string },
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role == Role.OWNER) {
        await prisma.ownerProfile.update({
            where: { userId },
            data: {
                nid: payload.nid,
                address: payload.address,
                occupation: payload.occupation,
            },
        });
    } else if (user.role === Role.MANAGER) {
        await prisma.managerProfile.update({
            where: { userId },
            data: {
                nid: payload.nid,
                address: payload.address,
                occupation: payload.occupation,
            },
        });
    } else if (user.role === Role.TENANT) {
        await prisma.$transaction(async (tx) => {
            await tx.tenantProfile.update({
                where: { userId },
                data: {
                    nid: payload.nid,
                    address: payload.address,
                    occupation: payload.occupation,
                },
            });
            await tx.user.update({
                where: { id: userId },
                data: { status: "ACTIVE" },
            });
        });
    }

    return { message: "Profile updated successfully" };
};

export const AuthService = {
    login,
    register,
    verify,
    updateProfile,
};
