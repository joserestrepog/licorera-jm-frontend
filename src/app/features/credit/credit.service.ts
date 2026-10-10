import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreditAccount, CreditPayment, CreditPaymentRequest } from './credit.model';

@Injectable({
  providedIn: 'root',
})
export class CreditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/credits';

  getCredits(): Observable<CreditAccount[]> {
    return this.http.get<CreditAccount[]>(this.apiUrl);
  }

  getCreditById(id: number): Observable<CreditAccount> {
    return this.http.get<CreditAccount>(`${this.apiUrl}/${id}`);
  }

  registerPayment(
    creditAccountId: number,
    request: CreditPaymentRequest,
  ): Observable<CreditPayment> {
    return this.http.post<CreditPayment>(`${this.apiUrl}/${creditAccountId}/payments`, request);
  }
}
