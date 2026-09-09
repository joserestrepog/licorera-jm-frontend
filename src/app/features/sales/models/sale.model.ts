export interface Sale {
  id: number;
  saleNumber: number;
  cashRegisterId: number;
  userId: number;
  username: string;
  saleDate: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
}
