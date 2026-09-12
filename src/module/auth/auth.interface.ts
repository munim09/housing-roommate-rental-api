export interface IForgotPasswordPayload {
    email: string;
}

export interface IResetPasswordPayload {
    email: string;
    newPassword: string;
    otp: string;
}

export interface IGoogleLoginPayload {
    idToken: string;
}
