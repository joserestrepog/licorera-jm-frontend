export interface CreditPayment {
  id: number;
  creditAccountId: number;
  cashRegisterId: number;
  userId: number;
  username: string;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  paymentDate: string;
}

export interface CreditAccount {
  id: number;
  saleId: number;
  saleNumber: string;
  customerName: string;
  initialAmount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  payments: CreditPayment[];
}

export interface CreditPaymentRequest {
  paymentMethodId: number;
  amount: number;
}
