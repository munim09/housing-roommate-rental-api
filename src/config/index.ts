import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

// export default {
//     port: process.env.PORT || 5000,
//     database_url: process.env.DATABASE_URL,
//     app_url: process.env.APP_URL,
//     bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
//     jwt_access_secret: process.env.JWT_ACCESS_SECRET,
//     jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
//     jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
//     jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
//     ssl_store_id: process.env.SSL_STORE_ID,
//     ssl_store_passwd: process.env.SSL_STORE_PASSWD,
// };

const config = {
    PORT: process.env.PORT || 5000,
    DATABASE_URL: process.env.DATABASE_URL,
    APP_URL: process.env.APP_URL,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    SSL_STORE_ID: process.env.SSL_STORE_ID,
    SSL_STORE_PASSWD: process.env.SSL_STORE_PASSWD,
};

export default config;
