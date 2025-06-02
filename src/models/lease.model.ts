import { RentPayment } from "./rentpayment.model";

export interface Lease {
    id: number;
    propertyId: number;
    tenantId: number;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit?: number;
    document?: string;
    cretedAt: Date;
    payments?: RentPayment[];
    terms?: string;
}