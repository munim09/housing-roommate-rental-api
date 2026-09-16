import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// ============================================================
// IDs
// ============================================================

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

const CITY_ID = "20000000-0000-4000-8000-000000000001";
const AREA_ID = "20000000-0000-4000-8000-000000000002";

const PROPERTY_ID = "30000000-0000-4000-8000-000000000001";

const FLAT_IDS = {
    flat1: "40000000-0000-4000-8000-000000000001",
    flat2: "40000000-0000-4000-8000-000000000002",
};

const ROOM_IDS = {
    room1: "50000000-0000-4000-8000-000000000001",
    room2: "50000000-0000-4000-8000-000000000002",
    room3: "50000000-0000-4000-8000-000000000003",
    room4: "50000000-0000-4000-8000-000000000004",
};

const OWNERSHIP_IDS = {
    ownership1: "60000000-0000-4000-8000-000000000001",
    ownership2: "60000000-0000-4000-8000-000000000002",
};

const MANAGER_ASSIGNMENT_IDS = {
    assignment1: "60000000-0000-4000-8000-000000000003",
    assignment2: "60000000-0000-4000-8000-000000000004",
};

const ADVERTISEMENT_IDS = {
    ad1: "70000000-0000-4000-8000-000000000001",
    ad2: "70000000-0000-4000-8000-000000000002",
    ad3: "70000000-0000-4000-8000-000000000003",
    ad4: "70000000-0000-4000-8000-000000000004",
};

const IMAGE_IDS = {
    flat1: "80000000-0000-4000-8000-000000000001",
    flat2: "80000000-0000-4000-8000-000000000002",
    room1: "80000000-0000-4000-8000-000000000003",
};

const APPLICATION_IDS = {
    app1: "90000000-0000-4000-8000-000000000001",
    app2: "90000000-0000-4000-8000-000000000002",
    app3: "90000000-0000-4000-8000-000000000003",
    app4: "90000000-0000-4000-8000-000000000004",
};

const STAY_IDS = {
    stay1: "a0000000-0000-4000-8000-000000000001",
    stay2: "a0000000-0000-4000-8000-000000000002",
};

const INVOICE_IDS = {
    inv1: "b0000000-0000-4000-8000-000000000001",
    inv2: "b0000000-0000-4000-8000-000000000002",
    inv3: "b0000000-0000-4000-8000-000000000003",
};

const PAYMENT_IDS = {
    pay1: "c0000000-0000-4000-8000-000000000001",
    pay2: "c0000000-0000-4000-8000-000000000002",
    pay3: "c0000000-0000-4000-8000-000000000003",
};

const VIEWING_REQUEST_IDS = {
    v1: "d0000000-0000-4000-8000-000000000001",
    v2: "d0000000-0000-4000-8000-000000000002",
};

const NOTIFICATION_IDS = {
    n1: "e0000000-0000-4000-8000-000000000001",
    n2: "e0000000-0000-4000-8000-000000000002",
    n3: "e0000000-0000-4000-8000-000000000003",
};

// ============================================================
// Users
// ============================================================

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

// ============================================================
// Profiles
// ============================================================

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

// ============================================================
// Location
// ============================================================

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

// ============================================================
// Property
// ============================================================

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

// ============================================================
// Flats, Ownership & Manager Assignment
// ============================================================

