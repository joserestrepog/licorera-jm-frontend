export interface SalesHistoryItem {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
  unitCost: number;
  totalCost: number;
  profit: number;
}

export interface SalesHistoryPayment {
  id: number;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  paymentDate: string;
}

export interface SalesHistoryCreditPayment {
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

export interface SalesHistorySale {
  id: number;
  saleNumber: number;
  cashRegisterId: number;
  userId: number;
  username: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  total: number;
  customerName: string | null;
  paidAmount: number;
  creditBalance: number;
  creditStatus: string | null;
  status: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledByUserId: number | null;
  cancelledByUsername: string | null;
  items: SalesHistoryItem[];
  payments: SalesHistoryPayment[];
  creditPayments: SalesHistoryCreditPayment[];
}

export interface SaleCancellationRequest {
  reason: string | null;
}
