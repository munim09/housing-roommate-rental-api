import { format } from "date-fns";
import PDFDocument from "pdfkit";

export interface IContractParty {
    name: string;
    email: string;
    phone: string;
}

export interface IContractPremises {
    propertyName: string;
    address: string;
    postalCode?: string | null;
    areaName?: string;
    cityName?: string;
    flatNumber: string;
    floorNumber?: number | null;
    roomNumber?: string | null;
    roomName?: string | null;
}

export interface IContractData {
    contractRef: string;
    issuedAt: Date;
    startDate: Date;
    endDate: Date;
    monthlyRent: string;
    owner: IContractParty;
    tenant: IContractParty;
    premises: IContractPremises;
}

const sectionHeading = (
    doc: PDFKit.PDFDocument,
    text: string,
    y: number,
) => {
    doc
        .fillColor("#1e293b")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(text, 56, y, {
            lineBreak: false,
            continued: true,
        });
    doc.moveDown(2);
    return doc.y;
};

export const generateContractPdf = (
    data: IContractData,
): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 56,
            size: "A4",
            info: {
                Title: `Rental Contract Agreement - ${data.premises.propertyName} (Flat ${data.premises.flatNumber})`,
                Author: "Housing Roommate",
            },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const formatDate = (date: Date) => format(date, "dd MMMM yyyy");

        // Header
        doc.rect(0, 0, doc.page.width, 120).fill("#0f766e");

        doc
            .fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(18)
            .text("RESIDENTIAL RENTAL CONTRACT AGREEMENT", 56, 42, {
                align: "center",
                width: doc.page.width - 112,
                lineGap: 6,
            })
            .font("Helvetica")
            .fontSize(10)
            .text(
                `Contract Reference: ${data.contractRef}`,
                56,
                78,
                { align: "center", width: doc.page.width - 112 },
            )
            .text(
                `Issued on: ${formatDate(data.issuedAt)}`,
                56,
                94,
                { align: "center", width: doc.page.width - 112 },
            );

        let y = 140;

        // Parties
        y = sectionHeading(doc, "1. PARTIES TO THE AGREEMENT", y);

        doc
            .fillColor("#0f172a")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Landlord (Lessor)", 56, doc.y, { lineBreak: false })
            .font("Helvetica")
            .fontSize(10)
            .text(
                `        \nName: ${data.owner.name}\nEmail: ${data.owner.email}\nPhone: ${data.owner.phone}`,
                { lineBreak: true },
            );
        doc.moveDown(0.4);

        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text("Tenant (Lessee)", 56, doc.y, { lineBreak: false })
            .font("Helvetica")
            .fontSize(10)
            .text(
                `        \nName: ${data.tenant.name}\nEmail: ${data.tenant.email}\nPhone: ${data.tenant.phone}`,
                { lineBreak: true },
            );
        doc.moveDown(0.6);
        y = doc.y;

        // Premises
        y = sectionHeading(doc, "2. PREMISES", y);
        const premisesLines = [
            `Property: ${data.premises.propertyName}`,
            `Address: ${data.premises.address}${
                data.premises.areaName
                    ? `, ${data.premises.areaName}`
                    : ""
            }${data.premises.cityName ? `, ${data.premises.cityName}` : ""}${
                data.premises.postalCode
                    ? ` - ${data.premises.postalCode}`
                    : ""
            }`,
            `Flat Number: ${data.premises.flatNumber}${
                data.premises.floorNumber
                    ? ` (Floor ${data.premises.floorNumber})`
                    : ""
            }`,
        ];
        if (data.premises.roomNumber) {
            premisesLines.push(
                `Room: ${data.premises.roomName} (${data.premises.roomNumber})`,
            );
        }
        doc
            .fillColor("#0f172a")
            .font("Helvetica")
            .fontSize(10)
            .text(premisesLines.join("\n"), 56, doc.y, { lineBreak: true });
        doc.moveDown(0.6);
        y = doc.y;

        // Lease term
        y = sectionHeading(doc, "3. TERM OF TENANCY", y);
        doc
            .font("Helvetica")
            .fontSize(10)
            .text(
                `The tenancy shall commence on ${formatDate(
                    data.startDate,
                )} and end on ${formatDate(data.endDate)}.`,
                { lineBreak: true },
            );
        doc.moveDown(0.6);
        y = doc.y;

        // Rent
        y = sectionHeading(doc, "4. MONTHLY RENT", y);
        doc
            .font("Helvetica")
            .fontSize(10)
            .text(
                `The Tenant agrees to pay the Landlord a monthly rent of ${data.monthlyRent} for the premises described above.`,
                { lineBreak: true },
            );
        doc.moveDown(0.6);
        y = doc.y;

        // Terms and conditions
        y = sectionHeading(doc, "5. TERMS AND CONDITIONS", y);
        const terms = [
            "Rent must be paid within the due date stated on each monthly invoice.",
            "The Tenant shall use the premises for residential purposes only.",
            "The Tenant shall keep the premises in a clean and habitable condition and report any damage to the Landlord promptly.",
            "Any alteration to the premises requires prior written consent from the Landlord.",
            "Utility charges shall be borne as agreed between the parties.",
            "This agreement is subject to the applicable laws of the country and any disputes will be resolved accordingly.",
        ];
        doc
            .font("Helvetica")
            .fontSize(10)
            .text(
                terms
                    .map(
                        (term, index) =>
                            `${index + 1}. ${term}`,
                    )
                    .join("\n"),
                { lineBreak: true },
            );
        doc.moveDown(1);
        y = doc.y;

        // Signatures
        if (y > doc.page.height - 160) {
            doc.addPage();
            y = doc.y + 40;
        }

        const signatureWidth = (doc.page.width - 112) / 2;
        const signatureY = doc.page.height - 130;

        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#0f172a")
            .text(data.owner.name, 56, signatureY)
            .moveDown(0.2)
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#475569")
            .text("Landlord Signature");

        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#0f172a")
            .text(data.tenant.name, 56 + signatureWidth, signatureY)
            .moveDown(0.2)
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#475569")
            .text("Tenant Signature");

        doc
            .font("Helvetica-Oblique")
            .fontSize(8)
            .fillColor("#94a3b8")
            .text(
                "This contract was generated automatically by the Housing Roommate platform.",
                56,
                doc.page.height - 60,
                { align: "center", width: doc.page.width - 112 },
            );

        doc.end();
    });