export interface Tenant {
    id: number;
    userId: number;
    propertyId: number;
    leaseStart: Date;
    leaseEnd: Date;
    createdAt: Date;
}
