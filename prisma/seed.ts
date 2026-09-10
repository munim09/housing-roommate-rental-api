import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const USER_IDS = {
    admin: "10000000-0000-4000-8000-000000000001",
    owner1: "10000000-0000-4000-8000-000000000002",
    owner2: "10000000-0000-4000-8000-000000000003",
    owner3: "10000000-0000-4000-8000-000000000004",
    manager1: "10000000-0000-4000-8000-000000000005",
    manager2: "10000000-0000-4000-8000-000000000006",
    manager3: "10000000-0000-4000-8000-000000000007",
    tenant1: "10000000-0000-4000-8000-000000000008",
    tenant2: "10000000-0000-4000-8000-000000000009",
    tenant3: "10000000-0000-4000-8000-000000000010",
};

const PROPERTY_ID = "30000000-0000-4000-8000-000000000001";

const CITY_ID = "20000000-0000-4000-8000-000000000001";

const AREA_ID = "20000000-0000-4000-8000-000000000002";

const FLAT_ID = "40000000-0000-4000-8000-000000000001";

const ROOM_IDS = {
    room1: "50000000-0000-4000-8000-000000000001",
    room2: "50000000-0000-4000-8000-000000000002",
    room3: "50000000-0000-4000-8000-000000000003",
};

const OWNERSHIP_ID = "60000000-0000-4000-8000-000000000001";

interface SeedUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "ADMIN" | "OWNER" | "MANAGER" | "TENANT";
}

const seedUsers = async (password: string) => {
    const users: SeedUser[] = [
        {
            id: USER_IDS.admin,
            name: "Admin",
            email: "admin@email.com",
            phone: "+8801700000001",
            role: "ADMIN",
        },
        {
            id: USER_IDS.owner1,
            name: "Rahim Uddin",
            email: "o1@email.com",
            phone: "+8801710000001",
            role: "OWNER",
        },
        {
            id: USER_IDS.owner2,
            name: "Karim Hossain",
            email: "o2@email.com",
            phone: "+8801710000002",
            role: "OWNER",
        },
        {
            id: USER_IDS.owner3,
            name: "Sultana Begum",
            email: "o3@email.com",
            phone: "+8801710000003",
            role: "OWNER",
        },
        {
            id: USER_IDS.manager1,
            name: "Arif Chowdhury",
            email: "m1@email.com",
            phone: "+8801720000001",
            role: "MANAGER",
        },
        {
            id: USER_IDS.manager2,
            name: "Nusrat Jahan",
            email: "m2@email.com",
            phone: "+8801720000002",
            role: "MANAGER",
        },
        {
            id: USER_IDS.manager3,
            name: "Tanvir Ahmed",
            email: "m3@email.com",
            phone: "+8801720000003",
            role: "MANAGER",
        },
        {
            id: USER_IDS.tenant1,
            name: "Sumaiya Akter",
            email: "t1@email.com",
            phone: "+8801730000001",
            role: "TENANT",
        },
        {
            id: USER_IDS.tenant2,
            name: "Mahmudul Hasan",
            email: "t2@email.com",
            phone: "+8801730000002",
            role: "TENANT",
        },
        {
            id: USER_IDS.tenant3,
            name: "Farhana Islam",
            email: "t3@email.com",
            phone: "+8801730000003",
            role: "TENANT",
        },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                phone: user.phone,
                role: user.role,
                status: "ACTIVE",
                emailVerified: true,
            },
            create: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                password,
                role: user.role,
                status: "ACTIVE",
                emailVerified: true,
            },
        });
    }

    console.log("Users seeded");
};

