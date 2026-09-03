import { prisma } from "../src/lib/prisma";

async function main() {
    await prisma.$connect();
    // --- Users -----------------------------------------------------------
    // const admin = await prisma.user.create({
    //     data: {
    //         name: "Admin User",
    //         email: "admin@example.com",
    //         password: "123456",
    //         role: "ADMIN",
    //     },
    // });

    // const provider = await prisma.user.create({
    //     data: {
    //         name: "Rafiq Rahman",
    //         email: "provider@example.com",
    //         password: "123456",
    //         role: "PROVIDER",
    //         profile: {
    //             create: {
    //                 bio: "Camping and outdoor gear provider based in Dhaka.",
    //             },
    //         },
    //     },
    // });

    // const customer = await prisma.user.create({
    //     data: {
    //         name: "Cutomers",
    //         email: "customer@example.com",
    //         password: "123456",
    //         role: "CUSTOMER",
    //         profile: {
    //             create: {
    //                 bio: "Weekend hiker.",
    //             },
    //         },
    //     },
    // });

    // // --- Category ----------------------------------------------------------
    // const category = await prisma.category.create({
    //     data: {
    //         name: "Camping",
    //         description: "Tents, sleeping bags, and camping accessories.",
    //     },
    // });

    // // --- Gear ----------------------------------------------------------------
    // const gear = await prisma.gear.create({
    //     data: {
    //         providerId: provider.id,
    //         categoryId: category.id,
    //         name: "4-Person Tent",
    //         description: "Waterproof 4-person camping tent.",
    //         brand: "Coleman",
    //         model: "Sundome",
    //         dailyRentalPrice: 350.0,
    //         stockQuantity: 5,
    //     },
    // });

    // // --- Rental order + item --------------------------------------------------
    // const rentalOrder = await prisma.rentalOrder.create({
    //     data: {
    //         customerId: customer.id,
    //         providerId: provider.id,
    //         rentalStartDate: new Date("2026-07-15"),
    //         rentalEndDate: new Date("2026-07-18"),
    //         totalAmount: 1050.0,
    //         status: "CONFIRMED",
    //         items: {
    //             create: [
    //                 {
    //                     gearId: gear.id,
    //                     quantity: 1,
    //                     dailyRentalPrice: 350.0,
    //                 },
    //             ],
    //         },
    //     },
    // });

    // // --- Payment -------------------------------------------------------------
    // await prisma.payment.create({
    //     data: {
    //         tranId: "TRAN-0001",
    //         rentalOrderId: rentalOrder.id,
    //         stripePaymentIntentId: "pi_test_0001",
    //         amount: 1050.0,
    //         status: "COMPLETED",
    //         paidAt: new Date(),
    //     },
    // });

    // // --- Review ----------------------------------------------------------------
    // await prisma.review.create({
    //     data: {
    //         customerId: customer.id,
    //         gearId: gear.id,
    //         rating: 5,
    //         comment: "Great tent, stayed dry through heavy rain.",
    //     },
    // });

    // console.log("Seed data created:", {
    //     admin: admin.email,
    //     provider: provider.email,
    //     customer: customer.email,
    //     category: category.name,
    //     categoryId: category.id,
    //     gear: gear.name,
    //     rentalOrder: rentalOrder.id,
    // });

    // const hikingCategory = await prisma.category.create({
    //     data: {
    //         name: "Hiking Equipment",
    //         description: "Gear and accessories for hiking and trekking.",
    //     },
    // });

    // --- 40 Gear Items ---------------------------------------------------------
    const campingItems = [
        {
            name: "2-Person Camping Tent",
            brand: "Coleman",
            model: "CT-2",
            price: 300,
            stock: 10,
        },
        {
            name: "4-Person Camping Tent",
            brand: "Coleman",
            model: "CT-4",
            price: 450,
            stock: 8,
        },
        {
            name: "6-Person Family Tent",
            brand: "Coleman",
            model: "CT-6",
            price: 700,
            stock: 5,
        },
        {
            name: "Camping Sleeping Bag",
            brand: "NatureHike",
            model: "SB-1",
            price: 120,
            stock: 20,
        },
        {
            name: "Double Sleeping Bag",
            brand: "Coleman",
            model: "SB-2",
            price: 180,
            stock: 10,
        },
        {
            name: "Self Inflating Sleeping Pad",
            brand: "NatureHike",
            model: "SP-1",
            price: 80,
            stock: 15,
        },
        {
            name: "Inflatable Camping Mattress",
            brand: "Intex",
            model: "CM-1",
            price: 140,
            stock: 10,
        },
        {
            name: "Camping Pillow",
            brand: "NatureHike",
            model: "CP-1",
            price: 25,
            stock: 25,
        },
        {
            name: "Camping Chair",
            brand: "Quechua",
            model: "CC-1",
            price: 60,
            stock: 15,
        },
        {
            name: "Foldable Camping Table",
            brand: "NatureHike",
            model: "CTB-1",
            price: 90,
            stock: 8,
        },
        {
            name: "LED Camping Lantern",
            brand: "Black Diamond",
            model: "CL-1",
            price: 45,
            stock: 20,
        },
        {
            name: "Rechargeable Headlamp",
            brand: "Petzl",
            model: "HL-1",
            price: 35,
            stock: 20,
        },
        {
            name: "Portable Camping Stove",
            brand: "FireMaple",
            model: "CS-1",
            price: 90,
            stock: 15,
        },
        {
            name: "Gas Stove Burner",
            brand: "FireMaple",
            model: "GS-1",
            price: 75,
            stock: 15,
        },
        {
            name: "Camping Cookware Set",
            brand: "FireMaple",
            model: "CK-1",
            price: 70,
            stock: 12,
        },
        {
            name: "Camping Kettle",
            brand: "Stanley",
            model: "KT-1",
            price: 35,
            stock: 12,
        },
        {
            name: "Camping Mess Kit",
            brand: "Sea to Summit",
            model: "MK-1",
            price: 30,
            stock: 20,
        },
        {
            name: "Portable Water Container",
            brand: "Reliance",
            model: "WC-1",
            price: 30,
            stock: 15,
        },
        {
            name: "Water Filter Bottle",
            brand: "LifeStraw",
            model: "WF-1",
            price: 50,
            stock: 15,
        },
        {
            name: "Cooler Box",
            brand: "Igloo",
            model: "CB-1",
            price: 100,
            stock: 10,
        },
        {
            name: "Camping Backpack 40L",
            brand: "Quechua",
            model: "BP-40",
            price: 180,
            stock: 10,
        },
        {
            name: "Camping Backpack 60L",
            brand: "Osprey",
            model: "BP-60",
            price: 250,
            stock: 8,
        },
        {
            name: "Camping Hammock",
            brand: "ENO",
            model: "HM-1",
            price: 70,
            stock: 12,
        },
        {
            name: "Camping Tarp",
            brand: "NatureHike",
            model: "TP-1",
            price: 65,
            stock: 12,
        },
        {
            name: "Tent Footprint",
            brand: "Coleman",
            model: "TF-1",
            price: 40,
            stock: 15,
        },
        {
            name: "Camping Axe",
            brand: "Fiskars",
            model: "AX-1",
            price: 60,
            stock: 10,
        },
        {
            name: "Camping Hatchet",
            brand: "Gerber",
            model: "HT-1",
            price: 55,
            stock: 10,
        },
        {
            name: "Foldable Shovel",
            brand: "Gerber",
            model: "FS-1",
            price: 45,
            stock: 15,
        },
        {
            name: "Multi Tool",
            brand: "Leatherman",
            model: "MT-1",
            price: 90,
            stock: 10,
        },
        {
            name: "Fire Starter Kit",
            brand: "Light My Fire",
            model: "FSK-1",
            price: 25,
            stock: 20,
        },
        {
            name: "Camping First Aid Kit",
            brand: "Adventure Medical",
            model: "FAK-1",
            price: 45,
            stock: 20,
        },
        {
            name: "Emergency Survival Kit",
            brand: "Survive",
            model: "ESK-1",
            price: 75,
            stock: 12,
        },
        {
            name: "Camping Rope 30m",
            brand: "Mammut",
            model: "RP-30",
            price: 50,
            stock: 15,
        },
        {
            name: "Tent Repair Kit",
            brand: "Coleman",
            model: "TRK-1",
            price: 20,
            stock: 20,
        },
        {
            name: "Portable Solar Charger",
            brand: "Anker",
            model: "SC-1",
            price: 85,
            stock: 10,
        },
        {
            name: "Power Bank 20000mAh",
            brand: "Anker",
            model: "PB-20",
            price: 70,
            stock: 15,
        },
        {
            name: "Camping Binoculars",
            brand: "Nikon",
            model: "BN-1",
            price: 120,
            stock: 8,
        },
        {
            name: "Compass",
            brand: "Suunto",
            model: "CP-1",
            price: 35,
            stock: 20,
        },
        {
            name: "Camping Rain Poncho",
            brand: "Forclaz",
            model: "RP-1",
            price: 25,
            stock: 20,
        },
        {
            name: "Dry Bag 20L",
            brand: "Sea to Summit",
            model: "DB-20",
            price: 40,
            stock: 20,
        },
    ];

    await prisma.gear.createMany({
        data: campingItems.map((item) => ({
            providerId: "fa57ffb1-d09d-48b9-b422-0191635d9776",
            categoryId: "dbb0c9d0-69a3-4a54-b6ba-aeqweqweqwe",
            name: item.name,
            description: `${item.name} for hiking and outdoor adventures.`,
            brand: item.brand,
            model: item.model,
            dailyRentalPrice: item.price,
            stockQuantity: item.stock,
        })),
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
