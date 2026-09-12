import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import { JwtPayload, SignOptions } from "jsonwebtoken";
import path from "path";
import {
    AuthProvider,
    Role,
    UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redisClient";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import { otpUtils } from "../../utils/otp";
import sendEmail from "../../utils/sendEmail";
import {
    IForgotPasswordPayload,
    IGoogleLoginPayload,
    IResetPasswordPayload,
} from "./auth.interface";

import type { TokenPayload } from "google-auth-library";

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
        user.password as string,
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
            phone: payload.phone || "",
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
        message:
            "Registration successful. OTP sent to your email. It will be valid for 50 minutes",
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

const refreshToken = async (token: string) => {
    const verifiedRefreshToken = jwtUtils.verifyToken(
        token,
        config.JWT_REFRESH_SECRET as string,
    );

    if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            config.node_env === "development"
                ? verifiedRefreshToken.error
                : "Invalid refresh token",
        );
    }

    const data = verifiedRefreshToken.data as JwtPayload;

    const user = await prisma.user.findUnique({
        where: { id: data.userId },
    });

    if (!user || !user.emailVerified || user.status !== UserStatus.ACTIVE) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "User is inactive or not found",
        );
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_ACCESS_EXPIRES_IN as SignOptions,
    );

    const refreshToken = jwtUtils.createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET as string,
        config.JWT_REFRESH_EXPIRES_IN as SignOptions,
    );

    return {
        accessToken,
        refreshToken,
    };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
    let googleIdTokenPayload: TokenPayload | null | undefined = null;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: payload.idToken,
            audience: config.google_client_id,
        });

        googleIdTokenPayload = ticket.getPayload();
    } catch (error) {
        console.log("Google ID Token Verification Failed", error);
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid Or Expired Google Id Token",
        );
    }

    if (!googleIdTokenPayload) {
        throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid Or Expired Google Id Token",
        );
    }

    if (!googleIdTokenPayload.email) {
        throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
    }
    if (!googleIdTokenPayload.name) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Google Email User Name Not Found",
        );
    }

    const ifPatientExistWithGoogleAuth = await prisma.user.findUnique({
        where: {
            email: googleIdTokenPayload.email,
            role: Role.TENANT,
            googleId: googleIdTokenPayload.sub,
        },
    });

    let user = ifPatientExistWithGoogleAuth;

    if (!ifPatientExistWithGoogleAuth) {
        const ifPatientExistWithCredentials = await prisma.user.findUnique({
            where: {
                email: googleIdTokenPayload.email,
                role: Role.TENANT,
                authProvider: AuthProvider.CREDENTIAL,
            },
        });

        if (ifPatientExistWithCredentials) {
            if (!ifPatientExistWithCredentials.emailVerified) {
                throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
            }

            if (ifPatientExistWithCredentials.status === UserStatus.SUSPENDED) {
                throw new AppError(httpStatus.FORBIDDEN, "User Is SUSPENDED");
            }

            if (ifPatientExistWithCredentials.status === UserStatus.REJECTED) {
                throw new AppError(httpStatus.FORBIDDEN, "User Is rejected");
            }

            user = await prisma.user.update({
                where: {
                    id: ifPatientExistWithCredentials.id,
                },

                data: {
                    googleId: googleIdTokenPayload.sub,
                },
            });
        } else {
            // Google Register

            user = await prisma.user.create({
                data: {
                    name: googleIdTokenPayload.name,
                    email: googleIdTokenPayload.email,
                    role: Role.TENANT,
                    googleId: googleIdTokenPayload.sub,
                    authProvider: AuthProvider.GOOGLE,
                    emailVerified: true,
                    phone: "",
                    status: "PENDING_APPROVAL",
                },
            });
            await prisma.tenantProfile.create({ data: { userId: user.id } });

            const tempatePath = path.join(
                process.cwd(),
                "src/templates/patient-welcome-email.ejs",
            );

            const templateData = {
                name: user.name,
            };

            const html = await ejs.renderFile(tempatePath, templateData);

            await transporter.sendMail({
                from: config.EMAIL_SENDER,
                to: user.email,
                subject: "Welcome To PH Healthcare System",
                // text : `Your OTP is ${otp}`
                // html: `<h1>Your OTP is ${otp}</h1>`
                html,
            });
        }
    }

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    if (user.status === UserStatus.SUSPENDED) {
        throw new AppError(httpStatus.FORBIDDEN, "User Is SUSPENDED");
    }

    if (user.status === UserStatus.REJECTED) {
        throw new AppError(httpStatus.FORBIDDEN, "User Is rejected");
    }

    const jwtPayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
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
    };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
    const { email } = payload;

    const isUserExist = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!isUserExist) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
    }

    if (isUserExist.status === UserStatus.SUSPENDED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
    }

    if (!isUserExist.emailVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
    }

    if (isUserExist.status === UserStatus.REJECTED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is rejected");
    }

    if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "User Has Account With Google",
        );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const key = `forgor-password-otp:${isUserExist.email}`;

    const expirationSeconds = 5 * 60;

    await redisClient.set(key, otp, {
        expiration: {
            type: "EX",
            value: expirationSeconds,
        },
    });

    const tempatePath = path.join(
        process.cwd(),
        "src/templates/forgot-password.ejs",
    );

    const templateData = {
        name: isUserExist.name,
        otp,
        expirationMinutes: expirationSeconds / 60,
    };

    const html = await ejs.renderFile(tempatePath, templateData);

    await transporter.sendMail({
        from: config.EMAIL_SENDER,
        to: isUserExist.email,
        subject: "Forgot Password",
        // text : `Your OTP is ${otp}`
        // html: `<h1>Your OTP is ${otp}</h1>`
        html,
    });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
    const { email, otp, newPassword } = payload;

    const isUserExist = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!isUserExist) {
        throw new AppError(httpStatus.NOT_FOUND, "User Does Not Exist!");
    }

    if (isUserExist.status === UserStatus.SUSPENDED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is SUSPENDED");
    }

    if (!isUserExist.emailVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "User Not Verified");
    }

    if (isUserExist.status === UserStatus.REJECTED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is Rejected");
    }

    if (isUserExist.googleId && isUserExist.authProvider === "GOOGLE") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "User Has Account With Google",
        );
    }

    const key = `forgor-password-otp:${isUserExist.email}`;

    const redisOtp = await redisClient.get(key);

    if (!redisOtp) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }

    if (redisOtp !== otp) {
        throw new AppError(httpStatus.BAD_REQUEST, "OTP Does Not Match");
    }

    const hashedNewPassword = await bcrypt.hash(
        newPassword,
        Number(config.BCRYPT_SALT_ROUNDS),
    );

    await prisma.user.update({
        where: {
            email: isUserExist.email,
        },
        data: {
            password: hashedNewPassword,
        },
    });

    await redisClient.del([key]);

    const tempatePath = path.join(
        process.cwd(),
        "src/templates/reset-password-success.ejs",
    );

    const templateData = {
        name: isUserExist.name,
    };

    const html = await ejs.renderFile(tempatePath, templateData);

    await transporter.sendMail({
        from: config.EMAIL_SENDER,
        to: isUserExist.email,
        subject: "Password Changed",
        // text : `Your OTP is ${otp}`
        // html: `<h1>Your Password Is Changed</h1>`
        html,
    });
};

export const AuthService = {
    login,
    register,
    verify,
    updateProfile,
    refreshToken,
    googleLogin,
    forgotPassword,
    resetPassword,
};
