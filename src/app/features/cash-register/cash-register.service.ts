import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CashRegister } from './cash-register.model';

@Injectable({
  providedIn: 'root',
})
export class CashRegisterService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/cash-registers';

  findAll(): Observable<CashRegister[]> {
    return this.http.get<CashRegister[]>(this.apiUrl);
  }

  findById(id: number): Observable<CashRegister> {
    return this.http.get<CashRegister>(`${this.apiUrl}/${id}`);
  }

  openCashRegister(request: {
    openingAmount: number;
    notes: string | null;
  }): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${this.apiUrl}/open`, request);
  }

  closeCashRegister(
    id: number,
    request: {
      countedCash: number;
      notes: string | null;
    },
  ): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${this.apiUrl}/${id}/close`, request);
  }
}
