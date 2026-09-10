export interface InventoryEntryRequest {
  productId: number;
  quantity: number;
  purchasePrice: number;
  notes: string | null;
}