import { prisma } from "../../lib/prisma";

const getMyAdvertisements = async (managerId: string) => {
    const assignedFlatIds = (
        await prisma.managerAssignment.findMany({
            where: { managerId, status: "ACTIVE" },
            select: { flatId: true },
        })
    ).map((assignment) => assignment.flatId);

    if (assignedFlatIds.length === 0) {
        return [];
    }

    const advertisements = await prisma.advertisement.findMany({
        where: {
            OR: [
                { flatId: { in: assignedFlatIds } },
                { room: { flatId: { in: assignedFlatIds } } },
            ],
        },
        select: {
            id: true,
            title: true,
            description: true,
            monthlyRent: true,
            category: true,
            target: true,
            status: true,
            availableFrom: true,
            availableTo: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            flat: {
                select: {
                    id: true,
                    flatNumber: true,
                    floorNumber: true,
                    status: true,
                    property: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            district: true,
                        },
                    },
                },
            },
            room: {
                select: {
                    id: true,
                    roomNumber: true,
                    name: true,
                    status: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return advertisements;
};

export const ManagerService = {
    getMyAdvertisements,
};