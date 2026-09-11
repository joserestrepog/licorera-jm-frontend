import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Sale } from './sale.model';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/sales';

  findAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }
}
