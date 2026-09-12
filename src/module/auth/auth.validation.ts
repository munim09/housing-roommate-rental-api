import z from "zod";

const registerValidation = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email format"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .regex(/[A-Za-z]/, "Password must contain at least 1 letter")
        .regex(/[0-9]/, "Password must contain at least 1 digit"),
    role: z.enum(["OWNER", "MANAGER", "TENANT"], {
        message: "Role must be OWNER, MANAGER, or TENANT",
    }),
    phone: z.string().optional(),
});

const ForgotPasswordZodSchema = z.object({
    email: z.email(),
});

const ResetPasswordZodSchema = z.object({
    email: z.email(),
    newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .regex(/[A-Za-z]/, "Password must contain at least 1 letter")
        .regex(/[0-9]/, "Password must contain at least 1 digit"),
    otp: z.string().length(6),
});

const verifyValidation = z.object({
    email: z.email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});

const updateProfileValidation = z.object({
    nid: z.string().optional(),
    address: z.string().optional(),
    occupation: z.string().optional(),
});

const loginValidation = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export const AuthValidation = {
    register: registerValidation,
    verify: verifyValidation,
    updateProfile: updateProfileValidation,
    login: loginValidation,
    ForgotPasswordZodSchema,
    ResetPasswordZodSchema,
};
