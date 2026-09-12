import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

import { Sale, SaleItem, SaleRequest } from './sale.model';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/sales';

  private readonly saleItemsSubject = new BehaviorSubject<SaleItem[]>([]);
  private readonly discountSubject = new BehaviorSubject<number>(0);
  private readonly paymentMethodSubject = new BehaviorSubject<string>('EFECTIVO');

  readonly saleItems$ = this.saleItemsSubject.asObservable();
  readonly discount$ = this.discountSubject.asObservable();
  readonly paymentMethod$ = this.paymentMethodSubject.asObservable();

  findAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  create(request: SaleRequest): Observable<string> {
    return this.http.post(this.apiUrl, request, {
      responseType: 'text',
    });
  }

  getSaleItems(): SaleItem[] {
    return this.saleItemsSubject.value;
  }

  setSaleItems(items: SaleItem[]): void {
    this.saleItemsSubject.next([...items]);
  }

  getDiscount(): number {
    return this.discountSubject.value;
  }

  setDiscount(discount: number): void {
    this.discountSubject.next(discount);
  }

  getPaymentMethod(): string {
    return this.paymentMethodSubject.value;
  }

  setPaymentMethod(paymentMethod: string): void {
    this.paymentMethodSubject.next(paymentMethod);
  }

  clearDraft(): void {
    this.saleItemsSubject.next([]);
    this.discountSubject.next(0);
    this.paymentMethodSubject.next('EFECTIVO');
  }
}
