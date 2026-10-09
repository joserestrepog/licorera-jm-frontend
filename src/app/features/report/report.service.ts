import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { InventoryStock, SalesByDay, SalesByProduct, SalesReport } from './report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/reports';

  getSalesSummary(from: string, to: string): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.apiUrl}/sales/summary`, {
      params: {
        from,
        to,
      },
    });
  }

  getSalesByDay(from: string, to: string): Observable<SalesByDay[]> {
    return this.http.get<SalesByDay[]>(`${this.apiUrl}/sales/by-day`, {
      params: { from, to },
    });
  }

  getSalesByProduct(from: string, to: string): Observable<SalesByProduct[]> {
    return this.http.get<SalesByProduct[]>(`${this.apiUrl}/sales/by-product`, {
      params: {
        from,
        to,
      },
    });
  }

  getInventoryStock(): Observable<InventoryStock[]> {
    return this.http.get<InventoryStock[]>(`${this.apiUrl}/inventory/stock`);
  }
}
