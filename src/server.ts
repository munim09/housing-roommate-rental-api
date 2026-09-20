import app from "./app";
import config from "./config";
import { startCronJobs } from "./lib/cronJob";
import { prisma } from "./lib/prisma";
import { redisClient } from "./lib/redisClient";

const PORT = config.PORT;

async function main() {
    try {
        await prisma.$connect();
        console.log("DB connected");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        await redisClient.connect();
        console.log("Redis Connected Successfully.");

        await startCronJobs();
    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
