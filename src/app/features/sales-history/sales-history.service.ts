import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  SaleCancellationRequest,
  SalesHistorySale,
} from './sales-history.model';

@Injectable({
  providedIn: 'root',
})
export class SalesHistoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/sales';

  findAll(): Observable<SalesHistorySale[]> {
    return this.http.get<SalesHistorySale[]>(this.apiUrl);
  }

  findById(id: number): Observable<SalesHistorySale> {
    return this.http.get<SalesHistorySale>(`${this.apiUrl}/${id}`);
  }

  cancel(
    id: number,
    request: SaleCancellationRequest,
  ): Observable<SalesHistorySale> {
    return this.http.put<SalesHistorySale>(
      `${this.apiUrl}/${id}/cancel`,
      request,
    );
  }
}
