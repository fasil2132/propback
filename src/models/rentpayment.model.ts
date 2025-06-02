export interface RentPayment {
    id: number;
    leaseId: number;
    amount: number;
    paymentDate: string;
    method: 'credit_card' | 'bank_transfer' | 'cash';
  }