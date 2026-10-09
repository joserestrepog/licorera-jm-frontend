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

export interface InventoryStock {
  productId: number;
  productName: string;
  barcode: string;
  categoryName: string;
  currentStock: number;
  minimumStock: number;
  purchasePrice: number;
  stockValue: number;
}

export interface SalesByDay {
  saleDate: string;
  saleCount: number;
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
}
