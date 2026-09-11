import { Product } from '../product/product.model';

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

export interface SaleItem {
  product: Product;
  quantity: number;
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  discount: number;
}

export interface SalePaymentRequest {
  paymentMethodId: number;
  amount: number;
}

export interface SaleRequest {
  cashRegisterId: number;
  items: SaleItemRequest[];
  discount: number;
  payments: SalePaymentRequest[];
}
