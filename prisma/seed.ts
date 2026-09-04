import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
    await prisma.$connect();

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.user.upsert({
        where: { email: "admin@housing.com" },
        update: {},
        create: {
            name: "Admin",
            email: "admin@housing.com",
            password: hashedPassword,
            role: "ADMIN",
            status: "ACTIVE",
            emailVerified: true,
        },
    });

    console.log("Admin user seeded");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
