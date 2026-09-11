export interface Product {
  id: number;
  barcode: string;
  name: string;
  categoryId: number;
  categoryName: string;
  provider: string | null;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
