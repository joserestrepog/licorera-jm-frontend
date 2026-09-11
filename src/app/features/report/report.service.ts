import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SalesByProduct, SalesReport } from './report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/reports';

  getSalesSummary(from: string, to: string): Observable<SalesReport> {
    return this.http.get<SalesReport>(`${this.apiUrl}/sales/summary`, {
      params: {
        from,
        to,
      },
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
}
