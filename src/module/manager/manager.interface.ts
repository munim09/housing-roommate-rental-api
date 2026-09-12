import { ApplicationStatus } from "../../../generated/prisma/enums";

export interface IManagerApplicationQuery {
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
}