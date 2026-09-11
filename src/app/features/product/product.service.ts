import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Product } from './product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/products';

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  findById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
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

  update(
    id: number,
    product: {
      barcode: string;
      name: string;
      categoryId: number;
      provider: string | null;
      purchasePrice: number;
      salePrice: number;
      minimumStock: number;
    },
  ): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  deactivate(id: number): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${id}`);
  }

  activate(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/activate`, {});
  }
}
