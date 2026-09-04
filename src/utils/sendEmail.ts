import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
    },
});

const sendEmail = async (to: string, subject: string, html: string) => {
    await transporter.sendMail({
        from: config.EMAIL_SENDER,
        to,
        subject,
        html,
    });
};

export default sendEmail;
