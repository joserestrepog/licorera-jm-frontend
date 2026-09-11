export interface CashRegister {
  id: number;
  userId: number;
  username: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  cashSales: number;
  transferSales: number;
  totalSales: number;
  expectedCash: number;
  countedCash: number | null;
  difference: number | null;
  status: string;
  notes: string | null;
}
