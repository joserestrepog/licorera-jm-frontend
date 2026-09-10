export interface InventoryEntry {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  quantity: number;
  purchasePrice: number;
  entryDate: string;
  userId: number;
  username: string;
  notes: string | null;
}