const seedProfiles = async () => {
    const ownerProfiles = [
        {
            userId: USER_IDS.owner1,
            nid: "1234567890",
            address: "Dhanmondi, Dhaka",
            occupation: "Businessman",
        },
        {
            userId: USER_IDS.owner2,
            nid: "1234567891",
            address: "Gulshan, Dhaka",
            occupation: "Service Holder",
        },
        {
            userId: USER_IDS.owner3,
            nid: "1234567892",
            address: "Uttara, Dhaka",
            occupation: "Housewife",
        },
    ];

    for (const profile of ownerProfiles) {
        await prisma.ownerProfile.upsert({
            where: { userId: profile.userId },
            update: {
                nid: profile.nid,
                address: profile.address,
                occupation: profile.occupation,
            },
            create: profile,
        });
    }

    const managerProfiles = [
        {
            userId: USER_IDS.manager1,
            nid: "9876543210",
            address: "Mohammadpur, Dhaka",
            occupation: "Property Manager",
        },
        {
            userId: USER_IDS.manager2,
            nid: "9876543211",
            address: "Mirpur, Dhaka",
            occupation: "Real Estate Agent",
        },
        {
            userId: USER_IDS.manager3,
            nid: "9876543212",
            address: "Banani, Dhaka",
            occupation: "Building Manager",
        },
    ];

    for (const profile of managerProfiles) {
        await prisma.managerProfile.upsert({
            where: { userId: profile.userId },
            update: {
                nid: profile.nid,
                address: profile.address,
                occupation: profile.occupation,
            },
            create: profile,
        });
    }

    const tenantProfiles = [
        {
            userId: USER_IDS.tenant1,
            nid: "5551112223",
            address: "Bashundhara, Dhaka",
            occupation: "Software Engineer",
        },
        {
            userId: USER_IDS.tenant2,
            nid: "5551112224",
            address: "Dhanmondi, Dhaka",
            occupation: "University Student",
        },
        {
            userId: USER_IDS.tenant3,
            nid: "5551112225",
            address: "Banani, Dhaka",
            occupation: "Doctor",
        },
    ];

    for (const profile of tenantProfiles) {
        await prisma.tenantProfile.upsert({
            where: { userId: profile.userId },
            update: {
                nid: profile.nid,
                address: profile.address,
                occupation: profile.occupation,
            },
            create: profile,
        });
    }

    console.log("Profiles seeded");
};

const seedLocation = async () => {
    await prisma.city.upsert({
        where: { id: CITY_ID },
        update: { name: "Dhaka" },
        create: {
            id: CITY_ID,
            name: "Dhaka",
        },
    });

    await prisma.area.upsert({
        where: { id: AREA_ID },
        update: {
            cityId: CITY_ID,
            name: "Dhanmondi",
        },
        create: {
            id: AREA_ID,
            cityId: CITY_ID,
            name: "Dhanmondi",
        },
    });

    console.log("Location seeded");
};

const seedProperty = async () => {
    await prisma.property.upsert({
        where: { id: PROPERTY_ID },
        update: {},
        create: {
            id: PROPERTY_ID,
            name: "Green View Residency",
            type: "MULTI_FLAT",
            description:
                "A comfortable residential building in Dhanmondi with modern amenities.",
            address: "House 12, Road 5, Dhanmondi",
            areaId: AREA_ID,
            postalCode: "1205",
            latitude: 23.7461,
            longitude: 90.3742,
            status: "ACTIVE",
            createdById: USER_IDS.owner1,
        },
    });

    console.log("Property seeded");
};

const seedFlat = async () => {
    await prisma.flat.upsert({
        where: { id: FLAT_ID },
        update: {},
        create: {
            id: FLAT_ID,
            propertyId: PROPERTY_ID,
            flatNumber: "A-1",
            floorNumber: 1,
            bedrooms: 2,
            bathrooms: 1,
            areaSqFt: 1050,
            description: "Spacious 2 bedroom flat on the first floor.",
            status: "ACTIVE",
        },
    });

    await prisma.propertyOwnership.upsert({
        where: { id: OWNERSHIP_ID },
        update: {},
        create: {
            id: OWNERSHIP_ID,
            flatId: FLAT_ID,
            ownerId: USER_IDS.owner1,
            status: "ACTIVE",
        },
    });

    console.log("Flat seeded");
};

const seedRooms = async () => {
    const rooms = [
        {
            id: ROOM_IDS.room1,
            roomNumber: "101",
            name: "Master Bedroom",
            areaSqFt: 180,
            description: "Large bedroom with attached bathroom.",
        },
        {
            id: ROOM_IDS.room2,
            roomNumber: "102",
            name: "Single Bedroom",
            areaSqFt: 120,
            description: "Cozy bedroom facing the courtyard.",
        },
        {
            id: ROOM_IDS.room3,
            roomNumber: "103",
            name: "Shared Bedroom",
            areaSqFt: 150,
            description: "Good for two roommates.",
        },
    ];

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { id: room.id },
            update: {},
            create: {
                id: room.id,
                flatId: FLAT_ID,
                roomNumber: room.roomNumber,
                name: room.name,
                areaSqFt: room.areaSqFt,
                description: room.description,
                status: "ACTIVE",
            },
        });
    }

    console.log("Rooms seeded");
};

async function main() {
    await prisma.$connect();

    const hashedPassword = await bcrypt.hash("password123", 10);

    // await seedUsers(hashedPassword);
    // await seedProfiles();
    // await seedLocation();
    // await seedProperty();
    // await seedFlat();
    // await seedRooms();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
