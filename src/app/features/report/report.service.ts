import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CollectionsByDay,
  CollectionsReport,
  InventoryStock,
  SalesByDay,
  SalesByProduct,
  SalesReport,
} from './report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/reports';

  getSalesSummary(from: string, to: string): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.apiUrl}/sales/summary`, {
      params: { from, to },
    });
  }

  getSalesByDay(from: string, to: string): Observable<SalesByDay[]> {
    return this.http.get<SalesByDay[]>(`${this.apiUrl}/sales/by-day`, {
      params: { from, to },
    });
  }

  getSalesByProduct(from: string, to: string): Observable<SalesByProduct[]> {
    return this.http.get<SalesByProduct[]>(`${this.apiUrl}/sales/by-product`, {
      params: { from, to },
    });
  }

  getCollectionsSummary(from: string, to: string): Observable<CollectionsReport> {
    return this.http.get<CollectionsReport>(`${this.apiUrl}/collections/summary`, {
      params: { from, to },
    });
  }

  getCollectionsByDay(from: string, to: string): Observable<CollectionsByDay[]> {
    return this.http.get<CollectionsByDay[]>(`${this.apiUrl}/collections/by-day`, {
      params: { from, to },
    });
  }

  getInventoryStock(): Observable<InventoryStock[]> {
    return this.http.get<InventoryStock[]>(`${this.apiUrl}/inventory/stock`);
  }
}
