export interface SalesReport {
  saleCount: number;
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
}

export interface SalesByProduct {
  productId: number;
  productName: string;
  barcode: string;
  quantitySold: number;
  totalSales: number;
  totalCost: number;
  profit: number;
}
