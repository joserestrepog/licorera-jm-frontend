import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/products';

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  create(product: {
    barcode: string;
    name: string;
    categoryId: number;
    provider: string | null;
    purchasePrice: number;
    salePrice: number;
    minimumStock: number;
  }): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }
}
