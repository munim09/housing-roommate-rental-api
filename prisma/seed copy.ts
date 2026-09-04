import { prisma } from "../src/lib/prisma";

async function main() {
    await prisma.$connect();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
