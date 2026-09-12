import nodemailer from "nodemailer";
import config from "../config";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
    },
});