const seedFlats = async () => {
    await prisma.flat.upsert({
        where: { id: FLAT_IDS.flat1 },
        update: {},
        create: {
            id: FLAT_IDS.flat1,
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

    await prisma.flat.upsert({
        where: { id: FLAT_IDS.flat2 },
        update: {},
        create: {
            id: FLAT_IDS.flat2,
            propertyId: PROPERTY_ID,
            flatNumber: "A-2",
            floorNumber: 2,
            bedrooms: 3,
            bathrooms: 2,
            areaSqFt: 1450,
            description: "Large 3 bedroom flat on the second floor.",
            status: "ACTIVE",
        },
    });

    await prisma.propertyOwnership.upsert({
        where: { id: OWNERSHIP_IDS.ownership1 },
        update: {},
        create: {
            id: OWNERSHIP_IDS.ownership1,
            flatId: FLAT_IDS.flat1,
            ownerId: USER_IDS.owner1,
            status: "ACTIVE",
        },
    });

    await prisma.propertyOwnership.upsert({
        where: { id: OWNERSHIP_IDS.ownership2 },
        update: {},
        create: {
            id: OWNERSHIP_IDS.ownership2,
            flatId: FLAT_IDS.flat2,
            ownerId: USER_IDS.owner2,
            status: "ACTIVE",
        },
    });

    await prisma.managerAssignment.upsert({
        where: { id: MANAGER_ASSIGNMENT_IDS.assignment1 },
        update: {},
        create: {
            id: MANAGER_ASSIGNMENT_IDS.assignment1,
            flatId: FLAT_IDS.flat1,
            managerId: USER_IDS.manager1,
            status: "ACTIVE",
        },
    });

    await prisma.managerAssignment.upsert({
        where: { id: MANAGER_ASSIGNMENT_IDS.assignment2 },
        update: {},
        create: {
            id: MANAGER_ASSIGNMENT_IDS.assignment2,
            flatId: FLAT_IDS.flat2,
            managerId: USER_IDS.manager2,
            status: "ACTIVE",
        },
    });

    console.log("Flats, ownerships and manager assignments seeded");
};

// ============================================================
// Rooms
// ============================================================

const seedRooms = async () => {
    const rooms = [
        {
            id: ROOM_IDS.room1,
            flatId: FLAT_IDS.flat1,
            roomNumber: "101",
            name: "Master Bedroom",
            areaSqFt: 180,
            description: "Large bedroom with attached bathroom.",
        },
        {
            id: ROOM_IDS.room2,
            flatId: FLAT_IDS.flat1,
            roomNumber: "102",
            name: "Single Bedroom",
            areaSqFt: 120,
            description: "Cozy bedroom facing the courtyard.",
        },
        {
            id: ROOM_IDS.room3,
            flatId: FLAT_IDS.flat1,
            roomNumber: "103",
            name: "Shared Bedroom",
            areaSqFt: 150,
            description: "Good for two roommates.",
        },
        {
            id: ROOM_IDS.room4,
            flatId: FLAT_IDS.flat2,
            roomNumber: "201",
            name: "Master Bedroom",
            areaSqFt: 200,
            description: "Big bedroom with balcony.",
        },
    ];

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { id: room.id },
            update: {},
            create: {
                id: room.id,
                flatId: room.flatId,
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

// ============================================================
// Advertisements
// ============================================================

const seedAdvertisements = async () => {
    const publishedAt = new Date("2026-08-01T00:00:00Z");

    const advertisements = [
        {
            id: ADVERTISEMENT_IDS.ad1,
            createdById: USER_IDS.manager1,
            flatId: FLAT_IDS.flat1,
            roomId: null,
            category: "RENTAL" as const,
            target: "ENTIRE_FLAT" as const,
            title: "2 Bedroom Flat for Rent in Dhanmondi",
            description: "Fully furnished flat available for a family.",
            monthlyRent: 30000,
            status: "PUBLISHED" as const,
            publishedAt,
        },
        {
            id: ADVERTISEMENT_IDS.ad2,
            createdById: USER_IDS.owner1,
            flatId: FLAT_IDS.flat1,
            roomId: ROOM_IDS.room2,
            category: "RENTAL" as const,
            target: "ROOM" as const,
            title: "Single Bedroom for Rent",
            description: "Private single bedroom in a 2BR flat.",
            monthlyRent: 12000,
            status: "PUBLISHED" as const,
            publishedAt,
        },
        {
            id: ADVERTISEMENT_IDS.ad3,
            createdById: USER_IDS.tenant1,
            flatId: FLAT_IDS.flat1,
            roomId: ROOM_IDS.room1,
            category: "ROOMMATE" as const,
            target: "ROOM" as const,
            title: "Roommate Wanted for Master Bedroom",
            description: "Looking for a female roommate in Dhanmondi.",
            monthlyRent: 10000,
            availableFrom: new Date("2026-09-01T00:00:00Z"),
            availableTo: new Date("2027-08-31T00:00:00Z"),
            status: "PUBLISHED" as const,
            publishedAt,
        },
        {
            id: ADVERTISEMENT_IDS.ad4,
            createdById: USER_IDS.owner2,
            flatId: FLAT_IDS.flat2,
            roomId: null,
            category: "RENTAL" as const,
            target: "ENTIRE_FLAT" as const,
            title: "3 Bedroom Flat for Rent",
            description: "Bright and airy 3BR flat on the second floor.",
            monthlyRent: 40000,
            status: "PUBLISHED" as const,
            publishedAt,
        },
    ];

    for (const ad of advertisements) {
        await prisma.advertisement.upsert({
            where: { id: ad.id },
            update: {},
            create: {
                id: ad.id,
                createdById: ad.createdById,
                flatId: ad.flatId,
                roomId: ad.roomId,
                category: ad.category,
                target: ad.target,
                title: ad.title,
                description: ad.description,
                monthlyRent: ad.monthlyRent,
                availableFrom: ad.availableFrom,
                availableTo: ad.availableTo,
                status: ad.status,
                publishedAt: ad.publishedAt,
            },
        });
    }

    console.log("Advertisements seeded");
};

// ============================================================
// Images
// ============================================================

const seedImages = async () => {
    const images = [
        {
            id: IMAGE_IDS.flat1,
            flatId: FLAT_IDS.flat1,
            roomId: null,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1/flats/flat-a1.jpg",
            publicId: "flats/flat-a1",
            sortOrder: 0,
            isPrimary: true,
        },
        {
            id: IMAGE_IDS.room1,
            flatId: FLAT_IDS.flat1,
            roomId: ROOM_IDS.room1,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1/rooms/room-101.jpg",
            publicId: "rooms/room-101",
            sortOrder: 0,
            isPrimary: true,
        },
        {
            id: IMAGE_IDS.flat2,
            flatId: FLAT_IDS.flat2,
            roomId: null,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1/flats/flat-a2.jpg",
            publicId: "flats/flat-a2",
            sortOrder: 0,
            isPrimary: true,
        },
    ];

    for (const image of images) {
        await prisma.accommodationImage.upsert({
            where: { id: image.id },
            update: {},
            create: image,
        });
    }

    console.log("Images seeded");
};

// ============================================================
// Applications
// ============================================================

const seedApplications = async () => {
    const applications = [
        {
            id: APPLICATION_IDS.app1,
            advertisementId: ADVERTISEMENT_IDS.ad1,
            applicantId: USER_IDS.tenant1,
            type: "RENTAL" as const,
            status: "APPROVED" as const,
            requestedStartDate: new Date("2026-09-01T00:00:00Z"),
            requestedEndDate: new Date("2027-08-31T00:00:00Z"),
            note: "Interested in renting the whole flat.",
            reviewedById: USER_IDS.owner1,
            reviewedAt: new Date("2026-08-25T10:00:00Z"),
        },
        {
            id: APPLICATION_IDS.app2,
            advertisementId: ADVERTISEMENT_IDS.ad3,
            applicantId: USER_IDS.tenant2,
            type: "ROOMMATE" as const,
            status: "APPROVED" as const,
            requestedStartDate: new Date("2026-09-15T00:00:00Z"),
            requestedEndDate: new Date("2027-09-14T00:00:00Z"),
            note: "Working professional, looking for a long term stay.",
            reviewedById: USER_IDS.tenant1,
            reviewedAt: new Date("2026-09-10T12:00:00Z"),
        },
        {
            id: APPLICATION_IDS.app3,
            advertisementId: ADVERTISEMENT_IDS.ad2,
            applicantId: USER_IDS.tenant3,
            type: "RENTAL" as const,
            status: "PENDING" as const,
            requestedStartDate: new Date("2026-10-01T00:00:00Z"),
            requestedEndDate: new Date("2027-09-30T00:00:00Z"),
            note: "Doctor, needs a quiet place near Dhanmondi.",
        },
        {
            id: APPLICATION_IDS.app4,
            advertisementId: ADVERTISEMENT_IDS.ad4,
            applicantId: USER_IDS.tenant3,
            type: "RENTAL" as const,
            status: "REJECTED" as const,
            requestedStartDate: new Date("2026-09-01T00:00:00Z"),
            requestedEndDate: new Date("2027-08-31T00:00:00Z"),
            note: "Asked for a discount on rent.",
            reviewedById: USER_IDS.owner2,
            reviewedAt: new Date("2026-08-28T09:00:00Z"),
        },
    ];

    for (const app of applications) {
        await prisma.application.upsert({
            where: { id: app.id },
            update: {},
            create: app,
        });
    }

    console.log("Applications seeded");
};

// ============================================================
// Stays
// ============================================================

const seedStays = async () => {
    await prisma.stay.upsert({
        where: { id: STAY_IDS.stay1 },
        update: {},
        create: {
            id: STAY_IDS.stay1,
            applicationId: APPLICATION_IDS.app1,
            occupantId: USER_IDS.tenant1,
            propertyId: PROPERTY_ID,
            flatId: FLAT_IDS.flat1,
            type: "PRIMARY",
            status: "CONFIRMED",
            startDate: new Date("2026-09-01T00:00:00Z"),
            endDate: new Date("2027-08-31T00:00:00Z"),
            monthlyRent: 30000,
        },
    });

    await prisma.stay.upsert({
        where: { id: STAY_IDS.stay2 },
        update: {},
        create: {
            id: STAY_IDS.stay2,
            applicationId: APPLICATION_IDS.app2,
            occupantId: USER_IDS.tenant2,
            propertyId: PROPERTY_ID,
            flatId: FLAT_IDS.flat1,
            roomId: ROOM_IDS.room1,
            type: "ROOMMATE",
            status: "WAITING_FOR_PAYMENT",
            startDate: new Date("2026-09-15T00:00:00Z"),
            endDate: new Date("2027-09-14T00:00:00Z"),
            monthlyRent: 10000,
        },
    });

    console.log("Stays seeded");
};

// ============================================================
// Invoices
// ============================================================

const seedInvoices = async () => {
    await prisma.invoice.upsert({
        where: { id: INVOICE_IDS.inv1 },
        update: {},
        create: {
            id: INVOICE_IDS.inv1,
            stayId: STAY_IDS.stay1,
            payerId: USER_IDS.tenant1,
            receiverId: USER_IDS.owner1,
            type: "RENT",
            amount: 30000,
            billingPeriodStart: new Date("2026-09-01T00:00:00Z"),
            billingPeriodEnd: new Date("2026-09-30T23:59:59Z"),
            dueDate: new Date("2026-09-01T12:00:00Z"),
            status: "PAID",
            description: "September rent installment",
        },
    });

    await prisma.invoice.upsert({
        where: { id: INVOICE_IDS.inv2 },
        update: {},
        create: {
            id: INVOICE_IDS.inv2,
            stayId: STAY_IDS.stay1,
            payerId: USER_IDS.tenant1,
            receiverId: USER_IDS.owner1,
            type: "RENT",
            amount: 30000,
            billingPeriodStart: new Date("2026-10-01T00:00:00Z"),
            billingPeriodEnd: new Date("2026-10-31T23:59:59Z"),
            dueDate: new Date("2026-09-30T12:00:00Z"),
            status: "PENDING",
            description: "October rent installment",
        },
    });

    await prisma.invoice.upsert({
        where: { id: INVOICE_IDS.inv3 },
        update: {},
        create: {
            id: INVOICE_IDS.inv3,
            stayId: STAY_IDS.stay2,
            payerId: USER_IDS.tenant2,
            receiverId: USER_IDS.tenant1,
            type: "RENT",
            amount: 10000,
            billingPeriodStart: new Date("2026-09-15T00:00:00Z"),
            billingPeriodEnd: new Date("2026-10-14T23:59:59Z"),
            dueDate: new Date("2026-09-14T12:00:00Z"),
            status: "PENDING",
            description: "Roommate booking installment",
        },
    });

    console.log("Invoices seeded");
};

// ============================================================
// Payments
// ============================================================

const seedPayments = async () => {
    await prisma.payment.upsert({
        where: { id: PAYMENT_IDS.pay1 },
        update: {},
        create: {
            id: PAYMENT_IDS.pay1,
            stayId: STAY_IDS.stay1,
            invoiceId: INVOICE_IDS.inv1,
            payerId: USER_IDS.tenant1,
            receiverId: USER_IDS.owner1,
            type: "RENT",
            amount: 30000,
            status: "SUCCESS",
            transactionReference: "SEED-SSL-0000001",
            gatewayResponse: {
                status: "VALID",
                tran_id: "SEED-SSL-0000001",
                currency: "BDT",
                amount: "30000.00",
            },
            paidAt: new Date("2026-09-01T12:30:00Z"),
        },
    });

    await prisma.payment.upsert({
        where: { id: PAYMENT_IDS.pay2 },
        update: {},
        create: {
            id: PAYMENT_IDS.pay2,
            stayId: STAY_IDS.stay1,
            invoiceId: INVOICE_IDS.inv2,
            payerId: USER_IDS.tenant1,
            receiverId: USER_IDS.owner1,
            type: "RENT",
            amount: 30000,
            status: "PENDING",
            transactionReference: "SEED-SSL-0000002",
            createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
        },
    });

    await prisma.payment.upsert({
        where: { id: PAYMENT_IDS.pay3 },
        update: {},
        create: {
            id: PAYMENT_IDS.pay3,
            stayId: STAY_IDS.stay2,
            invoiceId: INVOICE_IDS.inv3,
            payerId: USER_IDS.tenant2,
            receiverId: USER_IDS.tenant1,
            type: "RENT",
            amount: 10000,
            status: "FAILED",
            transactionReference: "SEED-SSL-0000003",
            gatewayResponse: {
                status: "FAILED",
                tran_id: "SEED-SSL-0000003",
                currency: "BDT",
                amount: "10000.00",
            },
            failureReason: "Payment failed by gateway",
        },
    });

    console.log("Payments seeded");
};

// ============================================================
// Viewing Requests
// ============================================================

const seedViewingRequests = async () => {
    await prisma.viewingRequest.upsert({
        where: { id: VIEWING_REQUEST_IDS.v1 },
        update: {},
        create: {
            id: VIEWING_REQUEST_IDS.v1,
            advertisementId: ADVERTISEMENT_IDS.ad2,
            requesterId: USER_IDS.tenant2,
            requestedDate: new Date("2026-09-20T10:00:00Z"),
            approvedDate: new Date("2026-09-18T09:00:00Z"),
            status: "APPROVED",
            reviewedById: USER_IDS.owner1,
            reviewedAt: new Date("2026-09-18T09:00:00Z"),
            note: "Can come in the morning.",
            noteByReviewer: "Please bring a photocopy of your NID.",
        },
    });

    await prisma.viewingRequest.upsert({
        where: { id: VIEWING_REQUEST_IDS.v2 },
        update: {},
        create: {
            id: VIEWING_REQUEST_IDS.v2,
            advertisementId: ADVERTISEMENT_IDS.ad4,
            requesterId: USER_IDS.tenant3,
            requestedDate: new Date("2026-09-25T16:00:00Z"),
            status: "PENDING",
            note: "Interested for a weekend visit.",
        },
    });

    console.log("Viewing requests seeded");
};

// ============================================================
// Notifications
// ============================================================

const seedNotifications = async () => {
    const notifications = [
        {
            id: NOTIFICATION_IDS.n1,
            userId: USER_IDS.tenant1,
            type: "PAYMENT" as const,
            title: "Rent payment due",
            message: "Your October rent installment is due on 30 Sep 2026.",
        },
        {
            id: NOTIFICATION_IDS.n2,
            userId: USER_IDS.owner1,
            type: "APPLICATION" as const,
            title: "New application",
            message: "Farhana Islam applied for your room in Flat A-1.",
        },
        {
            id: NOTIFICATION_IDS.n3,
            userId: USER_IDS.tenant3,
            type: "VIEWING" as const,
            title: "Viewing approved",
            message: "Your viewing request for Flat A-2 was approved.",
        },
    ];

    for (const notification of notifications) {
        await prisma.notification.upsert({
            where: { id: notification.id },
            update: {},
            create: notification,
        });
    }

    console.log("Notifications seeded");
};

// ============================================================
// Main
// ============================================================

async function main() {
    await prisma.$connect();

    const hashedPassword = await bcrypt.hash("password123", 10);

    // await seedUsers(hashedPassword);
    // await seedProfiles();
    // await seedLocation();
    // await seedProperty();
    // await seedFlats();
    // await seedRooms();
    // await seedAdvertisements();
    // await seedImages();
    // await seedApplications();
    // await seedStays();
    // await seedInvoices();
    // await seedPayments();
    // await seedViewingRequests();
    // await seedNotifications();

    // console.log("Seeding completed");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
